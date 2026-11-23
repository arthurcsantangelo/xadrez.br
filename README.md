# ♟️ Xadrez.br - Xadrez Online Multiplayer em Tempo Real

Plataforma de Xadrez Online Multiplayer desenvolvida com foco em alta performance, comunicação bidirecional em tempo real via **WebSockets**, validação autoritativa anti-trapaça no servidor e arquitetura modular preparada para persistência de dados.

---

## 🚀 Tecnologias Utilizadas

### Back-end
- **Node.js** (com suporte nativo a ES Modules `"type": "module"`)
- **Express.js** (servidor HTTP e entrega de assets estáticos)
- **Socket.io** (comunicação em tempo real, gestão de salas e broadcasting de eventos)
- **chess.js** (motor autoritativo de validação de regras de xadrez, detecção de xeque, xeque-mate, afogamento e geração de PGN/FEN)

### Front-end
- **HTML5 & CSS3 Moderno** (tema escuro elegante, responsivo, micro-interações e feedback visual)
- **JavaScript Vanilla** (sem frameworks pesados ou etapas complexas de build)
- **chessboard.js** (interface gráfica do tabuleiro e interação drag-and-drop)
- **chess.js via CDN** (validação imediata no cliente para fluidez de UX)
- **Web Audio API** (efeitos sonoros nativos sintetizados no navegador para movimentos, capturas, xeque e final de partida)

---

## 📁 Estrutura do Projeto

```text
xadrez.br/
├── .gitignore                  # Arquivos e pastas ignorados pelo Git
├── package.json                # Dependências, scripts (start, dev, test) e metadados
├── README.md                   # Documentação completa do projeto
├── server.js                   # Ponto de entrada Express + HTTP + Socket.io
├── src/
│   ├── services/
│   │   └── database.js         # Contas, sessões, partidas e economia em SQLite
│   └── sockets/
│       └── gameHandler.js      # Lógica das salas, validação autoritativa e eventos Socket.io
└── public/
    ├── index.html              # Interface do Lobby e Arena de Jogo
    ├── css/
    │   └── style.css           # Estilização completa com Dark Theme refinado
    └── js/
        └── client.js           # Lógica do cliente, conexão Socket.io e controle do tabuleiro
```

---

## 🎯 Funcionalidades Implementadas (Fase 1)

1. **🏆 Passe de Batalha & Coleta de Skins (Gamificação):**
   - Cada peça adversária capturada em partida (contra Bot ou Multiplayer) concede **+1 Ponto de Maestria**.
   - A cada **10 pontos acumulados**, você sobe de nível e desbloqueia uma nova skin ou tema exclusivo:
     - Nível 2 (10 pts): **Neo Vector (Lichess Cburnett)**
     - Nível 3 (20 pts): **Tabuleiro Madeira Nobre**
     - Nível 4 (30 pts): **Mérida Elegance**
     - Nível 5 (40 pts): **Tabuleiro Midnight Cyber**
     - Nível 6 (50 pts): **Alpha Tournament**
     - Nível 7 (60 pts): **Tabuleiro Oceano Profundo**
     - Nível 8 (70 pts): **Dubrovnik Histórico**
     - Nível 9 (80 pts): **Tabuleiro Ametista Real**
   - Modal com trilha de recompensas, barra de progresso em tempo real e botão para equipar recompensas desbloqueadas.

2. **🎨 Sistema de Skins & Customização Peça por Peça:**
   - 6 esquemas de cores de tabuleiro (Verde Torneio, Madeira Nobre, Oceano Profundo, Midnight Cyber, Grafite Minimalista, Ametista Real).
   - 5 pacotes de peças em alta definição vetorial (SVG).
   - **Customização Peça por Peça (Mix & Match):** Escolha o visual individual de cada peça (ex: Rei Mérida, Torres Alpha, Peões Cburnett).

