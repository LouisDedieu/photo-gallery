interface Env {
  R2_BUCKET_NAME: string;
  D1_DATABASE_ID: string;
  ALERT_THRESHOLD: string;
  CF_API_TOKEN: string;
  DISCORD_WEBHOOK_URL: string;
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
  percentage: number;
}

// Limites gratuites Cloudflare
const FREE_LIMITS = {
  r2: {
    storage: 10 * 1024 * 1024 * 1024, // 10 GB en bytes
    classAOps: 1_000_000, // 1M ops/mois (PUT, POST, LIST)
    classBOps: 10_000_000, // 10M ops/mois (GET)
  },
  d1: {
    rowsRead: 5_000_000, // 5M/mois
    rowsWritten: 100_000, // 100K/mois
    storage: 5 * 1024 * 1024 * 1024, // 5 GB en bytes
  },
};

// Récupère l'Account ID depuis le token
async function getAccountId(apiToken: string): Promise<string> {
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await response.json()) as {
    success: boolean;
    result: Array<{ id: string }>;
  };
  if (!data.success || !data.result?.length) {
    throw new Error('Failed to get account ID');
  }

  return data.result[0].id;
}

// Récupère les métriques R2 via GraphQL
async function getR2Metrics(
  apiToken: string,
  accountId: string,
  bucketName: string
): Promise<UsageMetric[]> {
  const metrics: UsageMetric[] = [];

  // 1. Stockage R2 via REST API
  const storageResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const storageData = (await storageResponse.json()) as {
    success: boolean;
    result?: { location?: string };
    errors?: Array<{ message: string }>;
  };

  // 2. Métriques d'opérations R2 via GraphQL
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const graphqlQuery = {
    query: `
      query R2Analytics($accountId: String!, $startDate: Time!, $endDate: Time!) {
        viewer {
          accounts(filter: { accountTag: $accountId }) {
            r2OperationsAdaptiveGroups(
              filter: {
                datetime_geq: $startDate
                datetime_leq: $endDate
              }
              limit: 10000
            ) {
              sum {
                requests
              }
              dimensions {
                actionType
              }
            }
            r2StorageAdaptiveGroups(
              filter: {
                datetime_geq: $startDate
                datetime_leq: $endDate
              }
              limit: 1
            ) {
              max {
                payloadSize
                objectCount
              }
            }
          }
        }
      }
    `,
    variables: {
      accountId,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    },
  };

  const graphqlResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graphqlQuery),
  });

  const graphqlData = (await graphqlResponse.json()) as {
    data?: {
      viewer?: {
        accounts?: Array<{
          r2OperationsAdaptiveGroups?: Array<{
            sum: { requests: number };
            dimensions: { actionType: string };
          }>;
          r2StorageAdaptiveGroups?: Array<{
            max: { payloadSize: number; objectCount: number };
          }>;
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (graphqlData.data?.viewer?.accounts?.[0]) {
    const account = graphqlData.data.viewer.accounts[0];

    // Stockage
    const storageInfo = account.r2StorageAdaptiveGroups?.[0];
    if (storageInfo) {
      const storageBytes = storageInfo.max.payloadSize || 0;
      metrics.push({
        name: 'R2 Storage',
        current: storageBytes,
        limit: FREE_LIMITS.r2.storage,
        unit: 'bytes',
        percentage: (storageBytes / FREE_LIMITS.r2.storage) * 100,
      });
    }

    // Opérations
    const operations = account.r2OperationsAdaptiveGroups || [];
    let classAOps = 0;
    let classBOps = 0;

    for (const op of operations) {
      const action = op.dimensions.actionType;
      const count = op.sum.requests;

      // Class A: PUT, POST, LIST, etc.
      if (['PutObject', 'ListObjects', 'ListObjectsV2', 'CreateMultipartUpload'].includes(action)) {
        classAOps += count;
      }
      // Class B: GET, HEAD
      else if (['GetObject', 'HeadObject', 'HeadBucket'].includes(action)) {
        classBOps += count;
      }
    }

    metrics.push({
      name: 'R2 Class A Ops (PUT/LIST)',
      current: classAOps,
      limit: FREE_LIMITS.r2.classAOps,
      unit: 'ops',
      percentage: (classAOps / FREE_LIMITS.r2.classAOps) * 100,
    });

    metrics.push({
      name: 'R2 Class B Ops (GET)',
      current: classBOps,
      limit: FREE_LIMITS.r2.classBOps,
      unit: 'ops',
      percentage: (classBOps / FREE_LIMITS.r2.classBOps) * 100,
    });
  }

  return metrics;
}

// Récupère les métriques D1 via GraphQL
async function getD1Metrics(
  apiToken: string,
  accountId: string,
  databaseId: string
): Promise<UsageMetric[]> {
  const metrics: UsageMetric[] = [];

  if (!databaseId) {
    return metrics;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const graphqlQuery = {
    query: `
      query D1Analytics($accountId: String!, $databaseId: String!, $startDate: Time!, $endDate: Time!) {
        viewer {
          accounts(filter: { accountTag: $accountId }) {
            d1AnalyticsAdaptiveGroups(
              filter: {
                databaseId: $databaseId
                datetime_geq: $startDate
                datetime_leq: $endDate
              }
              limit: 10000
            ) {
              sum {
                readQueries
                writeQueries
                rowsRead
                rowsWritten
              }
            }
          }
        }
      }
    `,
    variables: {
      accountId,
      databaseId,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    },
  };

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(graphqlQuery),
  });

  const data = (await response.json()) as {
    data?: {
      viewer?: {
        accounts?: Array<{
          d1AnalyticsAdaptiveGroups?: Array<{
            sum: {
              readQueries: number;
              writeQueries: number;
              rowsRead: number;
              rowsWritten: number;
            };
          }>;
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.data?.viewer?.accounts?.[0]?.d1AnalyticsAdaptiveGroups) {
    const groups = data.data.viewer.accounts[0].d1AnalyticsAdaptiveGroups;
    let totalRowsRead = 0;
    let totalRowsWritten = 0;

    for (const group of groups) {
      totalRowsRead += group.sum.rowsRead;
      totalRowsWritten += group.sum.rowsWritten;
    }

    metrics.push({
      name: 'D1 Rows Read',
      current: totalRowsRead,
      limit: FREE_LIMITS.d1.rowsRead,
      unit: 'rows',
      percentage: (totalRowsRead / FREE_LIMITS.d1.rowsRead) * 100,
    });

    metrics.push({
      name: 'D1 Rows Written',
      current: totalRowsWritten,
      limit: FREE_LIMITS.d1.rowsWritten,
      unit: 'rows',
      percentage: (totalRowsWritten / FREE_LIMITS.d1.rowsWritten) * 100,
    });
  }

  // Stockage D1 via REST API
  const storageResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const storageData = (await storageResponse.json()) as {
    success: boolean;
    result?: { file_size?: number };
  };

  if (storageData.success && storageData.result?.file_size) {
    const storageBytes = storageData.result.file_size;
    metrics.push({
      name: 'D1 Storage',
      current: storageBytes,
      limit: FREE_LIMITS.d1.storage,
      unit: 'bytes',
      percentage: (storageBytes / FREE_LIMITS.d1.storage) * 100,
    });
  }

  return metrics;
}

// Formate les bytes en unité lisible
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Formate un nombre avec séparateurs
function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}

// Envoie une alerte Discord
async function sendDiscordAlert(webhookUrl: string, alerts: UsageMetric[]): Promise<void> {
  const embed = {
    title: '⚠️ Alerte Usage Cloudflare',
    description: 'Les métriques suivantes approchent de la limite gratuite :',
    color: 0xff9800, // Orange
    fields: alerts.map((alert) => ({
      name: alert.name,
      value: `**${alert.percentage.toFixed(1)}%** utilisé\n${
        alert.unit === 'bytes'
          ? `${formatBytes(alert.current)} / ${formatBytes(alert.limit)}`
          : `${formatNumber(alert.current)} / ${formatNumber(alert.limit)} ${alert.unit}`
      }`,
      inline: true,
    })),
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Usage Monitor Worker',
    },
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

// Envoie un rapport complet Discord (même sans alertes)
async function sendDiscordReport(webhookUrl: string, metrics: UsageMetric[]): Promise<void> {
  const getColor = (percentage: number) => {
    if (percentage >= 80) return '🔴';
    if (percentage >= 50) return '🟡';
    return '🟢';
  };

  const embed = {
    title: '📊 Rapport Usage Cloudflare',
    description: 'État actuel des métriques R2 et D1 :',
    color: 0x2196f3, // Bleu
    fields: metrics.map((metric) => ({
      name: `${getColor(metric.percentage)} ${metric.name}`,
      value: `**${metric.percentage.toFixed(1)}%** utilisé\n${
        metric.unit === 'bytes'
          ? `${formatBytes(metric.current)} / ${formatBytes(metric.limit)}`
          : `${formatNumber(metric.current)} / ${formatNumber(metric.limit)} ${metric.unit}`
      }`,
      inline: true,
    })),
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Usage Monitor Worker',
    },
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

export default {
  // Handler pour les requêtes HTTP (pour tests)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint de test pour déclencher manuellement
    if (url.pathname === '/__scheduled' || url.pathname === '/test') {
      await this.scheduled({} as ScheduledEvent, env, {} as ExecutionContext);
      return new Response('Monitoring check completed. Check Discord for results.', {
        status: 200,
      });
    }

    return new Response('Usage Monitor Worker\n\nGET /test - Run monitoring check manually', {
      status: 200,
    });
  },

  // Handler pour le CRON
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Starting usage monitoring check...');

    const threshold = parseInt(env.ALERT_THRESHOLD) || 80;

    try {
      // Récupérer l'Account ID
      const accountId = await getAccountId(env.CF_API_TOKEN);
      console.log(`Account ID: ${accountId}`);

      // Récupérer les métriques
      const [r2Metrics, d1Metrics] = await Promise.all([
        getR2Metrics(env.CF_API_TOKEN, accountId, env.R2_BUCKET_NAME),
        getD1Metrics(env.CF_API_TOKEN, accountId, env.D1_DATABASE_ID),
      ]);

      const allMetrics = [...r2Metrics, ...d1Metrics];
      console.log('Metrics collected:', JSON.stringify(allMetrics, null, 2));

      // Filtrer les métriques qui dépassent le seuil
      const alerts = allMetrics.filter((m) => m.percentage >= threshold);

      if (alerts.length > 0) {
        console.log(`${alerts.length} metrics above ${threshold}% threshold!`);
        await sendDiscordAlert(env.DISCORD_WEBHOOK_URL, alerts);
      } else {
        console.log(`All metrics below ${threshold}% threshold.`);
      }

      console.log('Usage monitoring check completed.');
    } catch (error) {
      console.error('Error during monitoring:', error);

      // Envoyer une alerte d'erreur
      if (env.DISCORD_WEBHOOK_URL) {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: '❌ Erreur Usage Monitor',
                description: `Une erreur s'est produite lors du monitoring:\n\`\`\`${error}\`\`\``,
                color: 0xf44336,
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      }
    }
  },
};
