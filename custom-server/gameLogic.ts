import { Tile, GameState } from '../src/types/game';
import { getBonus, BonusType } from '../src/utils/board';

import * as fs from 'fs';
import * as path from 'path';

let DICTIONARY = new Set<string>();

// Load the Scrabble dictionary (TWL)
try {
  const dictPath = path.join(process.cwd(), 'data', 'dictionary.json');
  if (fs.existsSync(dictPath)) {
    const data = fs.readFileSync(dictPath, 'utf8');
    const wordList = JSON.parse(data);
    // If it's an array or object of keys
    if (Array.isArray(wordList)) {
      wordList.forEach(w => DICTIONARY.add(w.toUpperCase()));
    } else {
      Object.keys(wordList).forEach(w => DICTIONARY.add(w.toUpperCase()));
    }
    console.log(`Loaded ${DICTIONARY.size} words from Scrabble dictionary (TWL)`);
  } else {
    throw new Error('dictionary.json not found');
  }
} catch (err) {
  console.error('Failed to load Scrabble dictionary, falling back to basic set:', err);
  ['HELLO', 'WORLD', 'SCRABBLE', 'PAGED', 'HI', 'HE', 'IS', 'AT'].forEach(w => DICTIONARY.add(w));
}

export interface PlacedTile {
  row: number;
  col: number;
  tile: Tile;
}

export function findWords(board: (Tile | null)[][], newTiles: PlacedTile[]): string[] {
  if (newTiles.length === 0) return [];

  const words = new Set<string>();

  for (const { row, col, tile } of newTiles) {
    console.log(`Checking tile: ${tile.letter} (represented as ${tile.representedLetter || tile.letter}) at ${row},${col}`);
    
    // Check horizontal word
    const horizontalWord = getFullWord(board, row, col, 'horizontal');
    if (horizontalWord.length > 1) {
      words.add(horizontalWord);
    }
    
    // Check vertical word
    const verticalWord = getFullWord(board, row, col, 'vertical');
    if (verticalWord.length > 1) {
      words.add(verticalWord);
    }
  }

  const finalWords = Array.from(words);
  console.log(`Final identified words for turn:`, finalWords);
  return finalWords;
}

function getFullWord(board: (Tile | null)[][], row: number, col: number, direction: 'horizontal' | 'vertical'): string {
  let word = '';
  let r = row;
  let c = col;

  if (direction === 'horizontal') {
    while (c > 0 && board[r][c - 1]) c--;
    while (c < board[0].length && board[r][c]) {
      word += board[r][c]!.representedLetter || board[r][c]!.letter;
      c++;
    }
  } else {
    while (r > 0 && board[r - 1][c]) r--;
    while (r < board.length && board[r][c]) {
      word += board[r][c]!.representedLetter || board[r][c]!.letter;
      r++;
    }
  }

  return word;
}

export function validateWords(words: string[]): { valid: boolean; invalidWords: string[] } {
  const invalidWords = words.filter(word => !DICTIONARY.has(word.toUpperCase()));
  return {
    valid: invalidWords.length === 0,
    invalidWords
  };
}

export function calculateScore(board: (Tile | null)[][], newTiles: PlacedTile[]): number {
  if (newTiles.length === 0) return 0;

  let totalScore = 0;
  const horizontalWords = new Set<string>();
  const verticalWords = new Set<string>();

  const scoreWord = (row: number, col: number, direction: 'horizontal' | 'vertical') => {
    let wordScore = 0;
    let wordMultiplier = 1;
    let r = row;
    let c = col;

    if (direction === 'horizontal') {
      while (c > 0 && board[r][c - 1]) c--;
    } else {
      while (r > 0 && board[r - 1][c]) r--;
    }

    const startPos = `${r},${c}`;
    if (direction === 'horizontal') {
      if (horizontalWords.has(startPos)) return 0;
      horizontalWords.add(startPos);
    } else {
      if (verticalWords.has(startPos)) return 0;
      verticalWords.add(startPos);
    }

    let length = 0;
    let tempR = r;
    let tempC = c;
    while (tempR < board.length && tempC < board[0].length && board[tempR][tempC]) {
      const tile = board[tempR][tempC]!;
      let tileValue = tile.value;
      
      const isNew = newTiles.some(nt => nt.row === tempR && nt.col === tempC);
      if (isNew) {
        const bonus = getBonus(tempR, tempC);
        if (bonus === 'DL') tileValue *= 2;
        else if (bonus === 'TL') tileValue *= 3;
        else if (bonus === 'DW') wordMultiplier *= 2;
        else if (bonus === 'TW') wordMultiplier *= 3;
      }
      
      wordScore += tileValue;
      length++;
      if (direction === 'horizontal') tempC++; else tempR++;
    }

    return length > 1 ? wordScore * wordMultiplier : 0;
  };

  for (const { row, col } of newTiles) {
    totalScore += scoreWord(row, col, 'horizontal');
    totalScore += scoreWord(row, col, 'vertical');
  }

  return totalScore;
}
