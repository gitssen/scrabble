'use client';

import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { MAX_PLAYERS } from '@/constants/game';
import Board from '@/components/Board';
import Rack from '@/components/Rack';
import Chat from '@/components/Chat';

export default function Home() {
  const [username, setUsername] = useState('');
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const { gameState, role, isConnected, joinGame, startGame, placeTile, endTurn, revertTurn, resetGame, leaveGame, sendMessage, socket } = useGame();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      joinGame(username.trim());
    }
  };

  const handleEndGame = () => {
    if (confirm('Leave this game? (This will take you back to the connection page)')) {
      leaveGame();
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
            <button onClick={leaveGame}>Back to Connection Page</button>
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
    const isHost = gameState.players[0]?.id === socket?.id;

    return (
      <main>
        <div className="game-layout">
          {/* Left Panel: Status & Scores */}
          <div className="status-panel">
            <div className="game-info">
              <h1>Scrabble</h1>
              <div className="scoreboard">
                {gameState.players.map((p, idx) => (
                  <div key={p.id} className={`player-score ${idx === gameState.currentPlayerIndex ? 'active' : ''}`}>
                    <span className={`status-dot ${p.online ? 'online' : 'offline'}`}></span>
                    {p.username}: {p.score}
                  </div>
                ))}
              </div>
              <div className="game-stats">
                <p>Tiles left: {gameState.remainingTiles}</p>
                <h2 className={isMyTurn ? 'my-turn' : ''}>
                  {isMyTurn ? "Your Turn!" : `Waiting for ${currentPlayer?.username}`}
                </h2>
              </div>
              
              <div className="host-controls">
                {isHost && (
                  <button onClick={resetGame} className="end-game-button">End Game for All</button>
                )}
                <button onClick={handleEndGame} className="leave-button">Leave Game</button>
              </div>
            </div>
          </div>

          {/* Center Panel: Board & Player Controls */}
          <div className="board-area">
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
          </div>

          {/* Right Panel: Chat */}
          <div className="chat-panel">
            <Chat 
              messages={gameState.messages} 
              onSendMessage={sendMessage} 
              currentUser={username || 'Spectator'} 
            />
          </div>
        </div>

        {role === 'spectator' && (
          <div className="spectator-msg">
            <p>You are watching as a spectator.</p>
          </div>
        )}

        <style jsx>{`
          .game-layout {
            display: flex;
            gap: 30px;
            justify-content: center;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            align-items: flex-start;
          }
          .status-panel {
            width: 250px;
            background: #eee8d5;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .board-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
          }
          .chat-panel {
            width: 300px;
          }
          .game-info h1 {
            margin: 0 0 20px 0;
            font-size: 1.8rem;
            text-align: center;
            color: #586e75;
          }
          .scoreboard {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
          }
          .player-score {
            padding: 10px;
            border-radius: 4px;
            background: #fdf6e3;
            display: flex;
            align-items: center;
            border: 1px solid #dcd7c0;
          }
          .player-score.active {
            background: var(--primary);
            color: white;
            font-weight: bold;
            border-color: var(--primary);
          }
          .game-stats {
            text-align: center;
            padding: 15px 0;
            border-top: 1px solid #dcd7c0;
            border-bottom: 1px solid #dcd7c0;
            margin-bottom: 20px;
          }
          .game-stats p {
            margin: 0;
            font-size: 0.9rem;
          }
          .game-stats h2 {
            margin: 10px 0 0 0;
            font-size: 1.1rem;
          }
          .host-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
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
            margin-top: 20px;
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
          .end-game-button {
            background-color: #cb4b16;
            color: white;
            padding: 8px;
            font-size: 0.85rem;
            border-radius: 4px;
            border: none;
            cursor: pointer;
          }
          .leave-button {
            background-color: #dc322f;
            color: white;
            padding: 8px;
            font-size: 0.85rem;
            border-radius: 4px;
            border: none;
            cursor: pointer;
          }
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 10px;
          }
          .online { background-color: #859900; }
          .offline { background-color: #dc322f; }
        `}</style>
      </main>
    );
  }

  const isHost = gameState.players[0]?.id === socket?.id;

  return (
    <main className="lobby-layout">
      <div className="lobby">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>Lobby</h1>
          <button onClick={handleEndGame} className="leave-button">Leave Lobby</button>
        </div>
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

      <div className="side-panel">
        <Chat 
          messages={gameState.messages} 
          onSendMessage={sendMessage} 
          currentUser={username || 'Spectator'} 
        />
      </div>
    </main>
  );
}
