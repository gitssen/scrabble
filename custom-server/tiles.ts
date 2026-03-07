import { Tile } from '../src/types/game';

export const TILE_DISTRIBUTION: Record<string, { count: number, value: number }> = {
  'A': { count: 9, value: 1 },
  'B': { count: 2, value: 3 },
  'C': { count: 2, value: 3 },
  'D': { count: 4, value: 2 },
  'E': { count: 12, value: 1 },
  'F': { count: 2, value: 4 },
  'G': { count: 3, value: 2 },
  'H': { count: 2, value: 4 },
  'I': { count: 9, value: 1 },
  'J': { count: 1, value: 8 },
  'K': { count: 1, value: 5 },
  'L': { count: 4, value: 1 },
  'M': { count: 2, value: 3 },
  'N': { count: 6, value: 1 },
  'O': { count: 8, value: 1 },
  'P': { count: 2, value: 3 },
  'Q': { count: 1, value: 10 },
  'R': { count: 6, value: 1 },
  'S': { count: 4, value: 1 },
  'T': { count: 6, value: 1 },
  'U': { count: 4, value: 1 },
  'V': { count: 2, value: 4 },
  'W': { count: 2, value: 4 },
  'X': { count: 1, value: 8 },
  'Y': { count: 2, value: 4 },
  'Z': { count: 1, value: 10 },
  '_': { count: 2, value: 0 }, // Blank tiles
};

export function createTileBag(): Tile[] {
  const bag: Tile[] = [];
  for (const [letter, info] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < info.count; i++) {
      bag.push({ letter, value: info.value });
    }
  }
  return shuffle(bag);
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
