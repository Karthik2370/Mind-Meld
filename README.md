# 🧠 Mind Meld - Real-Time Two-Player Word Match Game

[Play Mind Meld (Frontend on Vercel)](https://mind-meld-game.vercel.app/)  
[Backend API (Render)](https://mind-meld-5sf7.onrender.com)

---

## Overview

**Mind Meld** is a fast, fun, and social two-player word-matching game.  
Try to think alike: each round, both players type a word—if you match, you win!  
Track your all-time best, see your Synergy Scoreboard with every partner, and challenge your friends to see who’s most in sync.

---

## Tech Stack

- **Frontend:** [React](https://react.dev/) (Vercel hosted)
- **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + [Socket.IO](https://socket.io/) (Render hosted)
- **Real-time Communication:** Socket.IO
- **Styling:** CSS Modules
- **Certificate Generation:** [html2canvas](https://www.npmjs.com/package/html2canvas)
- **Persistence:** LocalStorage (for synergy and high score)
- **Deployment:** [Vercel](https://vercel.com/) (frontend), [Render](https://render.com/) (backend)

---

## Features

- ⚡ Real-time multiplayer (Socket.IO)
- 🎨 Modern, responsive, and mobile-friendly UI
- 🏆 All-time best (shortest win) tracking
- 🤝 Synergy Scoreboard: see your best score and synergy percent with every partner (persists across sessions)
- 📝 Round history and high score persistence
- 📱 Seamless experience on desktop and mobile
- 🧠 Name autofill: remembers your name for next time
- 🥇 Downloadable, roast-filled victory certificate as a PNG (with round history table and your names)
- 🚨 Room full alert shows the names of the players currently playing

---

## How to Play

1. Open [Mind Meld](https://mind-meld-game.vercel.app/) in two devices or browser tabs.
2. Each player enters their name (autofilled if you’ve played before) and selects max tries.
3. Each round, both players type a word and submit.
4. If you both say the same word, you win!
5. Your best (lowest) number of guesses is tracked as your all-time high score.
6. The Synergy Scoreboard (on the Start Screen) shows your best result and synergy percent with every partner.
7. After a win, download a stylish, roast-filled certificate PNG to show off your victory!

---

## Attribution & Disclaimer

> This game concept (“Mind Meld”) is inspired by popular word association and mind-matching games.  
> This is a personal, non-commercial project by Karthik Nambiar.  
> All rights to original concepts belong to their respective creators.

---

**Enjoy playing and building your synergy! 🧠✨**
