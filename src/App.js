import React, { useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

function App() {
  const [playerIndex, setPlayerIndex] = useState(null);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [gameState, setGameState] = useState({ roundWords: [], highScore: 0, gameActive: false, round: 1, win: false });
  const [submitted, setSubmitted] = useState(false);
  const [maxTries, setMaxTries] = useState(15);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;
    socket.on('player_index', (idx) => setPlayerIndex(idx));
    socket.on('players_update', (list) => setPlayers(list));
    socket.on('game_state', (state) => {
      setGameState(state);
      setSubmitted(false);
      setWordInput('');
    });
    socket.on('full', () => {
      alert('Room is full!');
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (name && socketRef.current && playerIndex !== null) {
      socketRef.current.emit('set_name', { name, maxTries });
    }
  }, [name, playerIndex, maxTries]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!wordInput.trim() || !gameState.gameActive || submitted) return;
    socketRef.current.emit('submit_word', wordInput.trim());
    setSubmitted(true);
  }

  function handleRestart() {
    socketRef.current.emit('restart');
  }

  if (!name) {
    return (
      <StartScreen
        nameInput={nameInput}
        setNameInput={setNameInput}
        setName={setName}
        maxTries={maxTries}
        setMaxTries={setMaxTries}
        players={players}
      />
    );
  }

  return (
    <GameScreen
      playerIndex={playerIndex}
      players={players}
      gameState={gameState}
      wordInput={wordInput}
      setWordInput={setWordInput}
      handleSubmit={handleSubmit}
      submitted={submitted}
      handleRestart={handleRestart}
      maxTries={maxTries}
    />
  );
}

export default App;
