/**
 * @file server.js
 * @description Ponto de entrada da aplicação Xadrez Online Multiplayer em tempo real.
 * Utiliza Express.js para servir os arquivos estáticos e Socket.io para comunicação bidirecional.
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupGameSockets } from './src/sockets/gameHandler.js';
import {
  cadastrarConta,
  entrarNaConta,
  obterContaDaSessao,
  encerrarSessao,
  atualizarNomeConta,
  fecharBanco
} from './src/services/database.js';

// Resolve __dirname em ambiente ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Inicializa Socket.io com configurações seguras e flexíveis
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const SESSION_COOKIE = 'xadrez_session';

// Middleware para parsing de JSON e arquivos estáticos da pasta public
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

function getSessionToken(cookieHeader) {
  const sessionCookie = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  return sessionCookie?.slice(SESSION_COOKIE.length + 1) || null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

app.post('/api/auth/register', (req, res) => {
  try {
    const result = cadastrarConta(req.body?.username, req.body?.password);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    setSessionCookie(res, result.session.token);
    return res.status(201).json({ account: result.account });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return res.status(500).json({ error: 'Não foi possível criar a conta.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const result = entrarNaConta(req.body?.username, req.body?.password);
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    setSessionCookie(res, result.session.token);
    return res.json({ account: result.account });
  } catch (error) {
    console.error('Erro ao entrar na conta:', error);
    return res.status(500).json({ error: 'Não foi possível entrar na conta.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    encerrarSessao(getSessionToken(req.headers.cookie));
    clearSessionCookie(res);
    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error);
    return res.status(500).json({ error: 'Não foi possível encerrar a sessão.' });
  }
});

app.patch('/api/auth/me', (req, res) => {
  try {
    const result = atualizarNomeConta(
      getSessionToken(req.headers.cookie),
      req.body?.username
    );
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ account: result.account });
  } catch (error) {
    console.error('Erro ao atualizar nome da conta:', error);
    return res.status(500).json({ error: 'Não foi possível atualizar o nome.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const account = obterContaDaSessao(getSessionToken(req.headers.cookie));
    return res.json({ account });
  } catch (error) {
    console.error('Erro ao consultar a conta:', error);
    return res.status(500).json({ error: 'Não foi possível consultar a conta.' });
  }
});

// Rota de verificação de status da aplicação
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'xadrez.br',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Fallback SPA: Qualquer rota não reconhecida serve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.use((socket, next) => {
  try {
    socket.data.account = obterContaDaSessao(getSessionToken(socket.handshake.headers.cookie));
    next();
  } catch (error) {
    console.error('Erro ao autenticar conexão multiplayer:', error);
    next(new Error('Não foi possível validar a conta.'));
  }
});

// Inicializa os handlers de socket para os jogos
setupGameSockets(io);

// Inicialização do servidor
server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('♟️  XADREZ.BR - SERVIDOR MULTIPLAYER EM TEMPO REAL');
  console.log(`🚀 Servidor rodando com sucesso em: http://localhost:${PORT}`);
  console.log('⚡ WebSockets ativos e aguardando conexões!');
  console.log('======================================================\n');
});

// Encerramento gracioso do servidor
function shutdown() {
  console.log('Encerrando servidor HTTP graciosamente...');
  server.close(() => {
    fecharBanco();
    console.log('Servidor encerrado.');
  });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
