/**
 * @file piecesData.js
 * @description Biblioteca de skins vetoriais (SVG) e temas de tabuleiros para o Xadrez.br.
 * 
 * Fornece:
 * - Um conjunto de peças vetorial original para os seis tipos (sem dependências externas)
 * - Temas de tabuleiros com paletas modernas (Lichess, Chess.com, Midnight, Ocean, Wood)
 * - Skins exclusivas e mistura peça por peça reservadas para uma atualização futura
 */

const originalPieceColors = {
  white: {
    armor: '#f3bd4d',
    armorShade: '#ca783d',
    robe: '#f07462',
    robeShade: '#bd4c5f',
    accent: '#51bca8',
    hair: '#303755',
    hairLight: '#596c9d',
    skin: '#f5c6a1',
    eye: '#4155a2',
    outline: '#29253c',
    highlight: '#fff4d2',
    base: '#f0cf83',
    baseShade: '#a9673a'
  },
  black: {
    armor: '#65c4dc',
    armorShade: '#3477a8',
    robe: '#7652b8',
    robeShade: '#48337f',
    accent: '#f4bd50',
    hair: '#192643',
    hairLight: '#426ca5',
    skin: '#d99d7c',
    eye: '#34cfe2',
    outline: '#111a30',
    highlight: '#d7f8ff',
    base: '#344a80',
    baseShade: '#172447'
  }
};

function animeFace(c, expression) {
  const mouth = expression === 'serious' ? 'M60 57H68' : 'M59 55Q64 60 69 55';

  return `<path d="M51 48Q57 42 62 48Q57 53 51 48ZM66 48Q71 42 77 48Q71 53 66 48Z" fill="${c.highlight}" stroke="${c.outline}" stroke-width="1.5"/>
    <ellipse cx="57" cy="48" rx="2.5" ry="3.5" fill="${c.eye}"/><ellipse cx="71" cy="48" rx="2.5" ry="3.5" fill="${c.eye}"/>
    <circle cx="58" cy="47" r="1" fill="#fff"/><circle cx="72" cy="47" r="1" fill="#fff"/>
    <path d="M60 54Q64 56 68 54" fill="none" stroke="${c.outline}" stroke-width="1.5"/>
    <path d="${mouth}" fill="none" stroke="${c.outline}" stroke-width="2.5" stroke-linecap="round"/>`;
}

