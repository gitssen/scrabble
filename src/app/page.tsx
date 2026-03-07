'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { MAX_PLAYERS } from '@/constants/game';
import Board from '@/components/Board';
import Rack from '@/components/Rack';

export default function Home() {
  const [username, setUsername] = useState('');
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const { gameState, role, isConnected, joinGame, startGame, placeTile, endTurn, revertTurn, resetGame, socket } = useGame();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      joinGame(username.trim());
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedTileIndex !== null && role === 'player') {
      const myPlayer = gameState.players.find(p => p.id === socket?.id);
      const selectedTile = myPlayer?.rack[selectedTileIndex];
      
      if (selectedTile?.letter === '_') {
        const letter = prompt('Which letter does this blank tile represent?');
        if (letter && letter.length === 1) {
          placeTile(row, col, selectedTileIndex, letter.toUpperCase());
        } else {
          alert('Please enter a single letter.');
        }
      } else {
        placeTile(row, col, selectedTileIndex);
      }
      setSelectedTileIndex(null);
    }
  };

  const handleTileClick = (index: number) => {
    setSelectedTileIndex(index === selectedTileIndex ? null : index);
  };

  if (!gameState) {
    return (
      <main>
        <div className="lobby">
          <h1>Scrabble Multiplayer</h1>
          <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit">Join Game</button>
          </form>
        </div>
      </main>
    );
  }

  if (gameState.gameStarted) {
    if (gameState.isGameOver) {
      return (
        <main>
          <div className="lobby">
            <h1>Game Over!</h1>
            <h2 className="winner-announcement">Winner: {gameState.winner}</h2>
            <div className="final-scoreboard">
              <h3>Final Scores</h3>
              <ul>
                {gameState.players.sort((a,b) => b.score - a.score).map((p) => (
                  <li key={p.id}>{p.username}: {p.score}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => window.location.reload()}>Back to Lobby</button>
          </div>
          <style jsx>{`
            .winner-announcement {
              color: var(--primary);
              font-size: 2rem;
              margin: 1rem 0;
            }
            .final-scoreboard {
              margin: 1rem 0;
              background: #eee8d5;
              padding: 1rem;
              border-radius: 8px;
            }
          `}</style>
        </main>
      );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const myPlayer = gameState.players.find(p => p.id === socket?.id);
    const isMyTurn = currentPlayer?.id === socket?.id;

    return (
      <main>
        <div className="game-info">
          <h1>Scrabble</h1>
          <div className="scoreboard">
            {gameState.players.map((p, idx) => (
              <div key={p.id} className={`player-score ${idx === gameState.currentPlayerIndex ? 'active' : ''}`}>
                {p.username}: {p.score}
              </div>
            ))}
          </div>
          <p>Tiles left in bag: {gameState.remainingTiles}</p>
          <h2 className={isMyTurn ? 'my-turn' : ''}>
            {isMyTurn ? "It's your turn!" : `Waiting for ${currentPlayer?.username}...`}
          </h2>
        </div>

        <Board 
          board={gameState.board} 
          onCellClick={handleCellClick} 
        />

        {myPlayer && (
          <div className="player-controls">
            <Rack 
              rack={myPlayer.rack} 
              onTileClick={handleTileClick} 
              selectedTileIndex={selectedTileIndex}
            />
            <div className="turn-actions">
              <button onClick={endTurn} disabled={!isMyTurn}>End Turn</button>
              <button onClick={revertTurn} disabled={!isMyTurn} className="secondary">Revert</button>
            </div>
          </div>
        )}

        {role === 'spectator' && (
          <div className="spectator-msg">
            <p>You are watching as a spectator.</p>
          </div>
        )}

        <style jsx>{`
          .game-info {
            text-align: center;
            margin-bottom: 1rem;
          }
          .scoreboard {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin: 10px 0;
          }
          .player-score {
            padding: 5px 10px;
            border-radius: 4px;
            background: #eee8d5;
          }
          .player-score.active {
            background: var(--primary);
            color: white;
            font-weight: bold;
          }
          .my-turn {
            color: var(--primary);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          .player-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
          .turn-actions {
            margin-top: 1rem;
            display: flex;
            gap: 10px;
          }
          .secondary {
            background-color: var(--secondary);
          }
          .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
          }
          .online { background-color: #859900; }
          .offline { background-color: #dc322f; }
        `}</style>
      </main>
    );
  }

  const isHost = gameState.players[0]?.id === socket?.id;

  return (
    <main>
      <div className="lobby">
        <h1>Lobby</h1>
        <p>Connected as: {username || 'Spectator'}</p>
        <p>Role: {role}</p>
        <div>
          <h3>Players ({gameState.players.length}/{MAX_PLAYERS})</h3>
          <ul>
            {gameState.players.map((p, idx) => (
              <li key={p.id}>
                <span className={`status-dot ${p.online ? 'online' : 'offline'}`}></span>
                {p.username} {idx === 0 ? '(Host)' : ''} {!p.online ? '(Away)' : ''}
              </li>
            ))}
          </ul>
        </div>
        
        {role === 'player' && isHost && (
          <div style={{ marginTop: '2rem' }}>
            {gameState.players.length >= 2 ? (
              <>
                <p>Minimum players reached!</p>
                <button onClick={startGame}>Start Game Now</button>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Or wait for more players (up to 4)</p>
              </>
            ) : (
              <p>Waiting for at least one more player to start...</p>
            )}
            <button onClick={resetGame} style={{ marginTop: '2rem', backgroundColor: '#dc322f' }}>
              Reset and Clear State
            </button>
          </div>
        )}

        {role === 'player' && !isHost && (
          <div style={{ marginTop: '2rem' }}>
            <p>Waiting for the host to start the game...</p>
          </div>
        )}

        {role === 'spectator' && (
          <p>Waiting for game to start...</p>
        )}
      </div>
    </main>
  );
}
