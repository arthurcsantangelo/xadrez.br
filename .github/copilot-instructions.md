# Diretrizes do Projeto - Xadrez Online
- Sempre utilizar ES Modules (`import`/`export`) no Node.js.
- Manter a lógica de validação de regras de xadrez centralizada no servidor (`chess.js`) para evitar trapaças no client-side.
- Manter o front-end sem frameworks pesados (apenas HTML, CSS e JS puro).
- Não alterar arquivos de configuração como `.env` ou `.gitignore` sem avisar.
- O banco local SQLite guarda contas, sessões, partidas e saldos em `data/xadrez.sqlite`; nunca versionar esse arquivo nem expor hashes de senha ou tokens.
- Contas novas começam com 10 moedas de ouro e 0 rubis.
- Recompensas são calculadas exclusivamente no servidor para partidas multiplayer concluídas e validadas: vitória = 5 moedas, empate = 2 moedas para cada jogador e derrota = 0 moedas.
- Cada 10 vitórias multiplayer concedem 1 rubi. Não confiar em saldos, resultados ou pedidos de prêmio enviados pelo cliente.
- Partidas contra bots não concedem moeda/rubi enquanto seu resultado não for validado pelo servidor.
