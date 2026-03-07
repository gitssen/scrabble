import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Role } from '../types/game';

export function useGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Force websocket transport to avoid XHR polling/post errors
    const socket = io({
      transports: ['websocket'],
      upgrade: false,
      reconnectionAttempts: 5,
      timeout: 10000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server via:', socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on('error', (err) => {
      console.error('General socket error:', err);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
    });

    socket.on('joined', ({ role, gameState }: { role: Role, gameState: GameState }) => {
      console.log('Joined event received:', role);
      setRole(role);
      setGameState(gameState);
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      setGameState(newGameState);
    });

    socket.on('gameStarted', (newGameState: GameState) => {
      setGameState(newGameState);
    });

    socket.on('invalidMove', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = (username: string) => {
    socketRef.current?.emit('join', username);
  };

  const startGame = () => {
    socketRef.current?.emit('startGame');
  };

  const placeTile = (row: number, col: number, tileIndex: number, representedLetter?: string) => {
    socketRef.current?.emit('placeTile', { row, col, tileIndex, representedLetter });
  };

  const endTurn = () => {
    socketRef.current?.emit('endTurn');
  };

  const revertTurn = () => {
    socketRef.current?.emit('revertTurn');
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game for everyone?')) {
      socketRef.current?.emit('resetGame');
    }
  };

  return {
    gameState,
    role,
    isConnected,
    joinGame,
    startGame,
    placeTile,
    endTurn,
    revertTurn,
    resetGame,
    socket: socketRef.current
  };
}
