import { describe, it, expect, vi } from 'vitest';
import { createClient, XcbrasilApiError } from '../src/client.js';

function fakeFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers }));
}

describe('createClient', () => {
  it('monta a URL com query, sem valores vazios, e manda o token', async () => {
    const fetch = fakeFetch(200, { ok: true });
    const client = createClient({ baseUrl: 'https://api.test', token: 'tok', fetch });

    await expect(client.get('/api/v1/me/flights', { page: 2, takeoff: 'Gavião', year: undefined })).resolves.toEqual({
      ok: true,
    });

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.test/api/v1/me/flights?page=2&takeoff=Gavi%C3%A3o');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
  });

  it.each([
    [401, { code: 'INVALID_API_TOKEN' }, {}, /revogado|expirado|Gere um novo token/],
    [403, { code: 'INSUFFICIENT_SCOPE' }, {}, /leitura/],
    [429, { code: 'RATE_LIMITED' }, { 'retry-after': '120' }, /120 segundos/],
    [404, { code: 'FLIGHT_NOT_FOUND', error: 'Voo não encontrado' }, {}, /Voo não encontrado/],
    [500, { error: 'boom' }, {}, /boom/],
  ])('erro %i vira mensagem para o piloto', async (status, body, headers, message) => {
    const client = createClient({ baseUrl: 'https://api.test', token: 'tok', fetch: fakeFetch(status, body, headers) });
    const error = (await client.get('/x').catch((e: unknown) => e)) as XcbrasilApiError;
    expect(error).toBeInstanceOf(XcbrasilApiError);
    expect(error.status).toBe(status);
    expect(error.message).toMatch(message);
  });

  it('falha de rede vira mensagem clara', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const client = createClient({ baseUrl: 'https://api.test', token: 'tok', fetch });
    await expect(client.get('/x')).rejects.toThrow(/Não foi possível falar com o XCBrasil/);
  });
});
