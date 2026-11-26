export const DEFAULT_BASE_URL = 'https://backend-flight-controller-api-fjw4q.ondigitalocean.app';

export interface Config {
  token: string;
  baseUrl: string;
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const token = env.XCBRASIL_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Defina XCBRASIL_API_TOKEN com um token gerado no perfil do XCBrasil (Tokens de API, opção "Ler meus voos e histórico").',
    );
  }
  const baseUrl = (env.XCBRASIL_API_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');
  return { token, baseUrl };
}
