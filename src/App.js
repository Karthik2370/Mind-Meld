import React, { useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import { io } from 'socket.io-client';

const SERVER_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : window.location.origin);

function App() {
  const [playerIndex, setPlayerIndex] = useState(null);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [gameState, setGameState] = useState({ roundWords: [], highScore: 0, gameActive: false, round: 1, win: false, waiting: false });
  const [submitted, setSubmitted] = useState(false);
  const [maxTries, setMaxTries] = useState(15);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!name) return;
    const s = io(SERVER_URL);
    setSocket(s);
    s.on('player_index', (idx) => setPlayerIndex(idx));
    s.on('players_update', (list) => setPlayers(list));
    s.on('game_state', (state) => {
      setGameState(state);
      setSubmitted(false);
      setWordInput('');
    });
    s.on('full', () => {
      alert('Room is full!');
    });
    s.emit('set_name', { name, maxTries });
    return () => s.disconnect();
  }, [name, maxTries]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!wordInput.trim() || !gameState.gameActive || submitted) return;
    if (socket) socket.emit('submit_word', wordInput.trim());
    setSubmitted(true);
  }

  function handleRestart() {
    if (socket) socket.emit('restart');
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
        waiting={gameState.waiting}
      />
    );
  }

  if (gameState.waiting) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'#f3e6ff'}}>
        <h2 style={{color:'#8e44ad',fontWeight:900,marginBottom:16}}>Waiting for Player 2...</h2>
        <div className="dot-flashing" style={{margin:'0 auto'}}></div>
      </div>
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
