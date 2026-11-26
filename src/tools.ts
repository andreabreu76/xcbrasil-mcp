import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ApiClient } from './client.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const modality = z.enum(['paraglider', 'hangglider']).describe('paraglider = parapente, hangglider = asa delta');
const flightId = z.string().uuid().describe('Id do voo (UUID), como vem em list_my_flights ou get_ranking');
const readOnly = { readOnlyHint: true, openWorldHint: true };

async function run(call: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    const data = await call();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: (error as Error).message }] };
  }
}

export function registerTools(server: McpServer, client: ApiClient): void {
  server.registerTool(
    'list_my_flights',
    {
      title: 'Listar meus voos',
      description:
        'Lista os voos do piloto dono do token, paginados (até 50 por página), com data, decolagem, pouso, equipamento, duração em minutos, distâncias em km, pontuação XC e altitude máxima. Use os filtros para recortar por período, decolagem ou modalidade.',
      inputSchema: {
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(50).optional(),
        dateFrom: isoDate.optional(),
        dateTo: isoDate.optional(),
        year: z.number().int().optional(),
        takeoff: z.string().max(200).optional().describe('Parte do nome da decolagem, sem diferenciar acento'),
        modality: modality.optional(),
        sortBy: z.enum(['date', 'score', 'distance', 'straightDistance', 'duration', 'maxAltitude']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      },
      annotations: readOnly,
    },
    async (args) => run(() => client.get('/api/v1/me/flights', args)),
  );

  server.registerTool(
    'get_flight',
    {
      title: 'Detalhe de um voo',
      description:
        'Devolve o detalhe de um voo: horários, altitudes, velocidades, razão de subida e de descida, pontuação XC, comentários. Com includeTrack=true inclui o trajeto simplificado (até 500 pontos com hora, posição, altitude, velocidade e razão de subida), útil para analisar térmicas e planeios.',
      inputSchema: {
        flightId,
        includeTrack: z.boolean().optional(),
      },
      annotations: readOnly,
    },
    async ({ flightId: id, includeTrack }) =>
      run(() => client.get(`/api/v1/flights/${id}`, { includeTrack: includeTrack ? 'true' : undefined })),
  );

  server.registerTool(
    'get_flight_analysis',
    {
      title: 'Análise de IA do voo',
      description:
        'Devolve a análise de IA mais recente que o XCBrasil gerou para o voo, ou analysis: null quando o voo ainda não tem análise.',
      inputSchema: { flightId },
      annotations: readOnly,
    },
    async ({ flightId: id }) => run(() => client.get(`/api/v1/flights/${id}/analysis`)),
  );

  server.registerTool(
    'get_stats_summary',
    {
      title: 'Resumo das minhas estatísticas',
      description:
        'Totais do piloto dono do token: número de voos, distância somada, horas voadas, médias, voo mais longo, mais distante e melhor pontuação. Aceita filtro por período, ano, decolagem e modalidade.',
      inputSchema: {
        dateFrom: isoDate.optional(),
        dateTo: isoDate.optional(),
        year: z.number().int().optional(),
        takeoff: z.string().max(200).optional(),
        modality: modality.optional(),
      },
      annotations: readOnly,
    },
    async (args) => run(() => client.get('/api/v1/me/stats/summary', args)),
  );

  server.registerTool(
    'get_stats_timeseries',
    {
      title: 'Evolução das minhas estatísticas',
      description:
        'Série temporal do piloto dono do token por dia, mês (padrão) ou ano: número de voos, horas por modalidade, duração média, maior distância em linha reta, melhor pontuação, maior razão de subida e altitude máxima.',
      inputSchema: {
        bucket: z.enum(['day', 'month', 'year']).optional(),
        from: isoDate.optional(),
        to: isoDate.optional(),
        year: z.number().int().optional(),
        takeoff: z.string().max(200).optional(),
        modality: modality.optional(),
      },
      annotations: readOnly,
    },
    async (args) => run(() => client.get('/api/v1/me/stats/timeseries', args)),
  );

  server.registerTool(
    'get_ranking',
    {
      title: 'Ranking do XCBrasil',
      description:
        'Ranking público. type=annual (padrão) soma as 5 melhores pontuações de cada piloto no ano; type=daily lista os melhores voos de uma data. Até 100 posições.',
      inputSchema: {
        type: z.enum(['annual', 'daily']).optional(),
        year: z.number().int().optional(),
        date: isoDate.optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: readOnly,
    },
    async (args) => run(() => client.get('/api/v1/ranking', args)),
  );
}
