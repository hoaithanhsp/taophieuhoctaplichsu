import React, { useState, useEffect } from 'react';
import { ParsedData, GameConfig } from '../types';
import { Crown, Puzzle, Move } from 'lucide-react';

interface PuzzleGameProps {
  data: ParsedData;
  config: GameConfig;
  onFinish: (score: number, maxScore: number) => void;
}

const PuzzleGame: React.FC<PuzzleGameProps> = ({ data, config, onFinish }) => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState(0);
  const [gridSize] = useState(3); // Luôn dùng 3x3 = 9 ô
  const [isSolved, setIsSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [noImage, setNoImage] = useState(false);

  useEffect(() => {
    const size = 3; // Luôn dùng 3x3 = 9 ô
    const totalTiles = size * size;

    // Chỉ sử dụng ảnh từ puzzleImageUrl đã upload
    const img = data.puzzleImageUrl;
    if (!img) {
      setNoImage(true);
      return;
    }
    setNoImage(false);
    setImageUrl(img);

    let initial = Array.from({ length: totalTiles }, (_, i) => i);
    let emptyIdx = totalTiles - 1;

    const shuffleCount = 100;
    for (let i = 0; i < shuffleCount; i++) {
      const neighbors = getNeighbors(emptyIdx, size);
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      [initial[emptyIdx], initial[randomNeighbor]] = [initial[randomNeighbor], initial[emptyIdx]];
      emptyIdx = randomNeighbor;
    }

    setTiles(initial);
    setEmptyIndex(emptyIdx);
  }, [data, config]);

  const getNeighbors = (idx: number, size: number) => {
    const neighbors = [];
    const row = Math.floor(idx / size);
    const col = idx % size;

    if (row > 0) neighbors.push(idx - size);
    if (row < size - 1) neighbors.push(idx + size);
    if (col > 0) neighbors.push(idx - 1);
    if (col < size - 1) neighbors.push(idx + 1);

    return neighbors;
  };

  const moveTile = (index: number) => {
    if (isSolved) return;
    const neighbors = getNeighbors(emptyIndex, gridSize);
    if (neighbors.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setEmptyIndex(index);
      setMoves(m => m + 1);
      checkSolved(newTiles);
    }
  };

  const checkSolved = (currentTiles: number[]) => {
    const solved = currentTiles.every((val, idx) => val === idx);
    if (solved) {
      setIsSolved(true);
      setTimeout(() => {
        onFinish(Math.max(0, 100 - moves), 100);
      }, 1500);
    }
  };

  // Hiển thị thông báo nếu không có ảnh
  if (noImage) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-4"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        <div className="glass-card p-8 rounded-2xl text-center max-w-md">
          <Puzzle className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
          <h2
            className="text-2xl font-bold text-[#D4AF37] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Chưa có ảnh cho game
          </h2>
          <p className="text-[#8B7355] mb-4">
            Vui lòng tải lên ảnh cho Game Ghép Hình tại màn hình chính trước khi chơi.
          </p>
          <p className="text-[#6B5C45] text-sm">
            Bấm nút quay lại và tải ảnh ở mục "Ảnh cho Game Ghép Hình"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-4"
      style={{ fontFamily: "'Lora', Georgia, serif" }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h2
          className="text-2xl font-bold text-[#D4AF37] mb-2 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <Puzzle className="w-6 h-6" />
          Ghép Hình Lịch Sử
        </h2>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#2A2318] border border-[#3D3428] rounded-full">
            <Move className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#F5F0E1]">Bước đi: <span className="font-bold text-[#D4AF37]">{moves}</span></span>
          </div>
        </div>
      </div>

      {/* Puzzle Grid - Luôn 3x3 = 9 ô */}
      <div
        className="relative bg-[#2A2318] p-3 rounded-xl shadow-2xl border-2 border-[#D4AF37]/30"
        style={{
          width: 'min(85vw, 400px)',
          height: 'min(85vw, 400px)',
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: '3px'
        }}
      >
        {tiles.map((tileNumber, index) => {
          if (tileNumber === gridSize * gridSize - 1) {
            return (
              <div
                key="empty"
                className="bg-[#1A1510] rounded-lg border border-[#3D3428]"
              />
            );
          }

          const x = (tileNumber % gridSize) * 100 / (gridSize - 1);
          const y = Math.floor(tileNumber / gridSize) * 100 / (gridSize - 1);

          return (
            <div
              key={index}
              onClick={() => moveTile(index)}
              className={`cursor-pointer transition-all duration-150 rounded-lg border-2 hover:brightness-110 hover:scale-[1.02] active:scale-95
                      ${isSolved
                  ? 'border-[#D4AF37]/50'
                  : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                }`}
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${gridSize * 100}%`,
                backgroundPosition: `${x}% ${y}%`,
                filter: 'sepia(20%)'
              }}
            >
              {!isSolved && (
                <span
                  className="bg-[#1A1510]/80 text-[#D4AF37] text-xs px-2 py-0.5 rounded-br-lg font-bold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {tileNumber + 1}
                </span>
              )}
            </div>
          )
        })}

        {isSolved && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1510]/80 z-10 backdrop-blur-sm rounded-xl">
            <Crown className="w-16 h-16 text-[#D4AF37] mb-4 animate-bounce" />
            <h2
              className="text-3xl font-bold text-[#D4AF37]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              HOÀN THÀNH!
            </h2>
            <p className="text-[#8B7355] mt-2">Bạn đã ghép xong trong {moves} bước</p>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-[#6B5C45] text-sm mt-4 text-center italic">
        Click vào các ô cạnh ô trống để di chuyển
      </p>
    </div>
  );
};

export default PuzzleGame;