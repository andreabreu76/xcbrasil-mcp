import { describe, it, expect } from 'vitest';
import { DEFAULT_BASE_URL, loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('exige o token', () => {
    expect(() => loadConfig({})).toThrow(/XCBRASIL_API_TOKEN/);
    expect(() => loadConfig({ XCBRASIL_API_TOKEN: '  ' })).toThrow(/XCBRASIL_API_TOKEN/);
  });

  it('usa a URL de produção por padrão', () => {
    expect(loadConfig({ XCBRASIL_API_TOKEN: 'tok' })).toEqual({ token: 'tok', baseUrl: DEFAULT_BASE_URL });
  });

  it('aceita outra URL e tira a barra final', () => {
    expect(loadConfig({ XCBRASIL_API_TOKEN: 'tok', XCBRASIL_API_URL: 'http://localhost:5172/' }).baseUrl).toBe(
      'http://localhost:5172',
    );
  });
});
