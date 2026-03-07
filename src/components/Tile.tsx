import React from 'react';

interface TileProps {
  letter: string;
  value: number;
  representedLetter?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const Tile: React.FC<TileProps> = ({ letter, value, representedLetter, onClick, isSelected }) => {
  return (
    <div 
      className={`tile ${isSelected ? 'selected' : ''} ${letter === '_' ? 'blank' : ''}`} 
      onClick={onClick}
    >
      <span className="letter">{representedLetter || (letter === '_' ? '' : letter)}</span>
      <span className="value">{value}</span>
      <style jsx>{`
        .tile {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #ffffff 0%, var(--tile-bg) 100%);
          color: var(--tile-text);
          border: 1px solid var(--tile-border);
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          position: relative;
          cursor: pointer;
          user-select: none;
          box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .selected {
          border: 2px solid var(--primary);
          box-shadow: 0 0 5px var(--primary);
        }
        .blank .letter {
          color: #268bd2;
          font-style: italic;
        }
        .letter {
          font-size: 20px;
        }
        .value {
          font-size: 10px;
          position: absolute;
          bottom: 2px;
          right: 2px;
        }
      `}</style>
    </div>
  );
};

export default Tile;
