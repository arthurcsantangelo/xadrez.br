/**
 * @file battlePass.js
 * @description Sistema de Passe de Batalha e Gamificação por Captura de Peças para o Xadrez.br.
 * 
 * Regras:
 * - Cada peça capturada na partida concede +1 Ponto de Maestria.
 * - A cada 10 pontos acumulados, uma nova skin exclusiva de peça ou tema é desbloqueada.
 * - Progresso e inventário são salvos no localStorage.
 */

const BattlePass = {
  // Recompensas progressivas do Passe de Batalha (a cada 10 pontos)
  rewards: [
    {
      level: 1,
      pointsRequired: 0,
      rewardId: 'wikipedia',
      type: 'pack',
      name: 'Clássico Torneio',
      description: 'Conjunto inicial desbloqueado por padrão.',
      iconSymbol: '♔'
    },
    {
      level: 2,
      pointsRequired: 10,
      rewardId: 'cburnett',
      type: 'pack',
      name: 'Neo Vector (Lichess)',
      description: 'Peças em vetor de alta definição com traços refinados.',
      iconSymbol: '♘'
    },
    {
      level: 3,
      pointsRequired: 20,
      rewardId: 'wood',
      type: 'board',
      name: 'Tabuleiro Madeira Nobre',
      description: 'Tema amadeirado clássico com acabamento de torneio.',
      iconSymbol: '▦'
    },
    {
      level: 4,
      pointsRequired: 30,
      rewardId: 'merida',
      type: 'pack',
      name: 'Mérida Elegance',
      description: 'Estilo editorial fino para Damas e Bispos.',
      iconSymbol: '♕'
    },
    {
      level: 5,
      pointsRequired: 40,
      rewardId: 'midnight',
      type: 'board',
      name: 'Tabuleiro Midnight Cyber',
      description: 'Tema futurista com alto contraste e ardósia escura.',
      iconSymbol: '▦'
    },
    {
      level: 6,
      pointsRequired: 50,
      rewardId: 'alpha',
      type: 'pack',
      name: 'Alpha Tournament',
      description: 'Geometria clássica robusta para Torres e Cavalos.',
      iconSymbol: '♖'
    },
    {
      level: 7,
      pointsRequired: 60,
      rewardId: 'ocean',
      type: 'board',
      name: 'Tabuleiro Oceano Profundo',
      description: 'Paleta azul marinho serena de grande clareza visual.',
      iconSymbol: '▦'
    },
    {
      level: 8,
      pointsRequired: 70,
      rewardId: 'dubrovny',
      type: 'pack',
      name: 'Dubrovnik Histórico',
      description: 'A lendária skin das Olimpíadas de 1950.',
      iconSymbol: '♔'
    },
    {
      level: 9,
      pointsRequired: 80,
      rewardId: 'amethyst',
      type: 'board',
      name: 'Tabuleiro Ametista Real',
      description: 'Cores de realeza para mestres supremos.',
      iconSymbol: '▦'
    }
  ],

  // Inicializa dados do jogador a partir do localStorage
  getState() {
    const points = parseInt(localStorage.getItem('xadrez_bp_points') || '0', 10);
    const unlocked = JSON.parse(localStorage.getItem('xadrez_bp_unlocked') || '["wikipedia", "tournament"]');
    return { points, unlocked };
  },

  saveState(points, unlocked) {
    localStorage.setItem('xadrez_bp_points', points.toString());
    localStorage.setItem('xadrez_bp_unlocked', JSON.stringify(unlocked));
  },

  // Retorna os pontos totais
  getPoints() {
    return this.getState().points;
  },

  // Retorna o nível atual no passe
  getCurrentLevel() {
    const points = this.getPoints();
    return Math.floor(points / 10) + 1;
  },

  // Retorna progresso para o próximo nível (0 a 10)
  getProgressToNext() {
    const points = this.getPoints();
    const currentInLevel = points % 10;
    const percent = (currentInLevel / 10) * 100;
    return {
      current: currentInLevel,
      needed: 10,
      percent: Math.min(100, percent),
      totalPoints: points,
      level: this.getCurrentLevel()
    };
  },

  // Adiciona ponto(s) por captura de peça
  addPoints(amount = 1) {
    const state = this.getState();
    const oldLevel = Math.floor(state.points / 10) + 1;
    state.points += amount;

    const newLevel = Math.floor(state.points / 10) + 1;
    const newUnlocks = [];

    // Checa se desbloqueou novas recompensas
    this.rewards.forEach(reward => {
      if (state.points >= reward.pointsRequired && !state.unlocked.includes(reward.rewardId)) {
        state.unlocked.push(reward.rewardId);
        newUnlocks.push(reward);
      }
    });

    this.saveState(state.points, state.unlocked);

    return {
      totalPoints: state.points,
      leveledUp: newLevel > oldLevel,
      newLevel,
      newUnlocks
    };
  },

  // Verifica se uma skin ou tema está desbloqueado
  isUnlocked(id) {
    // Wikipedia e Tournament são livres por padrão
    if (id === 'wikipedia' || id === 'tournament') return true;
    const { unlocked } = this.getState();
    return unlocked.includes(id);
  },

  // Resgata todos os tiers para renderizar na interface
  getAllTiers() {
    const { points, unlocked } = this.getState();
    return this.rewards.map(reward => {
      const isUnlocked = unlocked.includes(reward.rewardId) || points >= reward.pointsRequired;
      const progress = Math.min(points, reward.pointsRequired);
      return {
        ...reward,
        isUnlocked,
        progress,
        pointsRemaining: Math.max(0, reward.pointsRequired - points)
      };
    });
  }
};

window.BattlePass = BattlePass;
