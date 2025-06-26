import React, { useEffect } from 'react';
import './GameScreen.css';
import { io } from 'socket.io-client';

const AVATARS = [
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" key="avatar1">
    <circle cx="24" cy="24" r="22" fill="#8e44ad" stroke="#5e3370" strokeWidth="3" />
    <ellipse cx="24" cy="22" rx="10" ry="10" fill="#fff" />
    <ellipse cx="20" cy="21" rx="2.5" ry="3" fill="#8e44ad" />
    <ellipse cx="28" cy="21" rx="2.5" ry="3" fill="#8e44ad" />
    <ellipse cx="24" cy="27" rx="4" ry="2" fill="#8e44ad" />
  </svg>,
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" key="avatar2">
    <circle cx="24" cy="24" r="22" fill="#e67e22" stroke="#a8560e" strokeWidth="3" />
    <ellipse cx="24" cy="22" rx="10" ry="10" fill="#fff" />
    <ellipse cx="20" cy="21" rx="2.5" ry="3" fill="#e67e22" />
    <ellipse cx="28" cy="21" rx="2.5" ry="3" fill="#e67e22" />
    <ellipse cx="24" cy="27" rx="4" ry="2" fill="#e67e22" />
  </svg>
];

const GAME_NAME = "Mind Meld";

const backendUrl = process.env.REACT_APP_BACKEND_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

const socket = io(backendUrl);

function VictoryModal({ word, onRestart }) {
  return (
    <div className="victory-modal-overlay">
      <div className="victory-modal-card">
        <div className="confetti-svg">
          <svg width="120" height="60" viewBox="0 0 120 60">
            <circle cx="20" cy="20" r="6" fill="#8e44ad"/>
            <circle cx="60" cy="10" r="5" fill="#e67e22"/>
            <circle cx="100" cy="25" r="7" fill="#27ae60"/>
            <circle cx="40" cy="50" r="4" fill="#e67e22"/>
            <circle cx="80" cy="40" r="5" fill="#8e44ad"/>
          </svg>
        </div>
        <div className="victory-title">🎉 You Win!</div>
        <div className="victory-word">You both said <b>"{word}"</b></div>
        <button className="victory-restart-btn" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

function GameScreen({ playerIndex, players, gameState, wordInput, setWordInput, handleSubmit, submitted, handleRestart, maxTries }) {
  // Local high score logic
  useEffect(() => {
    const localHigh = Number(localStorage.getItem('mindmeld_highscore') || 0);
    if (gameState.highScore > localHigh) {
      localStorage.setItem('mindmeld_highscore', gameState.highScore);
    }
  }, [gameState.highScore]);

  useEffect(() => {
    // On mount, update high score from localStorage if higher
    const localHigh = Number(localStorage.getItem('mindmeld_highscore') || 0);
    if (localHigh > gameState.highScore) {
      // This is only for display, server is source of truth for game logic
      gameState.highScore = localHigh;
    }
    // eslint-disable-next-line
  }, []);

  const isGameOver = !gameState.gameActive && !gameState.win;
  const isVictory = !!gameState.win;
  const overTries = gameState.round > maxTries;
  const allTimeHigh = gameState.highScore || '-';
  const synergyScoreboard = gameState.synergyScoreboard || [];
  return (
    <div className="game-bg">
      <div className="game-main-layout">
        <div className="game-left">
          <div className="game-title-row">
            <h2 className="game-title">{GAME_NAME}</h2>
            <div className="high-score">🏆 All-Time Best: <b>{allTimeHigh === '-' ? '-' : `${allTimeHigh} guesses`}</b></div>
          </div>
          <div className="round-history-label">Round History</div>
          <div className="round-history-table-wrap">
            <table className="round-history-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>{players[0]?.name || 'Player 1'}</th>
                  <th>{players[1]?.name || 'Player 2'}</th>
                </tr>
              </thead>
              <tbody>
                {gameState.roundWords.map((words, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
                    <td>{i + 1}</td>
                    <td>{words[0]}</td>
                    <td>{words[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="synergy-scoreboard-label" style={{marginTop:24, fontWeight:700, color:'#8e44ad', fontSize:18}}>Synergy Scoreboard</div>
          <div className="synergy-scoreboard-table-wrap">
            <table className="synergy-scoreboard-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Best Score</th>
                  <th>Synergy %</th>
                </tr>
              </thead>
              <tbody>
                {synergyScoreboard.length === 0 ? (
                  <tr><td colSpan={3} style={{color:'#aaa'}}>No synergy data yet</td></tr>
                ) : (
                  synergyScoreboard.map((entry, i) => {
                    // Show the partner's name (not you)
                    const partner = entry.names.find(n => n.toLowerCase() !== (players[playerIndex]?.name || '').toLowerCase()) || entry.names[0];
                    return (
                      <tr key={i}>
                        <td>{partner}</td>
                        <td>{entry.score} guesses</td>
                        <td>{entry.percent}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="game-right">
          <div className="players-row">
            {[0,1].map(i => (
              <div key={i} className={`player-card ${playerIndex === i ? 'you' : ''}`}>
                <div className="avatar-wrap">{AVATARS[i]}</div>
                <span className="player-name">{players[i]?.name || (i === 0 ? 'Player 1' : 'Player 2')}</span>
                {playerIndex === i && <span className="you-badge">You</span>}
              </div>
            ))}
          </div>
          <div className="round-label">Round {gameState.round} / {maxTries}</div>
          {gameState.gameActive && !overTries ? (
            <form className="word-form" onSubmit={handleSubmit}>
              <input
                className="word-input"
                placeholder="Type your word..."
                value={wordInput}
                maxLength={32}
                onChange={e => setWordInput(e.target.value)}
                disabled={submitted}
                autoFocus
              />
              <button
                className="submit-btn"
                disabled={submitted || !wordInput.trim()}
                type="submit"
              >
                Submit
              </button>
              {submitted && <div className="waiting-msg">Waiting for other player...</div>}
            </form>
          ) : (
            <div className="game-over-wrap">
              {isVictory ? null : (
                <div className="lose-msg">{overTries ? 'Out of tries! Game Over' : 'Game Over'}</div>
              )}
              {!isVictory && <button className="restart-btn" onClick={handleRestart}>Play Again</button>}
            </div>
          )}
        </div>
      </div>
      {isVictory && (
        <VictoryModal word={gameState.roundWords[gameState.roundWords.length-1]?.[0]} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default GameScreen; 