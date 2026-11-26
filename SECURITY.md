# Segurança

## Como relatar uma vulnerabilidade

Não abra issue pública. Use o relato privado do GitHub: aba **Security**, botão **Report a vulnerability** neste repositório. A resposta inicial sai em até 7 dias.

## Escopo

Este pacote só lê dados pela API pública do XCBrasil com o token do próprio piloto. Ele não grava o token em disco, não registra o token em log e não envia nada além das consultas da API.

Falhas na API do XCBrasil em si também podem ser relatadas pelo mesmo canal.

## Boas práticas para quem usa

- Gere o token só com a opção "Ler meus voos e histórico" quando for usar com um assistente.
- Revogue o token no perfil do XCBrasil se suspeitar de vazamento; o acesso cai na hora.
- O token vale 30 dias. Não o coloque em repositório nem em arquivo compartilhado.
