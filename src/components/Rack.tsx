import React from 'react';
import { Tile as TileType } from '../types/game';
import Tile from './Tile';

interface RackProps {
  rack: TileType[];
  onTileClick: (index: number) => void;
  selectedTileIndex?: number | null;
}

const Rack: React.FC<RackProps> = ({ rack, onTileClick, selectedTileIndex }) => {
  return (
    <div className="rack-container">
      <h3>Your Tiles</h3>
      <div className="rack">
        {rack.map((tile, idx) => (
          <Tile 
            key={idx} 
            letter={tile.letter} 
            value={tile.value} 
            onClick={() => onTileClick(idx)}
            isSelected={selectedTileIndex === idx}
          />
        ))}
        {rack.length === 0 && <p>No tiles yet</p>}
      </div>
      <style jsx>{`
        .rack-container {
          margin-top: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
        }
        .rack {
          display: flex;
          gap: 10px;
          justify-content: center;
          padding: 10px;
          min-height: 60px;
        }
      `}</style>
    </div>
  );
};

export default Rack;
