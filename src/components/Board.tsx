import React from 'react';
import { Tile as TileType } from '../types/game';
import { getBonus } from '../utils/board';
import Tile from './Tile';

interface BoardProps {
  board: (TileType | null)[][];
  onCellClick: (row: number, col: number) => void;
  selectedCell?: { row: number, col: number } | null;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, selectedCell }) => {
  return (
    <div className="board-container">
      <div className="board">
        {board.map((row, rIdx) => (
          <div key={rIdx} className="board-row">
            {row.map((cell, cIdx) => {
              const bonus = getBonus(rIdx, cIdx);
              const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
              
              return (
                <div 
                  key={`${rIdx}-${cIdx}`} 
                  className={`cell ${bonus || ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => onCellClick(rIdx, cIdx)}
                >
                  {cell ? (
                    <Tile letter={cell.letter} value={cell.value} representedLetter={cell.representedLetter} />
                  ) : (
                    <span className="bonus-label">{bonus}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <style jsx>{`
        .board-container {
          background-color: #073642;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .board {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .board-row {
          display: flex;
          gap: 2px;
        }
        .cell {
          width: 44px;
          height: 44px;
          background-color: #eee8d5;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          cursor: pointer;
        }
        .cell:hover {
          filter: brightness(1.1);
        }
        .selected {
           box-shadow: inset 0 0 10px var(--primary);
        }
        .bonus-label {
          font-size: 10px;
          font-weight: bold;
          color: rgba(7, 54, 66, 0.4);
        }
        .TW { background-color: #dc322f; color: white; }
        .DW { background-color: #d33682; color: white; }
        .TL { background-color: #268bd2; color: white; }
        .DL { background-color: #2aa198; color: white; }
        .TW .bonus-label, .DW .bonus-label, .TL .bonus-label, .DL .bonus-label {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Board;
