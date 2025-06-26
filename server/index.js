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
let synergyScores = {}; // { 'alice|bob': { score: 3, names: ['Alice', 'Bob'] } }
let allTimeHighScore = null; // lowest number of guesses to win

function getPlayerList() {
  return Object.values(players).map(p => ({ name: p.name, id: p.id, index: p.index }));
}

function getSynergyKey(name1, name2) {
  // Lowercase, sorted
  return [name1.trim().toLowerCase(), name2.trim().toLowerCase()].sort().join('|');
}

function updateSynergyScore(name1, name2, guesses, maxTries) {
  const key = getSynergyKey(name1, name2);
  if (!synergyScores[key] || guesses < synergyScores[key].score) {
    synergyScores[key] = {
      score: guesses,
      names: [name1, name2],
      percent: Math.max(0, Math.round(100 * (1 - (guesses-1)/(maxTries-1))) )
    };
  }
  if (allTimeHighScore === null || guesses < allTimeHighScore) {
    allTimeHighScore = guesses;
  }
}

function getSynergyScoreboard() {
  return Object.values(synergyScores);
}

function resetGame() {
  roundWords = [];
  currentWords = {};
  gameActive = true;
  gameStarted = true;
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id, 'Current players:', Object.keys(players));

  // On set_name, add to players if room is not full
  socket.on('set_name', (data) => {
    if (Object.keys(players).length >= 2) {
      // Send names of current players
      const currentNames = Object.values(players).map(p => p.name).filter(Boolean);
      socket.emit('full', { players: currentNames });
      socket.disconnect();
      return;
    }
    let name, maxTriesValue;
    if (typeof data === 'string') {
      name = data;
    } else if (typeof data === 'object' && data !== null) {
      name = data.name;
      if (typeof data.maxTries === 'number' && Object.keys(players).length === 0) {
        maxTriesValue = data.maxTries;
      }
    }
    const index = Object.keys(players).length;
    players[socket.id] = { id: socket.id, index, name };
    if (maxTriesValue) maxTries = maxTriesValue;
    socket.emit('player_index', index);
    io.emit('players_update', getPlayerList());
    // Only start game if both players are present and have names
    if (
      Object.values(players).length === 2 &&
      Object.values(players).every(p => typeof p.name === 'string' && p.name)
    ) {
      resetGame();
      io.emit('game_state', { roundWords, highScore: allTimeHighScore, gameActive, round: roundWords.length + 1, maxTries });
    } else {
      // If only one player, emit waiting state
      io.emit('game_state', { waiting: true, gameActive: false, roundWords, highScore: allTimeHighScore, round: 1, maxTries });
    }
  });

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
        const playerNames = Object.values(players).map(p => p.name);
        const guesses = roundWords.length;
        updateSynergyScore(playerNames[0], playerNames[1], guesses, maxTries);
        io.emit('game_state', {
          roundWords,
          highScore: allTimeHighScore,
          synergyScoreboard: getSynergyScoreboard(),
          gameActive,
          win: true,
          round: roundWords.length,
          maxTries
        });
      } else {
        currentWords = {};
        io.emit('game_state', {
          roundWords,
          highScore: allTimeHighScore,
          synergyScoreboard: getSynergyScoreboard(),
          gameActive,
          round: roundWords.length + 1,
          maxTries
        });
      }
    } else {
      io.emit('game_state', {
        roundWords,
        highScore: allTimeHighScore,
        synergyScoreboard: getSynergyScoreboard(),
        gameActive,
        round: roundWords.length + 1,
        maxTries
      });
    }
  });

  socket.on('restart', () => {
    if (Object.values(players).length === 2) {
      resetGame();
      io.emit('game_state', { roundWords, highScore: allTimeHighScore, gameActive, round: 1, maxTries });
    }
  });

  socket.on('disconnect', () => {
    if (players[socket.id]) {
      delete players[socket.id];
      currentWords = {};
      gameActive = false;
      gameStarted = false;
      io.emit('players_update', getPlayerList());
      // If only one player left, emit waiting state
      if (Object.keys(players).length === 1) {
        io.emit('game_state', { waiting: true, gameActive: false, roundWords, highScore: allTimeHighScore, round: 1, maxTries });
      } else {
        io.emit('game_state', { roundWords, highScore: allTimeHighScore, gameActive, round: roundWords.length + 1, maxTries });
      }
      console.log('Player disconnected:', socket.id, 'Current players:', Object.keys(players));
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