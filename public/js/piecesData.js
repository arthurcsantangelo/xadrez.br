/**
 * @file piecesData.js
 * @description Biblioteca de skins vetoriais (SVG) e temas de tabuleiros para o Xadrez.br.
 * 
 * Fornece:
 * - Conjuntos de peças em SVG (Zero dependência externa, carregamento instantâneo)
 * - Temas de tabuleiros com paletas modernas (Lichess, Chess.com, Midnight, Ocean, Wood)
 * - Suporte a personalização peça por peça (mix-and-match de skins)
 */

const ChessThemes = {
  // ==========================================================================
  // TEMAS DO TABULEIRO (CORES DAS CASAS)
  // ==========================================================================
  boards: {
    tournament: {
      id: 'tournament',
      name: 'Verde Torneio',
      light: '#ebecd0',
      dark: '#779556',
      preview: ['#ebecd0', '#779556']
    },
    wood: {
      id: 'wood',
      name: 'Madeira Nobre',
      light: '#f0d9b5',
      dark: '#b58863',
      preview: ['#f0d9b5', '#b58863']
    },
    ocean: {
      id: 'ocean',
      name: 'Oceano Profundo',
      light: '#dee3e6',
      dark: '#4b7399',
      preview: ['#dee3e6', '#4b7399']
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight Cyber',
      light: '#323943',
      dark: '#1b2028',
      preview: ['#323943', '#1b2028']
    },
    charcoal: {
      id: 'charcoal',
      name: 'Grafite Minimalista',
      light: '#e2e8f0',
      dark: '#475569',
      preview: ['#e2e8f0', '#475569']
    },
    amethyst: {
      id: 'amethyst',
      name: 'Ametista Real',
      light: '#ece5f0',
      dark: '#7a528a',
      preview: ['#ece5f0', '#7a528a']
    }
  },

  // ==========================================================================
  // PACOTES DE PEÇAS (SKINS)
  // ==========================================================================
  pieceSets: {
    wikipedia: {
      id: 'wikipedia',
      name: 'Clássico Wikipedia',
      description: 'O conjunto tradicional mais reconhecido em competições.',
      getUrl: (piece) => `https://chessboardjs.com/img/chesspieces/wikipedia/${piece}.png`
    },
    cburnett: {
      id: 'cburnett',
      name: 'Neo Vector (Lichess)',
      description: 'Design moderno vetorizado em alta definição e traços polidos.',
      getUrl: (piece) => `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${piece}.svg`
    },
    merida: {
      id: 'merida',
      name: 'Mérida Elegance',
      description: 'Estilo editorial fino, muito utilizado em livros e transmissões.',
      getUrl: (piece) => `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/merida/${piece}.svg`
    },
    alpha: {
      id: 'alpha',
      name: 'Alpha Tournament',
      description: 'Geometria clássica robusta com forte presença de tabuleiro.',
      getUrl: (piece) => `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/alpha/${piece}.svg`
    },
    dubrovny: {
      id: 'dubrovny',
      name: 'Dubrovnik Histórico',
      description: 'Inspirado no conjunto histórico das olimpíadas de 1950.',
      getUrl: (piece) => `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/dubrovny/${piece}.svg`
    }
  },

  // Nomes amigáveis dos tipos de peças
  pieceTypes: [
    { key: 'p', name: 'Peão', symbol: '♙' },
    { key: 'n', name: 'Cavalo', symbol: '♘' },
    { key: 'b', name: 'Bispo', symbol: '♗' },
    { key: 'r', name: 'Torre', symbol: '♖' },
    { key: 'q', name: 'Dama', symbol: '♕' },
    { key: 'k', name: 'Rei', symbol: '♔' }
  ]
};

// Exporta globalmente no navegador
window.ChessThemes = ChessThemes;
