/**
 * @file client.js
 * @description Frontend oficial do Xadrez Real
 * Integra a Interface Principal Castelo (Menu da Foto) com todos os botões funcionais:
 * - Botão Jogar (centro) com animação de batalha e transição para a Arena
 * - Modos de Jogo (Bots Chess.com e Multiplayer Online)
 * - Inventário & Skins (Temas de Tabuleiro e Peças customizadas)
 * - Configuração (Nome do Jogador e Som)
 * - Passe de Batalha & Maestria (+1 ponto por captura de peça)
 * - Perfil do Jogador e saldos carregados da conta persistida no servidor
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // ESTADO GLOBAL DO JOGO
  // ==========================================================================
  let socket = null;
  let board = null;
  let game = new Chess();

  let currentGameMode = 'bot'; // 'bot' ou 'multiplayer'
  let playerRole = 'white';     // Para multiplayer: 'white', 'black', 'spectator'

  // Configurações do Bot
  let currentBot = {
    id: 'nelson',
    name: 'Nelson',
    diff: 'medium',
    rating: 1300,
    avatar: 'https://images.chesscomfiles.com/uploads/v1/user/111874.e72daef0.50x50o.5d9e5b018593.png'
  };

  let playerColor = 'white';     // 'white' ou 'black'
  let botColor = 'b';
  let isBotThinking = false;

  // Relógios de Tempo (10 minutos padrão)
  let whiteTime = 600;
  let blackTime = 600;
  let clockInterval = null;

  // Perfil local e saldos da conta, carregados do servidor quando houver sessão.
  let playerName = localStorage.getItem('xadrez_player_name') || 'Jogador67';
  let playerCoins = 10;
  let playerGems = 0;
  let currentAccount = null;
  let accountFormMode = 'login';
  let isSoundEnabled = localStorage.getItem('xadrez_sound') !== 'false';
  let audioCtx = null;

  // Customização de Tabuleiro e Skins
  let currentBoardTheme = localStorage.getItem('xadrez_board_theme') || 'tournament';
  let currentGlobalPack = localStorage.getItem('xadrez_piece_pack') || 'cburnett';
  let currentPieceMix = JSON.parse(localStorage.getItem('xadrez_piece_mix') || '{}');

  // Multiplayer
  let currentRoomId = null;
  let moveHistory = [];

  // ==========================================================================
  // ELEMENTOS DO DOM
  // ==========================================================================
  // Telas Principais
  const castleMenuScreen = document.getElementById('castleMenuScreen');
  const gameArenaScreen = document.getElementById('gameArenaScreen');

  // Hotspots da Interface Principal (Castelo)
  const btnMenuProfile = document.getElementById('btnMenuProfile');
  const castleProfileName = document.getElementById('castleProfileName');
  const castleProfileLevel = document.getElementById('castleProfileLevel');
  const castleProfileXp = document.getElementById('castleProfileXp');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const profileAvatarImage = document.getElementById('profileAvatarImage');
  const castleCoinCounter = document.getElementById('castleCoinCounter');
  const castleGemCounter = document.getElementById('castleGemCounter');
  const btnMenuFriends = document.getElementById('btnMenuFriends');
  const btnMenuPlay = document.getElementById('btnMenuPlay');
  const btnMenuBattlePassArt = document.getElementById('btnMenuBattlePassArt');
  const btnMenuInventoryArt = document.getElementById('btnMenuInventoryArt');
  const btnMenuGameModes = document.getElementById('btnMenuGameModes');
  const btnMenuGameModesArt = document.getElementById('btnMenuGameModesArt');
  const btnMenuInventory = document.getElementById('btnMenuInventory');
  const btnMenuSettings = document.getElementById('btnMenuSettings');
  const btnMenuBattlePass = document.getElementById('btnMenuBattlePass');

  // Topbar da Arena
  const btnBackToMenu = document.getElementById('btnBackToMenu');
  const arenaModeLabel = document.getElementById('arenaModeLabel');
  const btnQuickBattlePass = document.getElementById('btnQuickBattlePass');
  const quickBpLevel = document.getElementById('quickBpLevel');
  const btnQuickCustomize = document.getElementById('btnQuickCustomize');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  // Arena de Xadrez & Jogadores
  const evalBarWhite = document.getElementById('evalBarWhite');
  const evalScoreText = document.getElementById('evalScoreText');
  const opponentAvatarImg = document.getElementById('opponentAvatarImg');
  const opponentName = document.getElementById('opponentName');
  const opponentRating = document.getElementById('opponentRating');
  const opponentClock = document.getElementById('opponentClock');
  const opponentClockText = document.getElementById('opponentClockText');
  const opponentCapturedPieces = document.getElementById('opponentCapturedPieces');

  const myAvatarImg = document.getElementById('myAvatarImg');
  const myName = document.getElementById('myName');
  const myRating = document.getElementById('myRating');
  const myClock = document.getElementById('myClock');
  const myClockText = document.getElementById('myClockText');
  const myCapturedPieces = document.getElementById('myCapturedPieces');

  // Abas de Lances e Chat
  const tabButtons = document.querySelectorAll('.cc-tab-btn');
  const panelContents = document.querySelectorAll('.cc-panel-content');
  const moveCount = document.getElementById('moveCount');
  const movesTableBody = document.getElementById('movesTableBody');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  // Ações da Partida
  const gameAlertBox = document.getElementById('gameAlertBox');
  const gameAlertText = document.getElementById('gameAlertText');
  const btnResign = document.getElementById('btnResign');
  const btnRematch = document.getElementById('btnRematch');

  // Modal 1: Modos de Jogo
  const gameModesModal = document.getElementById('gameModesModal');
  const gameModesCloseBtn = document.getElementById('gameModesCloseBtn');
  const btnSelectBotMode = document.getElementById('btnSelectBotMode');
  const btnSelectOnlineMode = document.getElementById('btnSelectOnlineMode');
  const modeSectionBot = document.getElementById('modeSectionBot');
  const modeSectionOnline = document.getElementById('modeSectionOnline');
  const botCards = document.querySelectorAll('.cc-bot-card');
  const sideButtons = document.querySelectorAll('.cc-side-btn');
  const btnModalCreateRoom = document.getElementById('btnModalCreateRoom');
  const inputModalRoomCode = document.getElementById('inputModalRoomCode');
  const btnModalJoinRoom = document.getElementById('btnModalJoinRoom');
  const btnConfirmStartGame = document.getElementById('btnConfirmStartGame');

  // Modal 2: Inventário & Skins
  const customizeModal = document.getElementById('customizeModal');
  const customizeCloseBtn = document.getElementById('customizeCloseBtn');
  const saveCustomBtn = document.getElementById('saveCustomBtn');
  const resetCustomBtn = document.getElementById('resetCustomBtn');
  const customTabBtns = document.querySelectorAll('.custom-tab-btn');
  const customTabPanels = document.querySelectorAll('.custom-tab-panel');
  const boardThemesGrid = document.getElementById('boardThemesGrid');
  const piecePacksGrid = document.getElementById('piecePacksGrid');
  const pieceMixGrid = document.getElementById('pieceMixGrid');

  // Modal 3: Passe de Batalha
  const battlePassModal = document.getElementById('battlePassModal');
  const battlePassCloseBtn = document.getElementById('battlePassCloseBtn');
  const battlePassConfirmCloseBtn = document.getElementById('battlePassConfirmCloseBtn');
  const bpModalLevel = document.getElementById('bpModalLevel');
  const bpModalTotalPoints = document.getElementById('bpModalTotalPoints');
  const bpModalProgressBar = document.getElementById('bpModalProgressBar');
  const bpModalNextGoal = document.getElementById('bpModalNextGoal');
  const bpTiersList = document.getElementById('bpTiersList');

  // Modal 4: Configurações
  const settingsModal = document.getElementById('settingsModal');
  const settingsCloseBtn = document.getElementById('settingsCloseBtn');
  const settingsPlayerNameInput = document.getElementById('settingsPlayerNameInput');
  const settingsSoundToggleBtn = document.getElementById('settingsSoundToggleBtn');
  const settingsSaveBtn = document.getElementById('settingsSaveBtn');

  // Modal 5: Amigos
  const friendsModal = document.getElementById('friendsModal');
  const friendsCloseBtn = document.getElementById('friendsCloseBtn');
  const btnFriendsCreateRoom = document.getElementById('btnFriendsCreateRoom');
  const inputFriendsCode = document.getElementById('inputFriendsCode');
  const btnFriendsJoin = document.getElementById('btnFriendsJoin');
  const accountSignedOut = document.getElementById('accountSignedOut');
  const accountSignedIn = document.getElementById('accountSignedIn');
  const accountFormToggleBtn = document.getElementById('accountFormToggleBtn');
  const accountForm = document.getElementById('accountForm');
  const accountModeButtons = document.querySelectorAll('[data-account-mode]');
  const accountUsernameInput = document.getElementById('accountUsername');
  const accountPasswordInput = document.getElementById('accountPassword');
  const accountConfirmPasswordInput = document.getElementById('accountConfirmPassword');
  const accountConfirmPasswordLabel = document.getElementById('accountConfirmPasswordLabel');
  const accountSubmitBtn = document.getElementById('accountSubmitBtn');
  const accountUsernameDisplay = document.getElementById('accountUsernameDisplay');
  const accountProgress = document.getElementById('accountProgress');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');
  const accountFormStatus = document.getElementById('accountFormStatus');

  // Modal Geral & Toast
  const appModal = document.getElementById('appModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const toastNotification = document.getElementById('toastNotification');

  // ==========================================================================
  // SISTEMA DE ÁUDIO & EFEITOS TÁTEIS (WEB AUDIO API SINTETIZADO)
  // ==========================================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playUiClickSound() {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn(e);
    }
  }

  function playBattleStartSound() {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const chord = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      chord.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        const start = now + i * 0.04;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  function playFanfareSound() {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      melody.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.075;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  function playChessComSound(type) {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.07);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'capture') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'check') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'gameover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // ==========================================================================
  // MICRO-INTERAÇÃO: FLOATING ACTION BUBBLE
  // ==========================================================================
  function spawnFloatingBubble(buttonEl, text, color = '#ffd700') {
    if (!buttonEl) return;
    const rect = buttonEl.getBoundingClientRect();
    const bubble = document.createElement('div');
    bubble.className = 'floating-action-bubble';
    bubble.textContent = text;
    bubble.style.color = color;
    bubble.style.left = `${rect.left + rect.width / 2}px`;
    bubble.style.top = `${rect.top + rect.height / 3}px`;
    document.body.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
    }, 1200);
  }

  // ==========================================================================
  // TRANSIÇÕES DE TELA (MENU CASTELO <-> ARENA DE XADREZ)
  // ==========================================================================
  function openGameArena() {
    castleMenuScreen.classList.remove('active');
    gameArenaScreen.classList.add('active');
    initBoard();
    setTimeout(() => {
      if (board) board.resize();
    }, 60);
  }

  function returnToCastleMenu() {
    playUiClickSound();
    gameArenaScreen.classList.remove('active');
    castleMenuScreen.classList.add('active');
  }

  btnBackToMenu.addEventListener('click', returnToCastleMenu);

  // ==========================================================================
  // ATUALIZAÇÃO DA INTERFACE DO PERFIL E ECONOMIA
  // ==========================================================================
  function updatePlayerProfileUI() {
    if (castleProfileName) castleProfileName.textContent = playerName;
    if (myName) myName.textContent = playerName;
    if (castleProfileLevel || castleProfileXp) {
      const progress = window.BattlePass?.getProgressToNext?.();
      if (progress) {
        if (castleProfileLevel) castleProfileLevel.textContent = progress.level;
        if (castleProfileXp) castleProfileXp.textContent = `${progress.current} / 50 XP`;
      }
    }
  }

  function updateCurrencyUI() {
    if (castleCoinCounter) castleCoinCounter.textContent = playerCoins;
    if (castleGemCounter) castleGemCounter.textContent = playerGems;
  }

  function loadProfilePhoto() {
    const savedPhoto = localStorage.getItem('xadrez_profile_photo');
    if (profileAvatarImage) profileAvatarImage.src = savedPhoto || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  }

  function applyAccountProfile(account) {
    currentAccount = account;
    playerCoins = account?.coins ?? 10;
    playerGems = account?.rubies ?? 0;
    if (account) playerName = account.username;
    updatePlayerProfileUI();
    updateCurrencyUI();
    renderAccountUI();
  }

  function renderAccountUI() {
    const isSignedIn = Boolean(currentAccount);
    accountSignedOut.classList.toggle('hidden', isSignedIn);
    accountSignedIn.classList.toggle('hidden', !isSignedIn);

    if (isSignedIn) {
      accountUsernameDisplay.textContent = currentAccount.username;
      const winsToRuby = currentAccount.wins % 10;
      accountProgress.textContent = `${winsToRuby} de 10 vitórias para o próximo rubi.`;
      return;
    }

    const isRegister = accountFormMode === 'register';
    accountModeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.accountMode === accountFormMode);
    });
    accountConfirmPasswordLabel.classList.toggle('hidden', !isRegister);
    accountConfirmPasswordInput.classList.toggle('hidden', !isRegister);
    accountConfirmPasswordInput.required = isRegister;
    accountPasswordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    accountSubmitBtn.textContent = isRegister ? 'Criar conta' : 'Entrar';
  }

  async function loadAccount() {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar a conta.');
      applyAccountProfile(result.account);
    } catch (error) {
      console.error('Erro ao carregar conta:', error);
      showToast('Não foi possível carregar a conta. Verifique a conexão.');
    }
  }

  updatePlayerProfileUI();
  updateCurrencyUI();
  loadProfilePhoto();
  loadAccount();

  // ==========================================================================
  // EVENT LISTENERS DOS BOTÕES DO MENU PRINCIPAL (DA FOTO)
  // ==========================================================================

  btnMenuPlay.addEventListener('click', () => {
    playBattleStartSound();
    currentGameMode = 'bot';
    openGameArena();
    startNewGame();
  });

  // 1. Modos de Jogo (Direita - Roxo)
  btnMenuGameModes.addEventListener('click', () => {
    playUiClickSound();
    spawnFloatingBubble(btnMenuGameModes, '🏆 Modos de Jogo', '#c084fc');
    gameModesModal.classList.remove('hidden');
  });

  btnMenuGameModesArt.addEventListener('click', () => {
    playUiClickSound();
    gameModesModal.classList.remove('hidden');
  });

  gameModesCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    gameModesModal.classList.add('hidden');
  });

  btnSelectBotMode.addEventListener('click', () => {
    playUiClickSound();
    currentGameMode = 'bot';
    btnSelectBotMode.classList.add('active');
    btnSelectOnlineMode.classList.remove('active');
    modeSectionBot.classList.remove('hidden');
    modeSectionOnline.classList.add('hidden');
  });

  btnSelectOnlineMode.addEventListener('click', () => {
    playUiClickSound();
    currentGameMode = 'multiplayer';
    btnSelectOnlineMode.classList.add('active');
    btnSelectBotMode.classList.remove('active');
    modeSectionOnline.classList.remove('hidden');
    modeSectionBot.classList.add('hidden');
    connectSocket();
  });

  botCards.forEach(card => {
    card.addEventListener('click', () => {
      playUiClickSound();
      botCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      currentBot = {
        id: card.dataset.botId,
        name: card.dataset.name,
        diff: card.dataset.diff,
        rating: card.dataset.rating,
        avatar: card.dataset.avatar
      };
    });
  });

  sideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playUiClickSound();
      sideButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const col = btn.dataset.color;
      if (col === 'random') {
        playerColor = Math.random() < 0.5 ? 'white' : 'black';
      } else {
        playerColor = col;
      }
    });
  });

  btnConfirmStartGame.addEventListener('click', () => {
    playBattleStartSound();
    gameModesModal.classList.add('hidden');
    openGameArena();
    startNewGame();
  });

  // 3. Inventário & Skins (Direita - Verde)
  function openCustomizeModal() {
    playUiClickSound();
    renderCustomizer();
    customizeModal.classList.remove('hidden');
  }

  btnMenuInventory.addEventListener('click', () => {
    spawnFloatingBubble(btnMenuInventory, '📦 Inventário', '#4ade80');
    openCustomizeModal();
  });

  btnMenuInventoryArt.addEventListener('click', () => {
    playUiClickSound();
    openCustomizeModal();
  });

  btnQuickCustomize.addEventListener('click', openCustomizeModal);
  customizeCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    customizeModal.classList.add('hidden');
  });
  saveCustomBtn.addEventListener('click', () => {
    playUiClickSound();
    customizeModal.classList.add('hidden');
    showToast('Customização equipada com sucesso!');
  });

  // 4. Configuração (Direita - Metálico)
  function openSettingsModal() {
    playUiClickSound();
    settingsPlayerNameInput.value = playerName;
    settingsSoundToggleBtn.textContent = isSoundEnabled ? 'Som: Ativado 🔊' : 'Som: Desativado 🔇';
    settingsModal.classList.remove('hidden');
  }

  btnMenuSettings.addEventListener('click', () => {
    spawnFloatingBubble(btnMenuSettings, '⚙️ Ajustes', '#cbd5e1');
    openSettingsModal();
  });

  settingsCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    settingsModal.classList.add('hidden');
  });

  settingsSoundToggleBtn.addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('xadrez_sound', isSoundEnabled ? 'true' : 'false');
    settingsSoundToggleBtn.textContent = isSoundEnabled ? 'Som: Ativado 🔊' : 'Som: Desativado 🔇';
    soundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
    playUiClickSound();
  });

  settingsSaveBtn.addEventListener('click', async () => {
    playUiClickSound();
    const newName = settingsPlayerNameInput.value.trim();
    if (!newName) return;

    if (currentAccount) {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar o nome.');
        applyAccountProfile(result.account);
        showToast(`Nome atualizado para "${result.account.username}"!`);
      } catch (error) {
        showToast(error.message);
      }
    } else {
      playerName = newName;
      localStorage.setItem('xadrez_player_name', playerName);
      updatePlayerProfileUI();
      showToast(`Nome atualizado para "${playerName}"!`);
    }
    settingsModal.classList.add('hidden');
  });

  // 5. Perfil do Jogador (Topo Esquerdo)
  btnMenuProfile.addEventListener('click', () => {
    spawnFloatingBubble(btnMenuProfile, `👤 ${playerName}`, '#38bdf8');
    openSettingsModal();
  });

  profilePhotoInput.addEventListener('change', () => {
    const [file] = profilePhotoInput.files;
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      showToast('Escolha uma imagem de até 2 MB.');
      profilePhotoInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem('xadrez_profile_photo', reader.result);
        if (profileAvatarImage) profileAvatarImage.src = reader.result;
        showToast('Foto do perfil atualizada!');
      } catch (error) {
        showToast('Não foi possível guardar a foto no navegador.');
      }
    };
    reader.readAsDataURL(file);
  });

  // 6. Amigos / Social (Topo Direito)
  btnMenuFriends.addEventListener('click', () => {
    playUiClickSound();
    spawnFloatingBubble(btnMenuFriends, '👥 Amigos', '#60a5fa');
    friendsModal.classList.remove('hidden');
  });

  friendsCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    friendsModal.classList.add('hidden');
  });

  btnFriendsCreateRoom.addEventListener('click', () => {
    playBattleStartSound();
    friendsModal.classList.add('hidden');
    connectSocket();
    socket.emit('create_room', { playerName });
    openGameArena();
  });

  btnFriendsJoin.addEventListener('click', () => {
    const code = inputFriendsCode.value.trim().toUpperCase();
    if (!code) return showToast('Digite o código de 6 caracteres.');
    playBattleStartSound();
    friendsModal.classList.add('hidden');
    connectSocket();
    socket.emit('join_room', { roomId: code, playerName });
    openGameArena();
  });

  accountFormToggleBtn.addEventListener('click', () => {
    accountForm.classList.toggle('hidden');
    accountFormStatus.textContent = '';
  });

  accountModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      accountFormMode = button.dataset.accountMode;
      accountFormStatus.textContent = '';
      accountConfirmPasswordInput.value = '';
      renderAccountUI();
    });
  });

  accountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    accountFormStatus.textContent = '';

    if (accountFormMode === 'register' && accountPasswordInput.value !== accountConfirmPasswordInput.value) {
      accountFormStatus.textContent = 'As senhas não conferem.';
      return;
    }

    accountSubmitBtn.disabled = true;
    try {
      const endpoint = accountFormMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: accountUsernameInput.value.trim(),
          password: accountPasswordInput.value
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível entrar na conta.');

      applyAccountProfile(result.account);
      accountPasswordInput.value = '';
      accountConfirmPasswordInput.value = '';
      accountForm.classList.add('hidden');
      accountFormStatus.textContent = 'Conta conectada.';
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      showToast(`Bem-vindo, ${result.account.username}!`);
    } catch (error) {
      accountFormStatus.textContent = error.message || 'Falha ao conectar à conta.';
    } finally {
      accountSubmitBtn.disabled = false;
    }
  });

  accountLogoutBtn.addEventListener('click', async () => {
    accountLogoutBtn.disabled = true;
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível sair da conta.');

      if (socket) {
        socket.disconnect();
        socket = null;
      }
      playerName = localStorage.getItem('xadrez_player_name') || 'Jogador67';
      applyAccountProfile(null);
      accountFormStatus.textContent = 'Você saiu da conta.';
    } catch (error) {
      accountFormStatus.textContent = error.message || 'Falha ao sair da conta.';
    } finally {
      accountLogoutBtn.disabled = false;
    }
  });

  // 9. Passe de Batalha (Inferior Esquerdo)
  function openBattlePassModal() {
    playFanfareSound();
    if (!window.BattlePass) return;
    const p = window.BattlePass.getProgressToNext();

    bpModalLevel.textContent = `NÍVEL ${p.level}`;
    bpModalTotalPoints.textContent = p.totalPoints;
    bpModalProgressBar.style.width = `${p.percent}%`;
    bpModalNextGoal.textContent = `${p.current} / 10 capturas para a próxima skin`;

    const tiers = window.BattlePass.getAllTiers();
    bpTiersList.innerHTML = '';

    tiers.forEach(t => {
      const row = document.createElement('div');
      row.className = 'bp-tier-card';
      row.innerHTML = `
        <div class="bp-tier-badge">NVL ${t.level}</div>
        <div class="bp-tier-icon">${t.iconSymbol}</div>
        <div class="bp-tier-details">
          <span class="bp-tier-name">${t.name}</span>
          <span class="bp-tier-desc">${t.description}</span>
        </div>
        <div>
          ${t.isUnlocked 
            ? `<span class="bp-status-pill unlocked">Desbloqueado</span>`
            : `<span class="bp-status-pill locked">Faltam ${t.pointsRemaining} pts</span>`
          }
        </div>
      `;
      bpTiersList.appendChild(row);
    });

    battlePassModal.classList.remove('hidden');
  }

  btnMenuBattlePass.addEventListener('click', () => {
    spawnFloatingBubble(btnMenuBattlePass, '👑 Passe de Batalha', '#f59e0b');
    openBattlePassModal();
  });

  btnMenuBattlePassArt.addEventListener('click', () => {
    playFanfareSound();
    openBattlePassModal();
  });

  btnQuickBattlePass.addEventListener('click', openBattlePassModal);
  battlePassCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    battlePassModal.classList.add('hidden');
  });
  battlePassConfirmCloseBtn.addEventListener('click', () => {
    playUiClickSound();
    battlePassModal.classList.add('hidden');
  });

  function updateBattlePassUI() {
    if (!window.BattlePass) return;
    const p = window.BattlePass.getProgressToNext();
    if (quickBpLevel) quickBpLevel.textContent = `Nvl ${p.level}`;
  }

  // ==========================================================================
  // TOPBAR DA ARENA: BOTÃO DE SOM
  // ==========================================================================
  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('xadrez_sound', isSoundEnabled ? 'true' : 'false');
    soundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
    playUiClickSound();
    showToast(isSoundEnabled ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados');
  });

  // ==========================================================================
  // INTELIGÊNCIA ARTIFICIAL DOS BOTS (MINIMAX + ALPHA-BETA + PST)
  // ==========================================================================
  const ChessBot = {
    values: { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 },

    pst: {
      p: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
      ],
      n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      r: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
      ],
      q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-20,-20],
        [-10,-20,-20,-20,-20,-20,-10,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
      ]
    },

    evaluate(gameInst, targetColor) {
      if (gameInst.in_checkmate()) return gameInst.turn() === targetColor ? -99999 : 99999;
      if (gameInst.in_draw() || gameInst.in_stalemate()) return 0;

      let score = 0;
      const b = gameInst.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = b[r][c];
          if (!piece) continue;

          const val = this.values[piece.type] || 0;
          const table = this.pst[piece.type];
          let pos = 0;
          if (table) pos = piece.color === 'w' ? table[r][c] : table[7 - r][c];

          const total = val + pos;
          if (piece.color === targetColor) score += total;
          else score -= total;
        }
      }
      return score;
    },

    minimax(gameInst, depth, alpha, beta, isMaximizing, targetColor) {
      if (depth === 0 || gameInst.game_over()) return this.evaluate(gameInst, targetColor);

      const moves = gameInst.moves({ verbose: true });
      moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const m of moves) {
          gameInst.move(m);
          const val = this.minimax(gameInst, depth - 1, alpha, beta, false, targetColor);
          gameInst.undo();
          maxEval = Math.max(maxEval, val);
          alpha = Math.max(alpha, val);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const m of moves) {
          gameInst.move(m);
          const val = this.minimax(gameInst, depth - 1, alpha, beta, true, targetColor);
          gameInst.undo();
          minEval = Math.min(minEval, val);
          beta = Math.min(beta, val);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    },

    getMove(gameInst, diff, botCol) {
      const moves = gameInst.moves({ verbose: true });
      if (moves.length === 0) return null;

      // 1. Martin (250)
      if (diff === 'easy') {
        if (Math.random() < 0.65) {
          return moves[Math.floor(Math.random() * moves.length)];
        }
      }

      // 2. Nelson (1300)
      if (diff === 'medium') {
        const queenMoves = moves.filter(m => m.piece === 'q');
        if (queenMoves.length > 0 && Math.random() < 0.4) {
          return queenMoves[Math.floor(Math.random() * queenMoves.length)];
        }
      }

      // 3. Isabel / Mestre IA (1600 / 2500)
      let depth = 2;
      if (diff === 'hard') depth = 3;

      let bestMove = moves[0];
      let bestVal = -Infinity;

      for (const m of moves) {
        gameInst.move(m);
        const val = this.minimax(gameInst, depth - 1, -Infinity, Infinity, false, botCol);
        gameInst.undo();

        if (val > bestVal) {
          bestVal = val;
          bestMove = m;
        }
      }

      return bestMove;
    }
  };

  // ==========================================================================
  // RESOLUÇÃO DE SKINS & TEMAS
  // ==========================================================================
  function resolvePieceTheme(piece) {
    if (!piece || piece.length < 2) return '';
    const type = piece[1].toLowerCase();
    const packId = currentPieceMix[type] || currentGlobalPack;
    const pack = window.ChessThemes?.pieceSets[packId] || window.ChessThemes?.pieceSets.cburnett;
    return pack ? pack.getUrl(piece) : `img/chesspieces/wikipedia/${piece}.png`;
  }

  function applyBoardTheme(themeId) {
    const theme = window.ChessThemes?.boards[themeId] || window.ChessThemes?.boards.tournament;
    if (theme) {
      document.documentElement.style.setProperty('--board-light', theme.light);
      document.documentElement.style.setProperty('--board-dark', theme.dark);
      currentBoardTheme = theme.id;
      localStorage.setItem('xadrez_board_theme', theme.id);
    }
  }

  // ==========================================================================
  // SISTEMA DE RELÓGIOS DIGITAIS
  // ==========================================================================
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function updateClocksDisplay() {
    if (playerColor === 'white') {
      myClockText.textContent = formatTime(whiteTime);
      opponentClockText.textContent = formatTime(blackTime);
    } else {
      myClockText.textContent = formatTime(blackTime);
      opponentClockText.textContent = formatTime(whiteTime);
    }

    const isWhiteTurn = game.turn() === 'w';
    if (playerColor === 'white') {
      myClock.classList.toggle('active', isWhiteTurn);
      opponentClock.classList.toggle('active', !isWhiteTurn);
    } else {
      myClock.classList.toggle('active', !isWhiteTurn);
      opponentClock.classList.toggle('active', isWhiteTurn);
    }
  }

  function startClocks() {
    if (clockInterval) clearInterval(clockInterval);

    clockInterval = setInterval(() => {
      if (game.game_over()) {
        clearInterval(clockInterval);
        return;
      }

      if (game.turn() === 'w') {
        whiteTime--;
        if (whiteTime <= 0) {
          whiteTime = 0;
          handleTimeOut('w');
        }
      } else {
        blackTime--;
        if (blackTime <= 0) {
          blackTime = 0;
          handleTimeOut('b');
        }
      }
      updateClocksDisplay();
    }, 1000);
  }

  function resetClocks() {
    if (clockInterval) clearInterval(clockInterval);
    whiteTime = 600;
    blackTime = 600;
    updateClocksDisplay();
  }

  function handleTimeOut(color) {
    clearInterval(clockInterval);
    playChessComSound('gameover');
    const winner = color === 'w' ? 'Pretas' : 'Brancas';
    showToast(`Tempo esgotado! Vitória das ${winner}!`);
    gameAlertBox.className = 'cc-status-alert-box success';
    gameAlertText.textContent = `Vitória das ${winner} por tempo!`;
    gameAlertBox.classList.remove('hidden');
  }

  // ==========================================================================
  // BARRA DE AVALIAÇÃO (EVAL BAR) & PEÇAS CAPTURADAS
  // ==========================================================================
  function updateEvalBar() {
    if (game.game_over()) {
      if (game.in_checkmate()) {
        const isWhiteWin = game.turn() === 'b';
        evalBarWhite.style.height = isWhiteWin ? '100%' : '0%';
        evalScoreText.textContent = isWhiteWin ? '#1' : '#-1';
        return;
      }
      evalBarWhite.style.height = '50%';
      evalScoreText.textContent = '0.0';
      return;
    }

    const score = ChessBot.evaluate(game, 'w');
    const clampedScore = Math.max(-1000, Math.min(1000, score));
    const pct = 50 + (clampedScore / 1000) * 45;
    evalBarWhite.style.height = `${pct}%`;

    const displayNum = (score / 100).toFixed(1);
    evalScoreText.textContent = score > 0 ? `+${displayNum}` : displayNum;
  }

  function updateCapturedPieces() {
    const fullSet = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };

    const boardMat = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardMat[r][c];
        if (p && p.type !== 'k') {
          currentCounts[p.color][p.type]++;
        }
      }
    }

    const whiteCaptured = [];
    let whiteMatLost = 0;
    const blackCaptured = [];
    let blackMatLost = 0;

    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };

    ['q', 'r', 'b', 'n', 'p'].forEach(type => {
      const lostW = fullSet[type] - currentCounts.w[type];
      for (let i = 0; i < lostW; i++) {
        whiteCaptured.push({ color: 'w', type });
        whiteMatLost += values[type];
      }
      const lostB = fullSet[type] - currentCounts.b[type];
      for (let i = 0; i < lostB; i++) {
        blackCaptured.push({ color: 'b', type });
        blackMatLost += values[type];
      }
    });

    const netAdvantage = blackMatLost - whiteMatLost;

    function renderPieces(container, piecesList, advantage) {
      container.innerHTML = '';
      piecesList.forEach(p => {
        const img = document.createElement('img');
        img.className = 'cc-cap-item';
        img.src = resolvePieceTheme(`${p.color}${p.type.toUpperCase()}`);
        container.appendChild(img);
      });
      if (advantage > 0) {
        const adv = document.createElement('span');
        adv.className = 'cc-diff-score';
        adv.textContent = `+${advantage}`;
        container.appendChild(adv);
      }
    }

    if (playerColor === 'white') {
      renderPieces(myCapturedPieces, blackCaptured, netAdvantage > 0 ? netAdvantage : 0);
      renderPieces(opponentCapturedPieces, whiteCaptured, netAdvantage < 0 ? Math.abs(netAdvantage) : 0);
    } else {
      renderPieces(myCapturedPieces, whiteCaptured, netAdvantage < 0 ? Math.abs(netAdvantage) : 0);
      renderPieces(opponentCapturedPieces, blackCaptured, netAdvantage > 0 ? netAdvantage : 0);
    }
  }

  // ==========================================================================
  // INICIALIZAÇÃO DO TABULEIRO (CHESSBOARD.JS)
  // ==========================================================================
  function initBoard() {
    if (board) {
      board.resize();
      return;
    }

    const config = {
      draggable: true,
      position: 'start',
      pieceTheme: resolvePieceTheme,
      onDragStart: handleDragStart,
      onDrop: handleDrop,
      onSnapEnd: handleSnapEnd
    };

    board = Chessboard('board', config);
    window.addEventListener('resize', () => board && board.resize());
  }

  function handleDragStart(source, piece, position, orientation) {
    initAudio();
    if (game.game_over() || isBotThinking) return false;
    if (currentGameMode === 'multiplayer' && playerRole === 'spectator') return false;

    const isWhiteTurn = game.turn() === 'w';
    if (playerColor === 'white' && (!isWhiteTurn || piece.search(/^b/) !== -1)) return false;
    if (playerColor === 'black' && (isWhiteTurn || piece.search(/^w/) !== -1)) return false;

    return true;
  }

  function handleDrop(source, target) {
    if (source === target) return;

    const move = game.move({
      from: source,
      to: target,
      promotion: 'q'
    });

    if (move === null) return 'snapback';

    // Som de lance/captura
    if (move.captured) playChessComSound('capture');
    else playChessComSound('move');

    // Passe de Batalha: acumula +1 ponto por captura
    if (move.captured && window.BattlePass) {
      const bp = window.BattlePass.addPoints(1);
      updateBattlePassUI();
      showToast(`+1 Ponto de Captura! (${bp.totalPoints % 10}/10 pts para nova skin)`);
      if (bp.leveledUp) {
        playFanfareSound();
        showModal({
          title: 'Novo Nível no Passe!',
          message: `Parabéns! Você alcançou o Nível ${bp.newLevel} e desbloqueou novas skins de peças!`,
          confirmText: 'Ver no Passe',
          onConfirm: openBattlePassModal
        });
      }
    }

    moveHistory.push(move);
    renderMovesList();
    updateBoardState();

    if (currentGameMode === 'bot') {
      if (!game.game_over() && game.turn() === botColor) {
        triggerBotMove();
      }
    } else if (socket) {
      socket.emit('make_move', {
        roomId: currentRoomId,
        from: source,
        to: target,
        promotion: 'q'
      });
    }
  }

  function handleSnapEnd() {
    if (board && game) board.position(game.fen());
  }

  // ==========================================================================
  // TURNO DO BOT (CHESS.COM AI)
  // ==========================================================================
  function triggerBotMove() {
    isBotThinking = true;
    const delay = 350 + Math.floor(Math.random() * 400);

    setTimeout(() => {
      if (game.game_over()) {
        isBotThinking = false;
        return;
      }

      const botMove = ChessBot.getMove(game, currentBot.diff, botColor);
      if (botMove) {
        const res = game.move(botMove);
        board.position(game.fen());

        if (res.captured) playChessComSound('capture');
        else playChessComSound('move');

        moveHistory.push(res);
        renderMovesList();
      }

      isBotThinking = false;
      updateBoardState();
    }, delay);
  }

  // ==========================================================================
  // ATUALIZAÇÃO GERAL DO ESTADO DO JOGO
  // ==========================================================================
  function updateBoardState() {
    updateClocksDisplay();
    updateEvalBar();
    updateCapturedPieces();

    if (game.in_checkmate()) {
      playChessComSound('gameover');
      const winner = game.turn() === 'w' ? 'Pretas' : 'Brancas';
      gameAlertBox.className = 'cc-status-alert-box success';
      gameAlertText.textContent = `Xeque-mate! Vitória das ${winner}!`;
      gameAlertBox.classList.remove('hidden');
    } else if (game.in_draw() || game.in_stalemate()) {
      playChessComSound('gameover');
      gameAlertBox.className = 'cc-status-alert-box';
      gameAlertText.textContent = 'Empate!';
      gameAlertBox.classList.remove('hidden');
    } else if (game.in_check()) {
      playChessComSound('check');
      gameAlertBox.className = 'cc-status-alert-box';
      gameAlertText.textContent = 'Xeque!';
      gameAlertBox.classList.remove('hidden');
    } else {
      gameAlertBox.classList.add('hidden');
    }
  }

  function renderMovesList() {
    moveCount.textContent = moveHistory.length;
    if (moveHistory.length === 0) {
      movesTableBody.innerHTML = '<div class="cc-empty-moves">Partida em andamento. Faça seu lance!</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
      const num = Math.floor(i / 2) + 1;
      const wMove = moveHistory[i] ? moveHistory[i].san : '';
      const bMove = moveHistory[i + 1] ? moveHistory[i + 1].san : '';

      const isLastW = i === moveHistory.length - 1;
      const isLastB = i + 1 === moveHistory.length - 1;

      html += `
        <div class="cc-move-row">
          <span class="cc-move-num">${num}.</span>
          <span class="cc-move-white ${isLastW ? 'latest' : ''}">${wMove}</span>
          <span class="cc-move-black ${isLastB ? 'latest' : ''}">${bMove}</span>
        </div>
      `;
    }

    movesTableBody.innerHTML = html;
    movesTableBody.scrollTop = movesTableBody.scrollHeight;
  }

  // ==========================================================================
  // INICIAR PARTIDA
  // ==========================================================================
  function startNewGame() {
    initAudio();
    game.reset();
    moveHistory = [];
    resetClocks();

    initBoard();
    board.position('start');
    board.orientation(playerColor === 'black' ? 'black' : 'white');

    if (currentGameMode === 'bot') {
      opponentName.textContent = `${currentBot.name} (Bot)`;
      opponentRating.textContent = currentBot.rating;
      opponentAvatarImg.src = currentBot.avatar;

      myName.textContent = playerName;
      myRating.textContent = '1200';

      botColor = playerColor === 'white' ? 'b' : 'w';
      arenaModeLabel.textContent = `Partida vs ${currentBot.name}`;

      showToast(`Partida iniciada contra ${currentBot.name}!`);

      if (playerColor === 'black') {
        triggerBotMove();
      }
    } else {
      arenaModeLabel.textContent = `Partida Online (${currentRoomId || 'Multiplayer'})`;
    }

    startClocks();
    updateBoardState();
    renderMovesList();
  }

  // ==========================================================================
  // MULTIPLAYER ONLINE VIA SOCKET.IO
  // ==========================================================================
  function connectSocket() {
    if (socket) return;
    try {
      socket = io();

      socket.on('connect', () => {
        showToast('Conectado ao servidor multiplayer');
      });

      socket.on('game_error', ({ message }) => {
        showToast(message || 'Não foi possível concluir a ação.');
      });

      socket.on('move_error', ({ message }) => {
        showToast(message || 'Lance inválido.');
      });

      socket.on('economy_updated', ({ account, coinsEarned, rubiesEarned }) => {
        if (!currentAccount || account.id !== currentAccount.id) return;
        applyAccountProfile(account);
        const rewards = [];
        if (coinsEarned > 0) rewards.push(`+${coinsEarned} moedas`);
        if (rubiesEarned > 0) rewards.push(`+${rubiesEarned} rubi`);
        showToast(rewards.length ? `Recompensa: ${rewards.join(' e ')}!` : 'Saldo atualizado.');
      });

      socket.on('room_joined', ({ role, room, message }) => {
        currentRoomId = room.roomId;
        playerRole = role;
        playerColor = role === 'black' ? 'black' : 'white';

        initBoard();
        board.orientation(playerColor);
        game.load(room.fen);
        board.position(room.fen);

        if (role === 'white') {
          opponentName.textContent = room.players.black?.name || 'Aguardando oponente...';
          opponentRating.textContent = '1200';
        } else {
          opponentName.textContent = room.players.white?.name || 'Oponente';
          opponentRating.textContent = '1200';
        }

        arenaModeLabel.textContent = `Sala: ${currentRoomId}`;
        updateBoardState();
        showToast(message || `Entrou na sala ${currentRoomId}!`);
      });

      socket.on('move_made', ({ move, fen, history }) => {
        game.load(fen);
        board.position(fen);

        if (move && move.captured) playChessComSound('capture');
        else playChessComSound('move');

        moveHistory = history;
        renderMovesList();
        updateBoardState();
      });

      socket.on('rematch_started', ({ role, message }) => {
        playerRole = role;
        playerColor = role === 'black' ? 'black' : 'white';
        game.reset();
        board.position('start');
        board.orientation(playerColor);
        moveHistory = [];
        renderMovesList();
        updateBoardState();
        showToast(message || 'Revanche iniciada!');
      });
    } catch (e) {
      console.warn('Socket connection error:', e);
    }
  }

  // Ações no Modal de Modos (Multiplayer)
  btnModalCreateRoom.addEventListener('click', () => {
    gameModesModal.classList.add('hidden');
    connectSocket();
    socket.emit('create_room', { playerName });
    openGameArena();
  });

  btnModalJoinRoom.addEventListener('click', () => {
    const code = inputModalRoomCode.value.trim().toUpperCase();
    if (!code) return showToast('Digite o código de 6 caracteres.');
    gameModesModal.classList.add('hidden');
    connectSocket();
    socket.emit('join_room', { roomId: code, playerName });
    openGameArena();
  });

  // ==========================================================================
  // CONTROLES DE PARTIDA (DESISTIR / REVANCHE)
  // ==========================================================================
  btnResign.addEventListener('click', () => {
    if (game.game_over()) return;
    showModal({
      title: 'Confirmar Desistência',
      message: 'Você tem certeza que deseja abandonar a partida?',
      confirmText: 'Sim, Desistir',
      onConfirm: () => {
        playChessComSound('gameover');
        gameAlertBox.className = 'cc-status-alert-box';
        gameAlertText.textContent = 'Você abandonou a partida.';
        gameAlertBox.classList.remove('hidden');
      }
    });
  });

  btnRematch.addEventListener('click', () => {
    if (currentGameMode === 'bot') {
      playerColor = playerColor === 'white' ? 'black' : 'white';
      startNewGame();
    } else if (socket && currentRoomId) {
      socket.emit('request_rematch', { roomId: currentRoomId });
      showToast('Pedido de revanche enviado!');
    }
  });

  // Abas de Lances e Chat na Arena
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      panelContents.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.dataset.panel;
      document.getElementById(target)?.classList.add('active');
    });
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const el = document.createElement('div');
    el.className = 'cc-chat-bubble mine';
    el.textContent = text;
    chatMessages.appendChild(el);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (currentGameMode === 'bot') {
      setTimeout(() => {
        const resp = document.createElement('div');
        resp.className = 'cc-chat-bubble opp';
        resp.innerHTML = `<div class="cc-chat-author">${currentBot.name}</div><span>Estou focado na minha próxima jogada!</span>`;
        chatMessages.appendChild(resp);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 700);
    }
  });

  // ==========================================================================
  // INVENTÁRIO & SKINS: RENDERIZADOR
  // ==========================================================================
  function renderCustomizer() {
    if (!window.ChessThemes) return;

    // 1. Temas de Tabuleiro
    boardThemesGrid.innerHTML = '';
    Object.values(window.ChessThemes.boards).forEach(theme => {
      const card = document.createElement('div');
      card.className = `theme-card ${theme.id === currentBoardTheme ? 'active' : ''}`;
      card.innerHTML = `
        <div class="mini-board-preview">
          <div style="background-color: ${theme.light};"></div>
          <div style="background-color: ${theme.dark};"></div>
          <div style="background-color: ${theme.dark};"></div>
          <div style="background-color: ${theme.light};"></div>
        </div>
        <span class="theme-title">${theme.name}</span>
      `;
      card.onclick = () => {
        playUiClickSound();
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        applyBoardTheme(theme.id);
      };
      boardThemesGrid.appendChild(card);
    });

    // 2. Pacotes de Peças
    piecePacksGrid.innerHTML = '';
    Object.values(window.ChessThemes.pieceSets).forEach(pack => {
      const card = document.createElement('div');
      card.className = `pack-card ${pack.id === currentGlobalPack ? 'active' : ''}`;
      card.innerHTML = `
        <div class="pack-preview-row">
          <img src="${pack.getUrl('wK')}" class="pack-preview-piece" alt="K">
          <img src="${pack.getUrl('wQ')}" class="pack-preview-piece" alt="Q">
          <img src="${pack.getUrl('wN')}" class="pack-preview-piece" alt="N">
          <img src="${pack.getUrl('bP')}" class="pack-preview-piece" alt="P">
        </div>
        <div class="pack-card-info">
          <strong>${pack.name}</strong>
          <p>${pack.description}</p>
        </div>
      `;
      card.onclick = () => {
        playUiClickSound();
        document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentGlobalPack = pack.id;
        localStorage.setItem('xadrez_piece_pack', pack.id);
        if (board) board.position(game.fen());
      };
      piecePacksGrid.appendChild(card);
    });

    // 3. Customização Peça por Peça
    pieceMixGrid.innerHTML = '';
    window.ChessThemes.pieceTypes.forEach(piece => {
      const row = document.createElement('div');
      row.className = 'piece-row-card';
      const cur = currentPieceMix[piece.key] || currentGlobalPack;

      let opts = '';
      Object.values(window.ChessThemes.pieceSets).forEach(p => {
        opts += `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${p.name}</option>`;
      });

      row.innerHTML = `
        <div class="piece-type-label"><span>${piece.symbol}</span> <span>${piece.name}</span></div>
        <select class="piece-select" data-piece="${piece.key}">${opts}</select>
      `;

      row.querySelector('.piece-select').onchange = (e) => {
        playUiClickSound();
        currentPieceMix[piece.key] = e.target.value;
        localStorage.setItem('xadrez_piece_mix', JSON.stringify(currentPieceMix));
        if (board) board.position(game.fen());
      };

      pieceMixGrid.appendChild(row);
    });
  }

  // Abas do Customizador
  customTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playUiClickSound();
      customTabBtns.forEach(b => b.classList.remove('active'));
      customTabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.dataset.target;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  resetCustomBtn.addEventListener('click', () => {
    playUiClickSound();
    currentBoardTheme = 'tournament';
    currentGlobalPack = 'cburnett';
    currentPieceMix = {};
    applyBoardTheme('tournament');
    renderCustomizer();
    if (board) board.position(game.fen());
    showToast('Padrões restaurados!');
  });

  // ==========================================================================
  // MODAL GERAL & TOAST NOTIFICATION
  // ==========================================================================
  function showModal({ title, message, confirmText = 'OK', onConfirm = null }) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalConfirmBtn.textContent = confirmText;
    modalConfirmBtn.onclick = () => {
      playUiClickSound();
      appModal.classList.add('hidden');
      if (typeof onConfirm === 'function') onConfirm();
    };
    appModal.classList.remove('hidden');
  }

  modalCloseBtn.onclick = () => {
    playUiClickSound();
    appModal.classList.add('hidden');
  };

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastNotification.textContent = msg;
    toastNotification.classList.remove('hidden');
    toastTimer = setTimeout(() => toastNotification.classList.add('hidden'), 2800);
  }

  // ==========================================================================
  // INICIALIZAÇÃO AUTOMÁTICA DO TEMA
  // ==========================================================================
  applyBoardTheme(currentBoardTheme);
  updateBattlePassUI();
});
