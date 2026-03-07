import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import { GameState, Player, Role } from '../src/types/game';
import { BOARD_SIZE, MAX_PLAYERS, INITIAL_TILES_PER_PLAYER } from '../src/constants/game';
import { createTileBag } from './tiles';
import { findWords, validateWords, calculateScore, PlacedTile } from './gameLogic';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

const STATE_FILE = path.join(process.cwd(), 'gamestate.json');

// Game State
let tileBag: any[] = [];
let currentTurnTiles: PlacedTile[] = [];
let gameState: GameState = {
  players: [],
  spectators: [],
  gameStarted: false,
  isGameOver: false,
  winner: null,
  currentPlayerIndex: 0,
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
  remainingTiles: 0,
};

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ gameState, tileBag, currentTurnTiles }));
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      const saved = JSON.parse(data);
      gameState = saved.gameState;
      tileBag = saved.tileBag;
      currentTurnTiles = saved.currentTurnTiles;
      // Mark all players as offline initially on restart
      gameState.players.forEach(p => p.online = false);
      console.log('Restored game state from disk');
    }
  } catch (err) {
    console.error('Failed to load state:', err);
  }
}

loadState();

nextApp.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    const { pathname } = parsedUrl;

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', players: gameState.players.length }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket']
  });

  console.log('Socket.io (Websocket only) initialized on port 3000');

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (username: string) => {
      console.log(`Join attempt: ${username} (ID: ${socket.id})`);
      
      // Check if this player is "reclaiming" a spot
      const existingPlayer = gameState.players.find(p => p.username.toLowerCase() === username.toLowerCase());
      
      let role: Role = 'spectator';

      if (existingPlayer) {
        console.log(`User ${username} reclaimed their spot.`);
        existingPlayer.id = socket.id;
        existingPlayer.online = true;
        role = 'player';
      } else if (!gameState.gameStarted && gameState.players.length < MAX_PLAYERS) {
        role = 'player';
        const newPlayer: Player = {
          id: socket.id,
          username,
          role: 'player',
          score: 0,
          rack: [],
          online: true
        };
        gameState.players.push(newPlayer);
      } else {
        gameState.spectators.push(socket.id);
      }

      socket.emit('joined', { role, gameState });
      io.emit('gameStateUpdate', gameState);
      saveState();
    });

    socket.on('startGame', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (player && gameState.players.length >= 2) {
        tileBag = createTileBag();
        gameState.players.forEach(p => {
          p.rack = tileBag.splice(0, INITIAL_TILES_PER_PLAYER);
        });
        gameState.remainingTiles = tileBag.length;
        gameState.gameStarted = true;
        gameState.currentPlayerIndex = 0;
        currentTurnTiles = [];
        io.emit('gameStarted', gameState);
        saveState();
      }
    });

    socket.on('placeTile', ({ row, col, tileIndex, representedLetter }: { row: number, col: number, tileIndex: number, representedLetter?: string }) => {
      const player = gameState.players.find(p => p.id === socket.id);
      const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === socket.id;
      
      if (player && isCurrentPlayer && !gameState.board[row][col]) {
        const tile = player.rack[tileIndex];
        if (tile) {
          const tileToPlace = { ...tile };
          if (tile.letter === '_' && representedLetter) {
            tileToPlace.representedLetter = representedLetter.toUpperCase();
          }
          
          gameState.board[row][col] = tileToPlace;
          player.rack.splice(tileIndex, 1);
          currentTurnTiles.push({ row, col, tile: tileToPlace });
          io.emit('gameStateUpdate', gameState);
          saveState();
        }
      }
    });

    socket.on('endTurn', () => {
      const player = gameState.players[gameState.currentPlayerIndex];
      if (player && player.id === socket.id) {
        if (currentTurnTiles.length === 0) {
           gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
           io.emit('gameStateUpdate', gameState);
           saveState();
           return;
        }

        const words = findWords(gameState.board, currentTurnTiles);
        const { valid, invalidWords } = validateWords(words);

        if (valid && words.length > 0) {
          const score = calculateScore(gameState.board, currentTurnTiles);
          player.score += score;
          const needed = INITIAL_TILES_PER_PLAYER - player.rack.length;
          const newTiles = tileBag.splice(0, needed);
          player.rack.push(...newTiles);
          gameState.remainingTiles = tileBag.length;
          currentTurnTiles = [];

          if (gameState.remainingTiles === 0 && player.rack.length === 0) {
            gameState.isGameOver = true;
            const winningPlayer = [...gameState.players].sort((a, b) => b.score - a.score)[0];
            gameState.winner = winningPlayer?.username || 'Draw';
          } else {
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
          }
          io.emit('gameStateUpdate', gameState);
          saveState();
        } else {
          socket.emit('invalidMove', { 
            message: words.length === 0 ? "You must form a word." : `Invalid words: ${invalidWords.join(', ')}`
          });
        }
      }
    });

    socket.on('revertTurn', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === socket.id;
      if (player && isCurrentPlayer && currentTurnTiles.length > 0) {
        currentTurnTiles.forEach(({ row, col, tile }) => {
          gameState.board[row][col] = null;
          player.rack.push(tile);
        });
        currentTurnTiles = [];
        io.emit('gameStateUpdate', gameState);
        saveState();
      }
    });

    socket.on('resetGame', () => {
        // Reset state
        gameState = {
            players: [],
            spectators: [],
            gameStarted: false,
            isGameOver: false,
            winner: null,
            currentPlayerIndex: 0,
            board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
            remainingTiles: 0,
        };
        tileBag = [];
        currentTurnTiles = [];
        if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
        io.emit('gameStateUpdate', gameState);
    });

    socket.on('disconnect', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (player) {
        player.online = false;
      }
      gameState.spectators = gameState.spectators.filter(id => id !== socket.id);
      
      // We don't remove players automatically anymore to allow reconnection
      // but if NO ONE is online, we might want to keep the state on disk but not in memory? 
      // For now, just keep it.
      
      io.emit('gameStateUpdate', gameState);
      saveState();
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
