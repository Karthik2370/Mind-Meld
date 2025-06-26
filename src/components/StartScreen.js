import React from 'react';
import './StartScreen.css';

const AVATARS = [
  <svg width="56" height="56" viewBox="0 0 48 48" fill="none" key="avatar1">
    <circle cx="24" cy="24" r="22" fill="#8e44ad" stroke="#5e3370" strokeWidth="3" />
    <ellipse cx="24" cy="22" rx="10" ry="10" fill="#fff" />
    <ellipse cx="20" cy="21" rx="2.5" ry="3" fill="#8e44ad" />
    <ellipse cx="28" cy="21" rx="2.5" ry="3" fill="#8e44ad" />
    <ellipse cx="24" cy="27" rx="4" ry="2" fill="#8e44ad" />
  </svg>,
  <svg width="56" height="56" viewBox="0 0 48 48" fill="none" key="avatar2">
    <circle cx="24" cy="24" r="22" fill="#e67e22" stroke="#a8560e" strokeWidth="3" />
    <ellipse cx="24" cy="22" rx="10" ry="10" fill="#fff" />
    <ellipse cx="20" cy="21" rx="2.5" ry="3" fill="#e67e22" />
    <ellipse cx="28" cy="21" rx="2.5" ry="3" fill="#e67e22" />
    <ellipse cx="24" cy="27" rx="4" ry="2" fill="#e67e22" />
  </svg>
];

const GAME_NAME = "Mind Meld";
const GAME_DESC = "Try to say the same word as your partner! If you match, you win!";

function BouncingAvatars() {
  return (
    <div className="bouncing-avatars">
      <div className="bounce-avatar" style={{ animationDelay: '0s' }}>{AVATARS[0]}</div>
      <div className="bounce-avatar" style={{ animationDelay: '0.2s' }}>{AVATARS[1]}</div>
    </div>
  );
}

function StartScreen({ nameInput, setNameInput, setName, maxTries, setMaxTries, players }) {
  const waiting = players.length === 1;
  return (
    <div className="start-bg">
      <div className="start-content">
        <BouncingAvatars />
        <h1 className="game-title">{GAME_NAME}</h1>
        <div className="game-desc">{GAME_DESC}</div>
        <div className="tries-row">
          <label htmlFor="maxTries" className="tries-label">Max Tries:</label>
          <select
            id="maxTries"
            className="tries-select"
            value={maxTries}
            onChange={e => setMaxTries(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <input
          className="name-input"
          placeholder="Enter your name..."
          value={nameInput}
          maxLength={16}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) setName(nameInput.trim()); }}
          autoFocus
        />
        <button
          className="start-btn"
          disabled={!nameInput.trim()}
          onClick={() => setName(nameInput.trim())}
        >
          Start Game
        </button>
        {waiting && <div className="waiting-effect"><span className="dot-flashing"></span> Waiting for second player...</div>}
      </div>
      <footer className="start-footer">
        <div>© 2025 Karthik Nambiar</div>
        <div className="disclaimer">This game concept ('Mind Meld') is inspired by popular word association and mind-matching games. This is a personal, non-commercial project. All rights to original concepts belong to their respective creators.</div>
      </footer>
    </div>
  );
}

export default StartScreen; 