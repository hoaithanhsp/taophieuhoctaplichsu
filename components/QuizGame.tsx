import React, { useState, useEffect } from 'react';
import { QuizQuestion, GameConfig } from '../types';
import { Clock, Crown, CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface QuizGameProps {
  data: QuizQuestion[];
  config: GameConfig;
  onFinish: (score: number, maxScore: number) => void;
}

const QuizGame: React.FC<QuizGameProps> = ({ data, config, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.difficulty === 'easy' ? 20 : config.difficulty === 'medium' ? 15 : 10);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = data[currentIndex];
  const maxTime = config.difficulty === 'easy' ? 20 : config.difficulty === 'medium' ? 15 : 10;

  useEffect(() => {
    if (isAnswered) return;

    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setTimeout(nextQuestion, 2000);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correctAnswerIndex) {
      const bonus = Math.ceil(timeLeft / 2);
      setScore(prev => prev + 10 + bonus);
      if (config.soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
        audio.play().catch(() => { });
      }
    } else {
      if (config.soundEnabled) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
        audio.play().catch(() => { });
      }
    }

    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(maxTime);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      onFinish(score, data.length * 15);
    }
  };

  const progressPercentage = (timeLeft / maxTime) * 100;

  if (!currentQuestion) return <div>No questions</div>;

  return (
    <div
      className="w-full max-w-2xl mx-auto flex flex-col h-full justify-center px-4"
      style={{ fontFamily: "'Lora', Georgia, serif" }}
    >
      {/* Progress Bar */}
      <div className="w-full h-4 bg-[#2A2318] rounded-full mb-6 overflow-hidden border border-[#3D3428] relative">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressPercentage > 60
              ? 'bg-gradient-to-r from-[#2E8B57] to-[#5FD89E]'
              : progressPercentage > 30
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F4E5B1]'
                : 'bg-gradient-to-r from-[#722F37] to-[#E8A9A9]'
            }`}
          style={{ width: `${progressPercentage}%` }}
        />
        {progressPercentage < 30 && (
          <div className="absolute inset-0 animate-pulse bg-[#722F37]/20 rounded-full" />
        )}
      </div>

      {/* Question Card */}
      <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
        {/* Gold accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-[#6B5C45] text-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="uppercase tracking-wider font-semibold">Câu hỏi {currentIndex + 1}/{data.length}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timeLeft < 5
              ? 'bg-[#722F37]/20 border-[#722F37] text-[#E8A9A9] animate-pulse'
              : 'bg-[#2A2318] border-[#3D3428] text-[#D4AF37]'
            }`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Question */}
        <h2
          className="text-2xl md:text-3xl font-bold text-[#F5F0E1] mb-8 leading-relaxed"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, idx) => {
            let btnClass = "bg-[#2A2318] border-[#3D3428] hover:bg-[#3D3428] hover:border-[#6B5C45] text-[#F5F0E1]";
            let iconElement = null;

            if (isAnswered) {
              if (idx === currentQuestion.correctAnswerIndex) {
                btnClass = "bg-[#2E8B57]/20 border-[#2E8B57] text-[#5FD89E]";
                iconElement = <CheckCircle className="w-6 h-6 text-[#5FD89E]" />;
              } else if (idx === selectedOption) {
                btnClass = "bg-[#722F37]/20 border-[#722F37] text-[#E8A9A9]";
                iconElement = <XCircle className="w-6 h-6 text-[#E8A9A9]" />;
              } else {
                btnClass = "opacity-50 cursor-not-allowed bg-[#1A1510] border-[#2A2318] text-[#6B5C45]";
              }
            }

            const optionLabels = ['A', 'B', 'C', 'D'];

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={`p-4 rounded-xl text-left border-2 transition-all font-medium text-lg flex items-center justify-between ${btnClass}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1A1510] border border-[#3D3428] font-bold text-[#D4AF37]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {optionLabels[idx]}
                  </span>
                  <span>{option}</span>
                </div>
                {iconElement}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score Display */}
      <div className="mt-6 flex justify-center">
        <div className="score-display text-lg">
          <div className="coin-icon">
            <Crown className="w-3 h-3" />
          </div>
          <span>Điểm: {score}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;