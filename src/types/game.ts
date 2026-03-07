export type Role = 'player' | 'spectator';

export interface Player {
  id: string;
  username: string;
  role: Role;
  score: number;
  rack: Tile[];
  online: boolean;
}

export interface Tile {
  letter: string;
  value: number;
  representedLetter?: string; // For blank tiles
}

export interface GameState {
  players: Player[];
  spectators: string[];
  gameStarted: boolean;
  isGameOver: boolean;
  winner: string | null;
  currentPlayerIndex: number;
  board: (Tile | null)[][];
  remainingTiles: number;
}