function originalPieceArtwork(type, c) {
  const head = expression => animeFace(c, expression);

  const designs = {
    p: `<path d="M42 102 37 83 43 66 47 46 43 31 55 36 61 19 67 32 81 25 78 41 89 47 84 68 91 102Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M48 36 56 40 62 27 67 39 79 33 76 48H49Z" fill="${c.hairLight}" stroke="${c.outline}" stroke-width="2"/>
      <path d="M45 66Q64 58 83 66L89 106H39Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 69 64 88 78 69 74 104H54Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M47 78 38 91 44 101M81 78 90 91 84 101" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="64" cy="45" rx="16" ry="19" fill="${c.skin}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M47 43 43 31 55 36 61 19 67 32 81 25 78 41 70 38 64 44 57 38 51 44Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      ${head('smile')}
      <path d="M57 88 64 94 71 88 69 101H59Z" fill="${c.accent}" stroke="${c.outline}" stroke-width="2"/>`,
    n: `<path d="M37 106Q30 84 36 66L31 48Q29 28 45 21L47 10 60 20Q77 17 84 31L99 41 84 48Q82 65 74 75L85 106Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M43 68 37 54 46 46 55 49 62 42 70 46 78 39 88 44 79 59 75 102H48Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M49 83 64 73 80 82 88 108H39Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M41 49Q38 31 52 25L62 20 69 31 83 29 90 42 79 48 69 42 62 49 52 43Z" fill="${c.hairLight}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 52Q57 48 63 53Q57 58 50 52Z" fill="${c.highlight}" stroke="${c.outline}" stroke-width="2"/><ellipse cx="57" cy="52" rx="2.5" ry="3.5" fill="${c.eye}"/>
      <path d="M74 48 91 43 99 48 86 54 75 56Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M52 87 64 94 76 87" fill="none" stroke="${c.accent}" stroke-width="4"/>`,
    b: `<path d="M42 106 37 73 42 48 36 35Q43 18 64 12Q85 18 92 35L86 48 91 73 86 106Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M48 50Q49 34 64 30Q79 34 80 50V61H48Z" fill="${c.skin}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M36 36Q43 18 64 12Q85 18 92 36L83 52 78 43Q64 37 50 43L45 52Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M64 22 72 34 64 43 56 34Z" fill="${c.highlight}" stroke="${c.outline}" stroke-width="2"/>
      ${head('smile')}
      <path d="M47 63 64 81 81 63 76 106H52Z" fill="${c.robeShade}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M92 46V111M85 48H99" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="92" cy="43" r="6" fill="${c.accent}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M64 76 70 86 64 96 58 86Z" fill="${c.accent}" stroke="${c.outline}" stroke-width="2"/>`,
    r: `<path d="M30 63V42H39V28H51V37H61V24H73V37H84V28H96V42H104V63L94 72 97 107H31L34 72Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M43 58Q44 42 64 40Q84 42 85 58V70H43Z" fill="${c.skin}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M42 51Q48 42 64 42Q80 42 86 51V59H42Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="3"/>
      ${head('serious')}
      <path d="M27 72 40 66 50 77 64 70 78 77 88 66 101 72 95 108H33Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M48 79H80M48 91H80" stroke="${c.highlight}" stroke-width="4"/>
      <path d="M58 76 64 84 70 76 68 98H60Z" fill="${c.accent}" stroke="${c.outline}" stroke-width="2"/>`,
    q: `<path d="M38 104 31 72 36 47Q35 28 50 22L57 28Q64 19 71 28L78 22Q93 30 92 49L96 75 88 105Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M45 73Q64 65 83 73L94 109H34Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M49 76 64 93 79 76 75 108H53Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="64" cy="45" rx="16" ry="19" fill="${c.skin}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M46 42 43 28 55 34 64 18 73 34 85 28 82 43 73 39 64 44 55 39Z" fill="${c.accent}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      ${head('smile')}
      <path d="M44 55Q43 73 37 88M84 55Q85 73 91 88" fill="none" stroke="${c.hairLight}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="64" cy="29" r="4" fill="${c.highlight}" stroke="${c.outline}" stroke-width="2"/>
      <path d="M55 91 64 99 73 91" fill="none" stroke="${c.highlight}" stroke-width="4"/>`,
    k: `<path d="M35 105 29 79 35 57 42 48 46 30 57 34 64 16 71 34 82 30 86 48 94 58 99 79 93 105Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 74Q64 65 84 74L94 109H34Z" fill="${c.armorShade}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 76 64 91 82 76 76 108H52Z" fill="${c.robe}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="64" cy="45" rx="16" ry="19" fill="${c.skin}" stroke="${c.outline}" stroke-width="3"/>
      <path d="M43 41 44 30 57 34 64 15 71 34 84 30 85 43 76 40 64 45 52 40Z" fill="${c.armor}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      ${head('serious')}
      <path d="M49 56Q64 72 79 56L75 76 64 82 53 76Z" fill="${c.hair}" stroke="${c.outline}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M64 20V32M58 26H70" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round"/>
      <path d="M96 48V110M90 50H102" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="96" cy="44" r="5" fill="${c.accent}" stroke="${c.outline}" stroke-width="2"/>`
  };

  return designs[type] || designs.p;
}

function createOriginalPieceUrl(piece) {
  const team = piece?.charAt(0) === 'b' ? 'black' : 'white';
  const type = piece?.charAt(1)?.toLowerCase() || 'p';
  const c = originalPieceColors[team];
  const artwork = originalPieceArtwork(type, c);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="144" viewBox="0 0 128 144">
    <ellipse cx="64" cy="137" rx="38" ry="5" fill="#101426" opacity=".35"/>
    <path d="M31 112Q64 103 97 112L105 129Q106 136 97 137H31Q22 136 23 129Z" fill="${c.base}" stroke="${c.outline}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M27 123H101" stroke="${c.highlight}" stroke-width="5"/>
    <path d="M33 132H95" stroke="${c.baseShade}" stroke-width="4"/>
    ${artwork}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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
    original: {
      id: 'original',
      name: 'Heróis Anime',
      description: 'Figuras anime com silhuetas distintas para reconhecer cada peça.',
      getUrl: createOriginalPieceUrl
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