3. **🤖 Modo contra Bot (Inteligência Artificial Offline):**
   - Jogue diretamente no navegador sem depender de servidor ou de outro jogador.
   - 3 níveis de desafio:
     - 🟢 **Iniciante:** comete erros leves e foca em trocas básicas.
     - 🟡 **Intermediário:** algoritmo Minimax avaliando material e posições estratégicas.
     - 🔴 **Mestre:** Minimax com profundidade 3, **Poda Alfa-Beta** e tabelas de valores posicionais (*Piece-Square Tables*).
   - Escolha livre de cores: jogue de **Brancas** (você começa) ou de **Pretas** (o Bot faz o primeiro lance!).

4. **🌐 Sistema Dinâmico de Salas Multiplayer:**
   - Criação de salas com código curto exclusivo de 6 caracteres (ex: `A7B9X2`).
   - Entrada via digitação de código ou acesso direto por link compartilhado (`?room=CODIGO`).
   - Atribuição automática de papéis: Brancas, Pretas e Espectadores.

5. **Validação Autoritativa Anti-Trapaça:**
   - O servidor valida autoritativamente a vez do jogador e o lance via `chess.js` antes de atualizar o estado oficial da partida.
   - Bloqueio estrito de movimentos fora de turno ou de peças do oponente.
   - Detecção e badges automáticos de **Xeque**, **Xeque-mate**, **Afogamento** e empates.
   - Efeitos sonoros sintetizados nativamente via **Web Audio API** (sem arquivos externos).
   - Desistência e Revanche com inversão de cores.

6. **👤 Contas e Economia Persistente:**
   - Cadastro e login disponíveis na tela de amizades; senhas armazenadas com hash e sal, com sessão protegida por cookie.
   - Contas novas começam com **10 moedas de ouro** e **0 rubis**.
   - No multiplayer validado pelo servidor: vitória concede **5 moedas**, empate **2 moedas para cada jogador** e derrota **0 moedas**.
   - Cada **10 vitórias multiplayer** concede **1 rubi**. Partidas contra bots não concedem moedas ou rubis.
   - Contas, sessões, saldos e partidas são armazenados em `data/xadrez.sqlite`, ignorado pelo Git.

---

## 🛠️ Como Instalar e Rodar Localmente

### Pré-requisitos
- **Node.js** instalado (versão 22.5.0 ou superior, necessária para o SQLite nativo).
- **npm** (incluso com o Node.js).

### 1. Clonar o Repositório e Acessar a Pasta
```bash
cd xadrez.br
```

### 2. Instalar as Dependências
Execute o comando abaixo no terminal para instalar o `express`, `socket.io`, `chess.js` e o `nodemon`:
```bash
npm install
```

### Executar os testes
```bash
npm test
```

### 3. Iniciar o Servidor

#### Modo de Desenvolvimento (com auto-reload via Nodemon):
```bash
npm run dev
```

#### Modo de Produção:
```bash
npm start
```

O servidor iniciará na porta `3000`. Você verá a mensagem:
```text
======================================================
♟️  XADREZ.BR - SERVIDOR MULTIPLAYER EM TEMPO REAL
🚀 Servidor rodando com sucesso em: http://localhost:3000
⚡ WebSockets ativos e aguardando conexões!
======================================================
```

---

## 🧪 Como Testar o Multiplayer Localmente

1. Abra seu navegador em `http://localhost:3000`.
2. Insira o nome do **Jogador 1** e clique em **"Criar Nova Sala"**.
3. O tabuleiro carregará com as peças **Brancas** e um código de 6 caracteres será exibido no topo (ex: `K9X2M1`).
4. Clique no botão **"🔗 Copiar Link"** ou anote o código.
5. Abra uma **nova janela anônima** (ou outro navegador como Firefox, Edge ou Chrome).
6. Cole o link copiado (ex: `http://localhost:3000/?room=K9X2M1`) ou acesse a página inicial e insira o código no campo de entrada.
7. O **Jogador 2** entrará com as peças **Pretas**, com o tabuleiro invertido automaticamente para sua perspectiva!
8. Mova os peões e peças em ambas as janelas e veja a sincronização fluida em tempo real.

---

## 💾 Persistência local

O SQLite é inicializado automaticamente pelo servidor em `data/xadrez.sqlite`. O caminho pode ser alterado com `XADREZ_DATABASE_PATH`. Não apague nem compartilhe esse arquivo: ele contém as contas e o histórico local.
