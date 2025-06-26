const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv').config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN || 'https://mind-meld-game.vercel.app'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let players = {};
let roundWords = [];
let currentWords = {};
let highScore = 0;
let gameActive = false;
let maxTries = 0;
let gameStarted = false;

function getPlayerList() {
  return Object.values(players).map(p => ({ name: p.name, id: p.id, index: p.index }));
}

function resetGame() {
  roundWords = [];
  currentWords = {};
  gameActive = true;
  gameStarted = true;
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id, 'Current players:', Object.keys(players));
  let index = Object.keys(players).length;
  if (index > 1) {
    socket.emit('full');
    socket.disconnect();
    return;
  }
  players[socket.id] = { id: socket.id, index, name: '' };
  socket.emit('player_index', index);
  io.emit('players_update', getPlayerList());

  // Wait for both players to set names before starting
  socket.on('set_name', (data) => {
    if (players[socket.id]) {
      if (typeof data === 'string') {
        players[socket.id].name = data;
      } else if (typeof data === 'object' && data !== null) {
        players[socket.id].name = data.name;
        if (typeof data.maxTries === 'number' && Object.values(players).length === 1) {
          maxTries = data.maxTries;
        }
      }
      io.emit('players_update', getPlayerList());
      // Only start game if both players are present and have names
      if (
        Object.values(players).length === 2 &&
        Object.values(players).every(p => typeof p.name === 'string' && p.name) &&
        !gameActive
      ) {
        resetGame();
        io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1, maxTries });
      }
    }
  });

  // Receive word for this round
  socket.on('submit_word', (word) => {
    if (!gameActive) return;
    currentWords[socket.id] = word.trim();
    if (Object.keys(currentWords).length === 2) {
      const ids = Object.keys(players);
      const words = ids.map(id => currentWords[id]);
      roundWords.push(words);
      if (words[0] && words[1] && words[0].toLowerCase() === words[1].toLowerCase()) {
        gameActive = false;
        gameStarted = false;
        if (roundWords.length > highScore) highScore = roundWords.length;
        io.emit('game_state', { roundWords, highScore, gameActive, win: true, round: roundWords.length });
      } else {
        currentWords = {};
        io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1 });
      }
    } else {
      io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1 });
    }
  });

  socket.on('restart', () => {
    // Only allow restart if both players are still connected
    if (Object.values(players).length === 2) {
      resetGame();
      io.emit('game_state', { roundWords, highScore, gameActive, round: 1, maxTries });
    }
  });

  socket.on('disconnect', () => {
    // Only remove player if game hasn't started or after game over
    if (!gameActive || !gameStarted) {
      delete players[socket.id];
      currentWords = {};
      gameActive = false;
      gameStarted = false;
      io.emit('players_update', getPlayerList());
      io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1 });
      console.log('Player disconnected:', socket.id, 'Current players:', Object.keys(players));
    } else {
      // If game is active, just mark as disconnected but keep player in list
      if (players[socket.id]) {
        players[socket.id].name = '';
      }
      io.emit('players_update', getPlayerList());
      console.log('Player disconnected (game active):', socket.id, 'Current players:', Object.keys(players));
    }
  });
});

app.get('/', (req, res) => {
  res.send('Word Match Game Server Running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Allowed origins:', allowedOrigins);
}); 