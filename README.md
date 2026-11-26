# xcbrasil-mcp

Conector MCP para o piloto consultar os próprios voos do [XCBrasil](https://beta.xcbrasil.com.br) num assistente de IA, como o Claude. Só leitura: o conector não altera nem apaga nada.

Com ele o assistente consegue listar seus voos, abrir um voo (com o trajeto, se você pedir), ler a análise de IA do voo, ver suas estatísticas e a evolução delas e consultar o ranking.

## 1. Gere o token

No XCBrasil, abra o seu perfil, vá em **Tokens de API**, marque **Ler meus voos e histórico** e clique em **Gerar**. Copie o token na hora: ele não aparece de novo. O token vale 30 dias. Para cortar o acesso do assistente, revogue o token no mesmo lugar.

## 2. Configure o assistente

Precisa do Node.js 20 ou mais novo instalado.

### Claude Desktop

Em **Configurações > Desenvolvedor > Editar configuração**, acrescente ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xcbrasil": {
      "command": "npx",
      "args": ["-y", "xcbrasil-mcp"],
      "env": { "XCBRASIL_API_TOKEN": "COLE_SEU_TOKEN_AQUI" }
    }
  }
}
```

Feche e abra o Claude Desktop.

### Claude Code

```bash
claude mcp add xcbrasil --env XCBRASIL_API_TOKEN=COLE_SEU_TOKEN_AQUI -- npx -y xcbrasil-mcp
```

## 3. Peça

- "Liste meus voos de 2026 no Pico do Gavião."
- "Compare meus três voos mais longos deste ano."
- "Abra meu último voo com o trajeto e diga onde perdi mais altura."
- "Como evoluiu minha pontuação mês a mês?"

## Ferramentas

| Ferramenta | O que faz |
|---|---|
| `list_my_flights` | Seus voos, paginados (até 50), com filtros de período, decolagem, modalidade e ordenação |
| `get_flight` | Detalhe de um voo; `includeTrack` traz o trajeto simplificado |
| `get_flight_analysis` | Análise de IA mais recente do voo |
| `get_stats_summary` | Seus totais e recordes |
| `get_stats_timeseries` | Evolução por dia, mês ou ano |
| `get_ranking` | Ranking anual ou do dia |

## Variáveis

| Variável | Obrigatória | Padrão |
|---|---|---|
| `XCBRASIL_API_TOKEN` | sim | |
| `XCBRASIL_API_URL` | não | endereço de produção do XCBrasil |

## Limites

Até 300 consultas a cada 15 minutos por piloto. Se passar, o assistente recebe o aviso com o tempo de espera.

## Desenvolvimento

```bash
npm install --legacy-peer-deps
npm test
npm run build
```

## Publicação

Versões saem pelo GitHub Actions com trusted publishing (OIDC): não há token do npm guardado, e o pacote sai com provenance. Para lançar:

1. Por PR, suba a versão no `package.json` (`npm version patch --no-git-tag-version`).
2. Depois do merge, crie e envie a tag igual à versão: `git tag v0.1.1 && git push origin v0.1.1`.

O workflow `release.yml` confere que a tag bate com o `package.json`, roda typecheck, testes e build e publica.
