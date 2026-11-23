/**
 * @file gameHandler.js
 * @description Gerenciamento de eventos Socket.io e lógica autoritativa de partidas de Xadrez.
 * 
 * Regras implementadas:
 * - Sistema de salas por código curto (6 caracteres)
 * - Atribuição automática: 1º entra com Brancas, 2º com Pretas, 3º+ como Espectador
 * - Validação autoritativa anti-trapaça via chess.js
 * - Bloqueio de lances fora do turno ou por peças do oponente
 * - Desistência e sistema de revanche com inversão de cores
 * - Gatilho automático para salvar a partida finalizada no databaseService
 */

import * as chessModule from 'chess.js';
import { salvarPartida } from '../services/database.js';

// Resolve compatibilidade entre diferentes builds do chess.js (ESM / CJS)
const Chess = chessModule.Chess || chessModule.default?.Chess || chessModule.default;

// Map em memória contendo o estado de todas as salas ativas
// chave: roomId (ex: "X8K2M1"), valor: Objeto Sala
const rooms = new Map();

// Mapeia socket.id -> { roomId, role } para desassociação rápida em desconexões
const socketSessions = new Map();

/**
 * Funções auxiliares para manter compatibilidade com chess.js v0.13 e v1.x
 */
export function isCheck(game) {
  if (typeof game.isCheck === 'function') return game.isCheck();
  if (typeof game.in_check === 'function') return game.in_check();
  return false;
}

export function isCheckmate(game) {
  if (typeof game.isCheckmate === 'function') return game.isCheckmate();
  if (typeof game.in_checkmate === 'function') return game.in_checkmate();
  return false;
}

export function isDraw(game) {
  if (typeof game.isDraw === 'function') return game.isDraw();
  if (typeof game.in_draw === 'function') return game.in_draw();
  return false;
}

export function isStalemate(game) {
  if (typeof game.isStalemate === 'function') return game.isStalemate();
  if (typeof game.in_stalemate === 'function') return game.in_stalemate();
  return false;
}

export function isGameOver(game) {
  if (typeof game.isGameOver === 'function') return game.isGameOver();
  if (typeof game.game_over === 'function') return game.game_over();
  return false;
}

/**
 * Gera um código alfanumérico curto e amigável de 6 caracteres.
 * @returns {string} Código da sala (ex: "A8Y9K2")
 */
function gerarCodigoSala() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem O, 0, I, 1 para evitar confusão visual
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(indice);
  }
  return codigo;
}

/**
 * Retorna os dados públicos da sala para sincronização segura com os clientes.
 * @param {Object} room
 * @returns {Object}
 */
function serializarSala(room) {
  return {
    roomId: room.id,
    fen: room.game.fen(),
    turn: room.game.turn(),
    isCheck: isCheck(room.game),
    isGameOver: isGameOver(room.game),
    status: room.status,
    winner: room.winner,
    winReason: room.winReason,
    players: {
      white: room.players.white ? { id: room.players.white.id, name: room.players.white.name, connected: room.players.white.connected } : null,
      black: room.players.black ? { id: room.players.black.id, name: room.players.black.name, connected: room.players.black.connected } : null
    },
    spectatorCount: room.spectators.length,
    history: room.history
  };
}

/**
 * Finaliza a partida, atualiza o status da sala e aciona o databaseService.
 * @param {Object} room
 * @param {'white' | 'black' | 'draw'} winner
 * @param {string} reason
 */
async function finalizarPartida(io, room, winner, reason) {
  room.status = 'finished';
  room.winner = winner;
  room.winReason = reason;
  room.endTime = new Date().toISOString();

  // Dados consolidados para salvar no banco
  const dadosPartida = {
    id: `${room.id}-${Date.now()}`,
    roomId: room.id,
    dataInicio: room.startTime || new Date().toISOString(),
    dataFim: room.endTime,
    vencedor: winner,
    motivoVitoria: reason,
    jogadorBrancas: {
      id: room.players.white?.id || 'anonimo_w',
      nome: room.players.white?.name || 'Jogador Brancas',
      usuarioId: room.players.white?.userId || null
    },
    jogadorPretas: {
      id: room.players.black?.id || 'anonimo_b',
      nome: room.players.black?.name || 'Jogador Pretas',
      usuarioId: room.players.black?.userId || null
    },
    pgn: room.game.pgn(),
    fenFinal: room.game.fen(),
    totalLances: room.history.length,
    historico: room.history
  };

  // Aciona persistência desacoplada
  const resultado = await salvarPartida(dadosPartida);
  if (!resultado.sucesso || resultado.duplicada) return resultado;

  for (const [color, player] of [
    ['white', room.players.white],
    ['black', room.players.black]
  ]) {
    const reward = resultado.recompensas[color];
    if (player?.id && reward) {
      io.to(player.id).emit('economy_updated', {
        account: reward.conta,
        coinsEarned: reward.moedasRecebidas,
        rubiesEarned: reward.rubisRecebidos
      });
    }
  }

  return resultado;
}

