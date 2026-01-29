import React, { useState, useEffect } from 'react';
import { HistoricalEvent, GameConfig } from '../types';
import { CheckCircle, XCircle, Link2, Crown, Clock } from 'lucide-react';

interface MatchGameProps {
  data: HistoricalEvent[];
  config: GameConfig;
  onFinish: (score: number, maxScore: number) => void;
}

const MatchGame: React.FC<MatchGameProps> = ({ data, config, onFinish }) => {
  const [leftItems, setLeftItems] = useState<{ id: string; text: string }[]>([]);
  const [rightItems, setRightItems] = useState<{ id: string; text: string }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const gameItems = data.slice(0, config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 8 : 10);

    const left = gameItems.map(i => ({ id: i.id, text: i.name }));
    const right = gameItems.map(i => ({ id: i.id, text: `${i.year} - ${i.description.substring(0, 30)}...` }));

    setLeftItems(left.sort(() => Math.random() - 0.5));
    setRightItems(right.sort(() => Math.random() - 0.5));
  }, [data, config.difficulty]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish(score, leftItems.length * 10);
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, leftItems.length, onFinish, score]);

  useEffect(() => {
    if (matched.size > 0 && matched.size === leftItems.length) {
      onFinish(score, leftItems.length * 10);
    }
  }, [matched, leftItems.length, onFinish, score]);

  const handleLeftClick = (id: string) => {
    if (matched.has(id)) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: string) => {
    if (matched.has(id)) return;
    if (selectedLeft) {
      if (selectedLeft === id) {
        setMatched(prev => new Set(prev).add(id));
        setScore(prev => prev + 10);
        setSelectedLeft(null);
        if (config.soundEnabled) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
          audio.play().catch(() => { });
        }
      } else {
        setScore(prev => Math.max(0, prev - 2));
        setSelectedLeft(null);
        if (config.soundEnabled) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
          audio.play().catch(() => { });
        }
      }
    }
  };

  const progressPercent = (matched.size / leftItems.length) * 100;

  return (
    <div className="w-full h-full flex flex-col" style={{ fontFamily: "'Lora', Georgia, serif" }}>
      {/* Header Stats */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="score-display">
          <div className="coin-icon">
            <Crown className="w-3 h-3" />
          </div>
          <span className="text-lg">{score}</span>
        </div>

        {/* Progress */}
        <div className="flex-1 mx-6">
          <div className="h-3 bg-[#2A2318] rounded-full border border-[#3D3428] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4E5B1] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-center text-[#6B5C45] text-xs mt-1">{matched.size}/{leftItems.length} đã nối</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 10
            ? 'bg-[#722F37]/20 border-[#722F37] text-[#E8A9A9] animate-pulse'
            : 'bg-[#2A2318] border-[#3D3428] text-[#D4AF37]'
          }`}>
          <Clock className="w-4 h-4" />
          <span className="font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 grid grid-cols-2 gap-6 overflow-y-auto px-2 pb-4">
        {/* Left Column - Events */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[#D4AF37] text-sm uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Sự kiện
          </h3>
          {leftItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleLeftClick(item.id)}
              disabled={matched.has(item.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 border-2 relative overflow-hidden group
                ${matched.has(item.id)
                  ? 'bg-[#2E8B57]/20 border-[#2E8B57] text-[#5FD89E]'
                  : selectedLeft === item.id
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F4E5B1] scale-[1.02] shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-[#2A2318] border-[#3D3428] text-[#F5F0E1] hover:bg-[#3D3428] hover:border-[#6B5C45]'
                }`}
            >
              {/* Gold shine effect when selected */}
              {selectedLeft === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent animate-shimmer" />
              )}
              <div className="flex items-center justify-between relative z-10">
                <span style={{ fontFamily: "'Playfair Display', serif" }}>{item.text}</span>
                {matched.has(item.id) && <CheckCircle className="w-5 h-5 text-[#5FD89E]" />}
              </div>
            </button>
          ))}
        </div>

        {/* Right Column - Years/Descriptions */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[#8B7355] text-sm uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Năm / Mô tả
          </h3>
          {rightItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleRightClick(item.id)}
              disabled={matched.has(item.id)}
              className={`p-4 rounded-xl text-left transition-all duration-300 border-2
                ${matched.has(item.id)
                  ? 'bg-[#2E8B57]/20 border-[#2E8B57] text-[#5FD89E]'
                  : 'bg-[#2A2318] border-[#3D3428] text-[#F5F0E1] hover:bg-[#3D3428] hover:border-[#6B5C45]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span>{item.text}</span>
                {matched.has(item.id) && <CheckCircle className="w-5 h-5 text-[#5FD89E]" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchGame;