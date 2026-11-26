export type Query = Record<string, string | number | boolean | undefined>;

export interface ApiClient {
  get(path: string, query?: Query): Promise<unknown>;
}

export class XcbrasilApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'XcbrasilApiError';
  }
}

function messageFor(status: number, body: { error?: string; code?: string }, retryAfter: string | null): string {
  if (status === 401) {
    return 'Token inválido, expirado ou revogado. Gere um novo token no perfil do XCBrasil.';
  }
  if (status === 403) {
    return 'Este token não tem permissão de leitura. Gere um token com a opção "Ler meus voos e histórico" no perfil do XCBrasil.';
  }
  if (status === 429) {
    return `Limite de consultas atingido. Tente de novo em ${retryAfter ?? 'alguns'} segundos.`;
  }
  return body.error || `Erro ${status} ao consultar o XCBrasil.`;
}

export function createClient(options: { baseUrl: string; token: string; fetch?: typeof fetch }): ApiClient {
  const doFetch = options.fetch ?? fetch;

  return {
    async get(path, query = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value));
      }
      const qs = params.toString();
      const url = `${options.baseUrl}${path}${qs ? `?${qs}` : ''}`;

      let res: Response;
      try {
        res = await doFetch(url, {
          headers: { authorization: `Bearer ${options.token}`, accept: 'application/json' },
        });
      } catch (error) {
        throw new XcbrasilApiError(0, 'NETWORK_ERROR', `Não foi possível falar com o XCBrasil: ${(error as Error).message}`);
      }

      const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        throw new XcbrasilApiError(res.status, body.code, messageFor(res.status, body, res.headers.get('retry-after')));
      }
      return body;
    },
  };
}
