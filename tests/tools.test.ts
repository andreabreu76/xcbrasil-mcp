import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerTools } from '../src/tools.js';
import { XcbrasilApiError } from '../src/client.js';

const FLIGHT_ID = '33333333-3333-4333-8333-333333333333';
const get = vi.fn();

async function connect() {
  const server = new McpServer({ name: 'xcbrasil', version: 'test' });
  registerTools(server, { get });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: 'test' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

function textOf(result: unknown): string {
  return (result as { content: Array<{ type: string; text: string }> }).content[0].text;
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ ok: true });
});

describe('ferramentas do MCP', () => {
  it('expõe só as seis ferramentas de leitura, todas descritas', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'get_flight',
      'get_flight_analysis',
      'get_ranking',
      'get_stats_summary',
      'get_stats_timeseries',
      'list_my_flights',
    ]);
    for (const tool of tools) {
      expect(tool.description?.length).toBeGreaterThan(30);
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it('list_my_flights repassa filtros para /api/v1/me/flights e devolve JSON', async () => {
    const client = await connect();
    get.mockResolvedValue({ flights: [], page: 1 });

    const result = await client.callTool({
      name: 'list_my_flights',
      arguments: { dateFrom: '2026-01-01', modality: 'paraglider', sortBy: 'score', limit: 10 },
    });

    expect(get).toHaveBeenCalledWith('/api/v1/me/flights', {
      dateFrom: '2026-01-01',
      modality: 'paraglider',
      sortBy: 'score',
      limit: 10,
    });
    expect(JSON.parse(textOf(result))).toEqual({ flights: [], page: 1 });
  });

  it('get_flight usa o id no caminho e só pede trajeto quando solicitado', async () => {
    const client = await connect();
    await client.callTool({ name: 'get_flight', arguments: { flightId: FLIGHT_ID } });
    expect(get).toHaveBeenLastCalledWith(`/api/v1/flights/${FLIGHT_ID}`, { includeTrack: undefined });

    await client.callTool({ name: 'get_flight', arguments: { flightId: FLIGHT_ID, includeTrack: true } });
    expect(get).toHaveBeenLastCalledWith(`/api/v1/flights/${FLIGHT_ID}`, { includeTrack: 'true' });
  });

  it('get_flight recusa id que não é UUID sem chamar a API', async () => {
    const client = await connect();
    const result = await client.callTool({ name: 'get_flight', arguments: { flightId: '../me/flights' } });
    expect(result.isError).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it('get_flight_analysis, estatísticas e ranking chamam as rotas certas', async () => {
    const client = await connect();
    await client.callTool({ name: 'get_flight_analysis', arguments: { flightId: FLIGHT_ID } });
    expect(get).toHaveBeenLastCalledWith(`/api/v1/flights/${FLIGHT_ID}/analysis`);

    await client.callTool({ name: 'get_stats_summary', arguments: { year: 2026 } });
    expect(get).toHaveBeenLastCalledWith('/api/v1/me/stats/summary', { year: 2026 });

    await client.callTool({ name: 'get_stats_timeseries', arguments: { bucket: 'year' } });
    expect(get).toHaveBeenLastCalledWith('/api/v1/me/stats/timeseries', { bucket: 'year' });

    await client.callTool({ name: 'get_ranking', arguments: { type: 'daily', date: '2026-11-20' } });
    expect(get).toHaveBeenLastCalledWith('/api/v1/ranking', { type: 'daily', date: '2026-11-20' });
  });

  it('erro da API volta como erro da ferramenta com a mensagem para o piloto', async () => {
    const client = await connect();
    get.mockRejectedValue(new XcbrasilApiError(403, 'INSUFFICIENT_SCOPE', 'Este token não tem permissão de leitura.'));

    const result = await client.callTool({ name: 'list_my_flights', arguments: {} });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toBe('Este token não tem permissão de leitura.');
  });
});
