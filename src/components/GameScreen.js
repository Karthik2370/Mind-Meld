import React, { useEffect } from 'react';
import './GameScreen.css';
import { io } from 'socket.io-client';
import html2canvas from 'html2canvas';

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

function VictoryModal({ word, onRestart, roundWords, players, guesses }) {
  // Find synergy percent for the two players
  const getSynergyKey = (a, b) => [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join('|');
  const you = players[0]?.name || '';
  const partner = players[1]?.name || '';
  let synergyPercent = null;
  try {
    const synergyArr = JSON.parse(localStorage.getItem('mindmeld_synergy') || '[]');
    const entry = synergyArr.find(e => getSynergyKey(e.names[0], e.names[1]) === getSynergyKey(you, partner));
    if (entry) synergyPercent = entry.percent;
  } catch {}
  // Roast message
  const roast = `It only took you ${guesses} guesses to finally sync your minds. Synergy level: ${synergyPercent !== null ? synergyPercent + '%' : '??%'} — Room for improvement! 😜`;

  // Download certificate as PNG (no preview, fixed width)
  const handleDownload = async () => {
    // Create hidden div
    const certDiv = document.createElement('div');
    certDiv.style.position = 'fixed';
    certDiv.style.left = '-9999px';
    certDiv.style.top = '0';
    certDiv.style.width = '900px';
    certDiv.style.background = '#fff';
    certDiv.style.padding = '40px 32px 32px 32px';
    certDiv.style.fontFamily = 'Segoe UI,Roboto,Arial,sans-serif';
    certDiv.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:38px;font-weight:900;color:#8e44ad;margin-bottom:18px;letter-spacing:2px;">Mind Meld Victory Certificate</div>
        <div style="font-size:28px;font-weight:700;color:#e67e22;margin-bottom:10px;">${players[0]?.name} &amp; ${players[1]?.name}</div>
        <div style="font-size:22px;color:#27ae60;font-weight:700;margin-bottom:16px;">Matched in <b>${guesses}</b> guesses</div>
        <div style="font-size:18px;color:#c0392b;font-weight:600;margin-bottom:24px;">${roast}</div>
        <table style="width:100%;border-collapse:collapse;margin:0 auto;font-size:18px;">
          <thead>
            <tr>
              <th style='background:#f3e6ff;color:#8e44ad;font-weight:900;padding:10px 12px;border:1px solid #e3e6f3;'>Round</th>
              <th style='background:#f3e6ff;color:#8e44ad;font-weight:900;padding:10px 12px;border:1px solid #e3e6f3;'>${players[0]?.name || 'Player 1'}</th>
              <th style='background:#f3e6ff;color:#8e44ad;font-weight:900;padding:10px 12px;border:1px solid #e3e6f3;'>${players[1]?.name || 'Player 2'}</th>
            </tr>
          </thead>
          <tbody>
            ${roundWords.map((words, i) => `
              <tr style='background:${i%2===0?'#f8f8fa':'#fff'};'>
                <td style='padding:10px 12px;border:1px solid #e3e6f3;'>${i+1}</td>
                <td style='padding:10px 12px;border:1px solid #e3e6f3;'>${words[0]}</td>
                <td style='padding:10px 12px;border:1px solid #e3e6f3;'>${words[1]}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.body.appendChild(certDiv);
    const canvas = await html2canvas(certDiv, { backgroundColor: '#fff', scale: 2, width: 900 });
    const link = document.createElement('a');
    link.download = `mindmeld-certificate.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    document.body.removeChild(certDiv);
  };

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
        <button className="victory-download-btn" onClick={handleDownload}>Download Certificate</button>
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
  const you = players[playerIndex]?.name || '';
  const partner = players[1 - playerIndex]?.name || '';
  // Find synergy entry for you and partner
  const getSynergyKey = (a, b) => [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join('|');
  const synergyEntry = synergyScoreboard.find(entry => getSynergyKey(entry.names[0], entry.names[1]) === getSynergyKey(you, partner));

  // Store synergy and high score in localStorage on victory
  useEffect(() => {
    if (gameState.win && you && partner && synergyEntry) {
      try {
        // Update synergy
        const key = getSynergyKey(you, partner);
        const prev = JSON.parse(localStorage.getItem('mindmeld_synergy') || '[]');
        const prevMap = Object.fromEntries(prev.map(e => [getSynergyKey(e.names[0], e.names[1]), e]));
        if (!prevMap[key] || synergyEntry.score < prevMap[key].score) {
          const updated = { ...synergyEntry };
          const newArr = prev.filter(e => getSynergyKey(e.names[0], e.names[1]) !== key).concat([updated]);
          localStorage.setItem('mindmeld_synergy', JSON.stringify(newArr));
        }
        // Update high score
        if (gameState.highScore && gameState.highScore !== '-' && (!localStorage.getItem('mindmeld_highscore') || Number(gameState.highScore) < Number(localStorage.getItem('mindmeld_highscore')))) {
          localStorage.setItem('mindmeld_highscore', String(gameState.highScore));
        }
      } catch {}
    }
  }, [gameState.win, you, partner, synergyEntry, gameState.highScore]);

  return (
    <div className="game-bg">
      <div className="game-main-layout">
        <div className="game-left">
          <div className="game-title-row">
            <h2 className="game-title">{GAME_NAME}</h2>
            <div className="high-score">🏆 All-Time Best: <b>{allTimeHigh === '-' ? '-' : `${allTimeHigh} guesses`}</b></div>
          </div>
          {synergyEntry && partner && (
            <div className="synergy-best-row" style={{marginBottom:12, color:'#27ae60', fontWeight:700}}>
              Best with <b>{partner}</b>: {synergyEntry.score} guesses, Synergy {synergyEntry.percent}%
            </div>
          )}
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
        <VictoryModal
          word={gameState.roundWords[gameState.roundWords.length-1]?.[0]}
          onRestart={handleRestart}
          roundWords={gameState.roundWords}
          players={players}
          guesses={gameState.roundWords.length}
        />
      )}
    </div>
  );
}

export default GameScreen; 