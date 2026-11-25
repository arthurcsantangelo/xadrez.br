import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'xadrez-test-'));
process.env.XADREZ_DATABASE_PATH = path.join(temporaryDirectory, 'test.sqlite');

const {
  cadastrarConta,
  entrarNaConta,
  obterContaDaSessao,
  encerrarSessao,
  atualizarNomeConta,
  salvarPartida,
  fecharBanco
} = await import('../src/services/database.js');

function createMatch(id, winner, whiteUserId, blackUserId) {
  return {
    id,
    roomId: `ROOM-${id}`,
    dataInicio: new Date().toISOString(),
    dataFim: new Date().toISOString(),
    vencedor: winner,
    motivoVitoria: 'Teste',
    jogadorBrancas: { id: 'white', nome: 'Brancas', usuarioId: whiteUserId },
    jogadorPretas: { id: 'black', nome: 'Pretas', usuarioId: blackUserId },
    pgn: '',
    fenFinal: '',
    totalLances: 0,
    historico: []
  };
}

after(() => {
  fecharBanco();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('contas começam com saldo inicial, autenticam e mantêm prêmios de partidas', async () => {
  const aliceResult = cadastrarConta('Alice', 'senha-segura-123');
  const bobResult = cadastrarConta('Bob', 'outra-senha-123');
  assert.equal(aliceResult.account.coins, 10);
  assert.equal(aliceResult.account.rubies, 0);
  assert.equal(aliceResult.account.wins, 0);
  assert.equal(bobResult.account.coins, 10);
  assert.match(cadastrarConta('alice', 'outra-senha-123').error, /já está em uso/i);
  assert.match(entrarNaConta('Alice', 'senha-incorreta').error, /inválidos/i);
  assert.equal(entrarNaConta('aLiCe', 'senha-segura-123').account.id, aliceResult.account.id);
  const renamed = atualizarNomeConta(aliceResult.session.token, 'Alice67');
  assert.equal(renamed.account.username, 'Alice67');
  assert.match(atualizarNomeConta(aliceResult.session.token, 'A').error, /3 a 20/i);
  assert.equal(obterContaDaSessao(aliceResult.session.token).id, aliceResult.account.id);
  encerrarSessao(aliceResult.session.token);
  assert.equal(obterContaDaSessao(aliceResult.session.token), null);

  for (let win = 1; win <= 10; win++) {
    const match = createMatch(`alice-win-${win}`, 'white', aliceResult.account.id, null);
    const result = await salvarPartida(match);
    assert.equal(result.recompensas.white.moedasRecebidas, 5);
    assert.equal(result.recompensas.white.rubisRecebidos, win === 10 ? 1 : 0);
    assert.equal(result.recompensas.white.conta.coins, 10 + 5 * win);
  }

  const afterTenWins = await salvarPartida(createMatch('alice-win-10', 'white', aliceResult.account.id, null));
  assert.equal(afterTenWins.duplicada, true);
  assert.equal(afterTenWins.recompensas.white, undefined);

  const draw = await salvarPartida(createMatch('draw', 'draw', aliceResult.account.id, bobResult.account.id));
  assert.equal(draw.recompensas.white.moedasRecebidas, 2);
  assert.equal(draw.recompensas.black.moedasRecebidas, 2);
  assert.equal(draw.recompensas.white.conta.coins, 62);
  assert.equal(draw.recompensas.black.conta.coins, 12);

  const loss = await salvarPartida(createMatch('bob-loss', 'white', aliceResult.account.id, bobResult.account.id));
  assert.equal(loss.recompensas.black.moedasRecebidas, 0);
  assert.equal(loss.recompensas.white.moedasRecebidas, 5);
  assert.equal(loss.recompensas.white.conta.coins, 67);
  assert.equal(loss.recompensas.black.conta.coins, 12);
});
