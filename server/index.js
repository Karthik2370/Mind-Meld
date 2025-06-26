const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv').config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN || 'https://your-frontend.vercel.app'
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

function getPlayerList() {
  return Object.values(players).map(p => ({ name: p.name, id: p.id, index: p.index }));
}

function resetGame() {
  roundWords = [];
  currentWords = {};
  gameActive = true;
}

io.on('connection', (socket) => {
  let index = Object.keys(players).length;
  if (index > 1) {
    socket.emit('full');
    socket.disconnect();
    return;
  }
  players[socket.id] = { id: socket.id, index, name: '' };
  socket.emit('player_index', index);
  io.emit('players_update', getPlayerList());

  // Receive name and maxTries
  socket.on('set_name', (data) => {
    if (players[socket.id]) {
      // Accept both string and object for backward compatibility
      if (typeof data === 'string') {
        players[socket.id].name = data;
      } else if (typeof data === 'object' && data !== null) {
        players[socket.id].name = data.name;
        // Only set maxTries if this is the first player
        if (typeof data.maxTries === 'number' && Object.values(players).length === 1) {
          maxTries = data.maxTries;
        }
      }
      io.emit('players_update', getPlayerList());
      // Start game if both players are ready
      if (Object.values(players).length === 2 && Object.values(players).every(p => typeof p.name === 'string' && p.name)) {
        resetGame();
        io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1, maxTries });
      }
    }
  });

  // Receive word for this round
  socket.on('submit_word', (word) => {
    if (!gameActive) return;
    currentWords[socket.id] = word.trim();
    // If both players have submitted
    if (Object.keys(currentWords).length === 2) {
      const ids = Object.keys(players);
      const words = ids.map(id => currentWords[id]);
      roundWords.push(words);
      // Check for match
      if (words[0] && words[1] && words[0].toLowerCase() === words[1].toLowerCase()) {
        gameActive = false;
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
    if (Object.values(players).length === 2) {
      resetGame();
      io.emit('game_state', { roundWords, highScore, gameActive, round: 1 });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    currentWords = {};
    gameActive = false;
    io.emit('players_update', getPlayerList());
    io.emit('game_state', { roundWords, highScore, gameActive, round: roundWords.length + 1 });
  });
});

app.get('/', (req, res) => {
  res.send('Word Match Game Server Running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Allowed origins:', allowedOrigins);
}); 