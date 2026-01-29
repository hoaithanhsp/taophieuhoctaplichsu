import React, { useState } from 'react';
import { CharacterInfo, GameConfig } from '../types';
import { HelpCircle, User, Crown, Scroll, Sparkles } from 'lucide-react';

interface CharacterGameProps {
  data: CharacterInfo[];
  config: GameConfig;
  onFinish: (score: number, maxScore: number) => void;
}

const CharacterGame: React.FC<CharacterGameProps> = ({ data, config, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [showInfo, setShowInfo] = useState(false);

  const currentCharacter = data[currentIndex];
  const maxHints = Math.min(4, currentCharacter.hints.length);

  const checkAnswer = () => {
    const normalizedInput = inputVal.toLowerCase().trim();
    const normalizedName = currentCharacter.name.toLowerCase().trim();

    if (normalizedInput && normalizedName.includes(normalizedInput)) {
      setFeedback('correct');
      const points = [40, 30, 20, 10];
      setScore(prev => prev + (points[hintLevel] || 10));
      setShowInfo(true);
      if (config.soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        audio.play().catch(() => { });
      }
    } else {
      setFeedback('incorrect');
      setInputVal('');
      if (config.soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
        audio.play().catch(() => { });
      }
    }
  };

  const nextCharacter = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setHintLevel(0);
      setShowInfo(false);
      setFeedback('none');
      setInputVal('');
    } else {
      onFinish(score, data.length * 40);
    }
  };

  const revealHint = () => {
    if (hintLevel < maxHints - 1) {
      setHintLevel(prev => prev + 1);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-4"
      style={{ fontFamily: "'Lora', Georgia, serif" }}
    >
      <div className="glass-card w-full max-w-lg p-6 rounded-2xl relative overflow-hidden">
        {/* Gold accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <span className="badge-historical flex items-center gap-1">
            <User className="w-3 h-3" />
            Nhân vật {currentIndex + 1}/{data.length}
          </span>
          <div className="score-display">
            <div className="coin-icon">
              <Crown className="w-3 h-3" />
            </div>
            <span>{score}</span>
          </div>
        </div>

        {/* Hints Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-[#8B7355] uppercase tracking-wider text-xs font-semibold flex items-center gap-2">
            <Scroll className="w-4 h-4 text-[#D4AF37]" />
            Gợi ý
          </h3>

          {currentCharacter.hints.slice(0, hintLevel + 1).map((hint, idx) => (
            <div key={idx} className="flex items-start gap-3 animate-fade-in">
              <div
                className="mt-1 min-w-[28px] h-7 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] flex items-center justify-center text-xs text-[#1A1510] font-bold shadow-md"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {idx + 1}
              </div>
              <div className="quote-box flex-1 text-sm">
                {hint}
              </div>
            </div>
          ))}

          {hintLevel < maxHints - 1 && !showInfo && (
            <button
              onClick={revealHint}
              className="w-full py-2 text-sm text-[#D4AF37] hover:text-[#F4E5B1] transition-colors flex items-center justify-center gap-2 border border-[#D4AF37]/20 rounded-lg hover:bg-[#D4AF37]/5"
            >
              <HelpCircle className="w-4 h-4" /> Xem thêm gợi ý (-10 điểm)
            </button>
          )}
        </div>

        {/* Interaction Area */}
        {!showInfo ? (
          <div className="space-y-4">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setFeedback('none');
              }}
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Nhập tên nhân vật..."
              className={`w-full p-4 rounded-xl bg-[#2A2318] border-2 text-[#F5F0E1] placeholder-[#6B5C45] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all
                ${feedback === 'incorrect' ? 'border-[#722F37] animate-shake' : 'border-[#3D3428] focus:border-[#D4AF37]'}
              `}
              style={{ fontFamily: "'Playfair Display', serif" }}
            />
            <button
              onClick={checkAnswer}
              className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] rounded-xl text-[#1A1510] font-bold shadow-lg shadow-[#D4AF37]/20 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Đoán Ngay
            </button>
            {feedback === 'incorrect' && (
              <p className="text-[#E8A9A9] text-center text-sm bg-[#722F37]/10 p-2 rounded-lg border border-[#722F37]/30">
                Chưa chính xác, hãy thử lại!
              </p>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-[#2E8B57] to-[#1E5631] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#2E8B57]/30">
              <User className="w-12 h-12 text-white" />
            </div>
            <h3
              className="text-2xl font-bold text-[#D4AF37] uppercase tracking-wider"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {currentCharacter.name}
            </h3>
            <p className="text-[#8B7355] text-sm px-4">{currentCharacter.description}</p>
            <button
              onClick={nextCharacter}
              className="px-10 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#1A1510] rounded-full font-bold hover:from-[#B8860B] hover:to-[#D4AF37] transition-all uppercase tracking-wider text-sm"
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterGame;