import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.XADREZ_DATABASE_PATH
  || fileURLToPath(new URL('../../data/xadrez.sqlite', import.meta.url));
mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS contas (
    id TEXT PRIMARY KEY,
    nome_usuario TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL UNIQUE,
    senha_salt TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    moedas INTEGER NOT NULL DEFAULT 10 CHECK (moedas >= 0),
    rubis INTEGER NOT NULL DEFAULT 0 CHECK (rubis >= 0),
    vitorias INTEGER NOT NULL DEFAULT 0 CHECK (vitorias >= 0),
    criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessoes (
    token_hash TEXT PRIMARY KEY,
    conta_id TEXT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    expira_em TEXT NOT NULL,
    criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS partidas (
    id TEXT PRIMARY KEY,
    sala_id TEXT NOT NULL,
    iniciada_em TEXT NOT NULL,
    finalizada_em TEXT NOT NULL,
    vencedor TEXT NOT NULL,
    motivo TEXT NOT NULL,
    brancas_conta_id TEXT REFERENCES contas(id),
    pretas_conta_id TEXT REFERENCES contas(id),
    pgn TEXT NOT NULL,
    fen_final TEXT NOT NULL,
    total_lances INTEGER NOT NULL,
    historico_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessoes_expira_em ON sessoes(expira_em);
  CREATE INDEX IF NOT EXISTS idx_partidas_finalizada_em ON partidas(finalizada_em);
`);
database.prepare('DELETE FROM sessoes WHERE expira_em <= ?').run(new Date().toISOString());

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;

function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    username: account.nome_usuario,
    coins: account.moedas,
    rubies: account.rubis,
    wins: account.vitorias
  };
}

function getAccountById(id) {
  return publicAccount(database.prepare(`
    SELECT id, nome_usuario, moedas, rubis, vitorias
    FROM contas WHERE id = ?
  `).get(id));
}

function validateCredentials(username, password) {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
    return 'O nome de usuário deve ter de 3 a 20 caracteres (letras, números ou _).';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'A senha deve ter entre 8 e 128 caracteres.';
  }
  return null;
}

function createSession(accountId) {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();
  database.prepare(`
    INSERT INTO sessoes (token_hash, conta_id, expira_em, criado_em)
    VALUES (?, ?, ?, ?)
  `).run(createHash('sha256').update(token).digest('hex'), accountId, expiresAt, now.toISOString());
  return { token, expiresAt };
}

export function cadastrarConta(username, password) {
  const validationError = validateCredentials(username, password);
  if (validationError) return { error: validationError };

  const trimmedUsername = username.trim();
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  const id = randomUUID();

  database.exec('BEGIN IMMEDIATE');
  try {
    database.prepare(`
      INSERT INTO contas (id, nome_usuario, nome_normalizado, senha_salt, senha_hash, criado_em)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, trimmedUsername, trimmedUsername.toLowerCase(), salt, passwordHash, new Date().toISOString());
    const session = createSession(id);
    database.exec('COMMIT');
    return { account: getAccountById(id), session };
  } catch (error) {
    database.exec('ROLLBACK');
    if (error.errcode === 2067) {
      return { error: 'Esse nome de usuário já está em uso.' };
    }
    throw error;
  }
}

export function entrarNaConta(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 128) {
    return { error: 'Nome de usuário ou senha inválidos.' };
  }

  const account = database.prepare(`
    SELECT id, nome_usuario, senha_salt, senha_hash
    FROM contas WHERE nome_normalizado = ?
  `).get(username.trim().toLowerCase());

  if (!account) return { error: 'Nome de usuário ou senha inválidos.' };

  const suppliedHash = scryptSync(password, account.senha_salt, PASSWORD_KEY_LENGTH);
  const storedHash = Buffer.from(account.senha_hash, 'hex');
  if (suppliedHash.length !== storedHash.length || !timingSafeEqual(suppliedHash, storedHash)) {
    return { error: 'Nome de usuário ou senha inválidos.' };
  }

  return { account: getAccountById(account.id), session: createSession(account.id) };
}

export function obterContaDaSessao(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;

  const session = database.prepare(`
    SELECT conta_id AS accountId, expira_em AS expiresAt
    FROM sessoes WHERE token_hash = ?
  `).get(createHash('sha256').update(token).digest('hex'));

  if (!session) return null;
  if (session.expiresAt <= new Date().toISOString()) {
    database.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(createHash('sha256').update(token).digest('hex'));
    return null;
  }

  return getAccountById(session.accountId);
}

export function encerrarSessao(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return;
  database.prepare('DELETE FROM sessoes WHERE token_hash = ?')
    .run(createHash('sha256').update(token).digest('hex'));
}

/**
 * Persists a completed server-validated online game and its currency rewards atomically.
 */
export async function salvarPartida(dadosPartida) {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = database.prepare(`
      INSERT INTO partidas (
        id, sala_id, iniciada_em, finalizada_em, vencedor, motivo,
        brancas_conta_id, pretas_conta_id, pgn, fen_final, total_lances, historico_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).run(
      dadosPartida.id,
      dadosPartida.roomId,
      dadosPartida.dataInicio,
      dadosPartida.dataFim,
      dadosPartida.vencedor,
      dadosPartida.motivoVitoria,
      dadosPartida.jogadorBrancas.usuarioId || null,
      dadosPartida.jogadorPretas.usuarioId || null,
      dadosPartida.pgn,
      dadosPartida.fenFinal,
      dadosPartida.totalLances,
      JSON.stringify(dadosPartida.historico)
    );

    if (result.changes === 0) {
      database.exec('COMMIT');
      return { sucesso: true, id: dadosPartida.id, duplicada: true, recompensas: {} };
    }

    const rewards = {};
    for (const [color, player, winColor] of [
      ['white', dadosPartida.jogadorBrancas, 'white'],
      ['black', dadosPartida.jogadorPretas, 'black']
    ]) {
      if (!player.usuarioId) continue;

      const coinsEarned = dadosPartida.vencedor === 'draw'
        ? 2
        : dadosPartida.vencedor === winColor ? 5 : 0;
      const won = dadosPartida.vencedor === winColor;

      database.prepare(`
        UPDATE contas
        SET moedas = moedas + ?,
            vitorias = vitorias + ?,
            rubis = rubis + CASE WHEN ? = 1 AND (vitorias + 1) % 10 = 0 THEN 1 ELSE 0 END
        WHERE id = ?
      `).run(coinsEarned, won ? 1 : 0, won ? 1 : 0, player.usuarioId);

      const account = getAccountById(player.usuarioId);
      if (account) {
        rewards[color] = {
          contaId: account.id,
          moedasRecebidas: coinsEarned,
          rubisRecebidos: won && account.wins % 10 === 0 ? 1 : 0,
          conta: account
        };
      }
    }

    database.exec('COMMIT');
    return { sucesso: true, id: dadosPartida.id, duplicada: false, recompensas: rewards };
  } catch (error) {
    database.exec('ROLLBACK');
    console.error('❌ [DATABASE SERVICE] Erro ao persistir partida e recompensas:', error.message);
    throw error;
  }
}

export async function obterPartidaPorId(partidaId) {
  const partida = database.prepare('SELECT * FROM partidas WHERE id = ?').get(partidaId);
  if (!partida) return null;
  return {
    id: partida.id,
    roomId: partida.sala_id,
    dataInicio: partida.iniciada_em,
    dataFim: partida.finalizada_em,
    vencedor: partida.vencedor,
    motivoVitoria: partida.motivo,
    pgn: partida.pgn,
    fenFinal: partida.fen_final,
    totalLances: partida.total_lances,
    historico: JSON.parse(partida.historico_json)
  };
}

export async function obterPartidasRecentes(limite = 10) {
  const safeLimit = Number.isInteger(limite) ? Math.min(Math.max(limite, 0), 100) : 10;
  return database.prepare(`
    SELECT id, sala_id AS roomId, iniciada_em AS dataInicio, finalizada_em AS dataFim,
           vencedor, motivo AS motivoVitoria, pgn, fen_final AS fenFinal,
           total_lances AS totalLances, historico_json AS historicoJson
    FROM partidas ORDER BY finalizada_em DESC LIMIT ?
  `).all(safeLimit).map((partida) => ({
    ...partida,
    historico: JSON.parse(partida.historicoJson)
  }));
}

export function fecharBanco() {
  database.close();
}

export default {
  cadastrarConta,
  entrarNaConta,
  obterContaDaSessao,
  encerrarSessao,
  salvarPartida,
  obterPartidaPorId,
  obterPartidasRecentes,
  fecharBanco
};