/**
 * Registra todos os manipuladores de eventos do Socket.io.
 * @param {import('socket.io').Server} io
 */
export function setupGameSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket Conectado] ID: ${socket.id}`);

    /**
     * Criar Nova Sala
     */
    socket.on('create_room', ({ playerName }) => {
      try {
        let roomId = gerarCodigoSala();
        while (rooms.has(roomId)) {
          roomId = gerarCodigoSala();
        }

        const nome = (playerName && playerName.trim()) ? playerName.trim() : 'Jogador 1';

        const novaSala = {
          id: roomId,
          game: new Chess(),
          players: {
            white: { id: socket.id, name: nome, userId: socket.data.account?.id || null, connected: true },
            black: null
          },
          spectators: [],
          status: 'waiting', // aguardando segundo jogador
          winner: null,
          winReason: null,
          startTime: null,
          endTime: null,
          rematchRequests: new Set(),
          history: []
        };

        rooms.set(roomId, novaSala);
        socketSessions.set(socket.id, { roomId, role: 'white' });
        socket.join(roomId);

        console.log(`🏠 [Sala Criada] Código: ${roomId} por ${nome} (Brancas)`);

        // Responde ao criador
        socket.emit('room_joined', {
          role: 'white',
          room: serializarSala(novaSala),
          message: 'Sala criada com sucesso! Aguardando oponente...'
        });
      } catch (err) {
        console.error('Erro ao criar sala:', err);
        socket.emit('game_error', { message: 'Erro interno ao criar sala.' });
      }
    });

    /**
     * Entrar em Sala Existente
     */
    socket.on('join_room', ({ roomId, playerName }) => {
      try {
        if (!roomId) {
          socket.emit('game_error', { message: 'Código de sala inválido.' });
          return;
        }

        const codigoFormatado = roomId.trim().toUpperCase();
        const room = rooms.get(codigoFormatado);

        if (!room) {
          socket.emit('game_error', { message: `Sala "${codigoFormatado}" não encontrada.` });
          return;
        }

        const accountId = socket.data.account?.id;
        if (accountId && [room.players.white, room.players.black].some((player) => player?.userId === accountId)) {
          socket.emit('game_error', { message: 'A mesma conta não pode ocupar os dois lados da sala.' });
          return;
        }

        const nome = (playerName && playerName.trim()) ? playerName.trim() : `Jogador ${socket.id.substring(0, 4)}`;

        let assignedRole = 'spectator';

        // Lógica de atribuição de papéis:
        // 1. Se Brancas estiver vago (ou desconectado), ocupa Brancas
        if (!room.players.white || !room.players.white.connected) {
          room.players.white = { id: socket.id, name: nome, userId: socket.data.account?.id || null, connected: true };
          assignedRole = 'white';
        }
        // 2. Se Brancas ocupado e Pretas vago (ou desconectado), ocupa Pretas
        else if (!room.players.black || !room.players.black.connected) {
          room.players.black = { id: socket.id, name: nome, userId: socket.data.account?.id || null, connected: true };
          assignedRole = 'black';
        }
        // 3. Caso ambos já estejam ocupados, vira Espectador
        else {
          room.spectators.push({ id: socket.id, name: nome });
          assignedRole = 'spectator';
        }

        // Se ambos os jogadores estão presentes e o jogo estava esperando, inicia a partida!
        if (room.players.white?.connected && room.players.black?.connected && room.status === 'waiting') {
          room.status = 'playing';
          room.startTime = new Date().toISOString();
          console.log(`⚔️ [Partida Iniciada] Sala ${codigoFormatado}: ${room.players.white.name} (B) vs ${room.players.black.name} (P)`);
        }

        socketSessions.set(socket.id, { roomId: codigoFormatado, role: assignedRole });
        socket.join(codigoFormatado);

        // Notifica o cliente que entrou
        socket.emit('room_joined', {
          role: assignedRole,
          room: serializarSala(room),
          message: assignedRole === 'spectator' 
            ? 'Você entrou como Espectador nesta partida.' 
            : `Você entrou como ${assignedRole === 'white' ? 'Brancas' : 'Pretas'}!`
        });

        // Notifica toda a sala da atualização
        io.to(codigoFormatado).emit('room_updated', {
          room: serializarSala(room),
          notification: `${nome} entrou como ${assignedRole === 'white' ? 'Brancas' : (assignedRole === 'black' ? 'Pretas' : 'Espectador')}.`
        });
      } catch (err) {
        console.error('Erro ao entrar na sala:', err);
        socket.emit('game_error', { message: 'Erro interno ao entrar na sala.' });
      }
    });

    /**
     * Realizar Lance (Movimento de Peça)
     */
    socket.on('make_move', async ({ roomId, from, to, promotion }) => {
      try {
        const codigoFormatado = roomId?.trim().toUpperCase();
        const room = rooms.get(codigoFormatado);

        if (!room) {
          socket.emit('move_error', { message: 'Sala não encontrada.' });
          return;
        }

        if (room.status !== 'playing') {
          socket.emit('move_error', { message: 'A partida não está em andamento.' });
          return;
        }

        // 1. Verificação de permissão e turno (Anti-trapaça)
        const turnColor = room.game.turn() === 'w' ? 'white' : 'black';
        const expectedPlayer = room.players[turnColor];

        if (!expectedPlayer || expectedPlayer.id !== socket.id) {
          socket.emit('move_error', { 
            message: 'Não é o seu turno ou você não possui permissão para mover peças.' 
          });
          return;
        }

        // 2. Validação autoritativa do lance no chess.js do servidor
        const moveAttempt = {
          from,
          to,
          promotion: promotion || 'q' // Promoção padrão para dama
        };

        const moveResult = room.game.move(moveAttempt);

        if (!moveResult) {
          socket.emit('move_error', { message: 'Lance ilegal de acordo com as regras oficiais.' });
          return;
        }

        // Lance aceito! Registra no histórico
        room.history.push({
          from: moveResult.from,
          to: moveResult.to,
          san: moveResult.san,
          color: moveResult.color,
          piece: moveResult.piece,
          flags: moveResult.flags
        });

        // 3. Checagem de finalização de jogo
        const finished = isGameOver(room.game);
        let winner = null;
        let reason = null;

        if (finished) {
          if (isCheckmate(room.game)) {
            // O jogador que acabou de mover deu xeque-mate!
            winner = moveResult.color === 'w' ? 'white' : 'black';
            reason = 'Xeque-mate';
          } else if (isStalemate(room.game)) {
            winner = 'draw';
            reason = 'Empate por afogamento (Stalemate)';
          } else if (isDraw(room.game)) {
            winner = 'draw';
            reason = 'Empate (Regra dos 50 lances / Repetição / Material insuficiente)';
          } else {
            winner = 'draw';
            reason = 'Fim de jogo';
          }

          await finalizarPartida(io, room, winner, reason);
        }

        // 4. Emite para todos os participantes e espectadores da sala
        io.to(codigoFormatado).emit('move_made', {
          move: moveResult,
          fen: room.game.fen(),
          turn: room.game.turn(),
          isCheck: isCheck(room.game),
          isGameOver: finished,
          gameResult: finished ? { winner, reason } : null,
          history: room.history,
          lastMove: { from, to }
        });
      } catch (err) {
        console.error('Erro ao processar lance:', err);
        socket.emit('move_error', { message: 'Erro interno ao validar lance.' });
      }
    });

    /**
     * Desistir da Partida
     */
    socket.on('resign_game', async ({ roomId }) => {
      try {
        const codigoFormatado = roomId?.trim().toUpperCase();
        const room = rooms.get(codigoFormatado);

        if (!room || room.status !== 'playing') {
          return;
        }

        let resignedRole = null;
        if (room.players.white?.id === socket.id) resignedRole = 'white';
        else if (room.players.black?.id === socket.id) resignedRole = 'black';

        if (!resignedRole) {
          socket.emit('game_error', { message: 'Espectadores não podem desistir.' });
          return;
        }

        const winner = resignedRole === 'white' ? 'black' : 'white';
        const reason = `Desistência do jogador das ${resignedRole === 'white' ? 'Brancas' : 'Pretas'}`;

        await finalizarPartida(io, room, winner, reason);

        io.to(codigoFormatado).emit('game_ended', {
          winner,
          reason,
          fen: room.game.fen(),
          status: 'finished'
        });
      } catch (err) {
        console.error('Erro ao processar desistência:', err);
      }
    });

    /**
     * Pedido de Revanche
     */
    socket.on('request_rematch', ({ roomId }) => {
      try {
        const codigoFormatado = roomId?.trim().toUpperCase();
        const room = rooms.get(codigoFormatado);

        if (!room || room.status !== 'finished') {
          return;
        }

        const isWhite = room.players.white?.id === socket.id;
        const isBlack = room.players.black?.id === socket.id;

        if (!isWhite && !isBlack) {
          return; // Apenas jogadores participam do rematch
        }

        room.rematchRequests.add(socket.id);

        const requesterName = isWhite ? room.players.white.name : room.players.black.name;

        // Se ambos concordaram com a revanche: reinicia a partida invertendo as cores!
        const whiteId = room.players.white?.id;
        const blackId = room.players.black?.id;

        if (whiteId && blackId && room.rematchRequests.has(whiteId) && room.rematchRequests.has(blackId)) {
          // Inverte as cores para alternância justa
          const tempWhite = room.players.white;
          room.players.white = room.players.black;
          room.players.black = tempWhite;

          // Atualiza o mapeamento de sessão
          socketSessions.set(room.players.white.id, { roomId: codigoFormatado, role: 'white' });
          socketSessions.set(room.players.black.id, { roomId: codigoFormatado, role: 'black' });

          // Reinicia tabuleiro
          room.game.reset();
          room.status = 'playing';
          room.winner = null;
          room.winReason = null;
          room.startTime = new Date().toISOString();
          room.endTime = null;
          room.history = [];
          room.rematchRequests.clear();

          console.log(`🔄 [Revanche Iniciada] Sala ${codigoFormatado}: ${room.players.white.name} (B) vs ${room.players.black.name} (P)`);

          // Notifica os jogadores individualmente com suas novas atribuições
          io.to(room.players.white.id).emit('rematch_started', {
            role: 'white',
            room: serializarSala(room),
            message: 'Revanche iniciada! Agora você joga com as Brancas.'
          });

          io.to(room.players.black.id).emit('rematch_started', {
            role: 'black',
            room: serializarSala(room),
            message: 'Revanche iniciada! Agora você joga com as Pretas.'
          });

          // Notifica espectadores
          room.spectators.forEach((spec) => {
            io.to(spec.id).emit('rematch_started', {
              role: 'spectator',
              room: serializarSala(room),
              message: 'Revanche iniciada entre os jogadores.'
            });
          });
        } else {
          // Avisa a sala que um jogador pediu revanche
          io.to(codigoFormatado).emit('rematch_offered', {
            by: socket.id,
            playerName: requesterName,
            message: `${requesterName} solicitou uma revanche!`
          });
        }
      } catch (err) {
        console.error('Erro ao processar revanche:', err);
      }
    });

    /**
     * Envio de mensagem no chat da sala
     */
    socket.on('send_chat', ({ roomId, text }) => {
      try {
        const codigoFormatado = roomId?.trim().toUpperCase();
        const room = rooms.get(codigoFormatado);

        if (!room || !text || !text.trim()) return;

        const session = socketSessions.get(socket.id);
        let senderName = 'Espectador';
        let senderRole = 'spectator';

        if (room.players.white?.id === socket.id) {
          senderName = room.players.white.name;
          senderRole = 'white';
        } else if (room.players.black?.id === socket.id) {
          senderName = room.players.black.name;
          senderRole = 'black';
        } else {
          const spec = room.spectators.find(s => s.id === socket.id);
          if (spec) senderName = spec.name;
        }

        const msgObj = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderName,
          senderRole,
          text: text.trim().substring(0, 300), // Proteção contra textos gigantes
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        io.to(codigoFormatado).emit('new_chat_message', msgObj);
      } catch (err) {
        console.error('Erro ao processar chat:', err);
      }
    });

    /**
     * Desconexão do Socket
     */
    socket.on('disconnect', () => {
      const session = socketSessions.get(socket.id);
      if (session) {
        const { roomId, role } = session;
        const room = rooms.get(roomId);

        if (room) {
          if (role === 'white' && room.players.white?.id === socket.id) {
            room.players.white.connected = false;
            io.to(roomId).emit('player_disconnected', {
              role: 'white',
              message: `O jogador das Brancas (${room.players.white.name}) se desconectou.`
            });
          } else if (role === 'black' && room.players.black?.id === socket.id) {
            room.players.black.connected = false;
            io.to(roomId).emit('player_disconnected', {
              role: 'black',
              message: `O jogador das Pretas (${room.players.black.name}) se desconectou.`
            });
          } else {
            room.spectators = room.spectators.filter(s => s.id !== socket.id);
            io.to(roomId).emit('room_updated', {
              room: serializarSala(room)
            });
          }

          // Se ambos os jogadores se desconectaram e não há espectadores, limpa a sala após 5 minutos
          const whiteConnected = room.players.white?.connected;
          const blackConnected = room.players.black?.connected;
          const hasSpectators = room.spectators.length > 0;

          if (!whiteConnected && !blackConnected && !hasSpectators) {
            setTimeout(() => {
              const currentRoom = rooms.get(roomId);
              if (currentRoom && !currentRoom.players.white?.connected && !currentRoom.players.black?.connected && currentRoom.spectators.length === 0) {
                rooms.delete(roomId);
                console.log(`🧹 [Sala Limpa da Memória] Código: ${roomId}`);
              }
            }, 5 * 60 * 1000); // 5 minutos de tolerância
          }
        }

        socketSessions.delete(socket.id);
      }

      console.log(`🔌 [Socket Desconectado] ID: ${socket.id}`);
    });
  });
}
