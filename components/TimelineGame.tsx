import React, { useState, useEffect } from 'react';
import { HistoricalEvent, GameConfig } from '../types';
import { Clock, Crown, CheckCircle, XCircle, Scroll, GripVertical } from 'lucide-react';

interface TimelineGameProps {
  data: HistoricalEvent[];
  config: GameConfig;
  onFinish: (score: number, maxScore: number) => void;
}

const TimelineGame: React.FC<TimelineGameProps> = ({ data, config, onFinish }) => {
  const [items, setItems] = useState<HistoricalEvent[]>([]);
  const [placedItems, setPlacedItems] = useState<(HistoricalEvent | null)[]>([]);
  const [draggables, setDraggables] = useState<HistoricalEvent[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const count = config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 7 : 10;
    const subset = [...data].sort(() => 0.5 - Math.random()).slice(0, count);
    const sortedSubset = [...subset].sort((a, b) => a.year - b.year);
    setItems(sortedSubset);
    setPlacedItems(new Array(count).fill(null));
    setDraggables([...subset].sort(() => 0.5 - Math.random()));
  }, [data, config]);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("text/plain", eventId);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    const item = draggables.find(d => d.id === eventId);

    if (item && !placedItems[index]) {
      const newPlaced = [...placedItems];
      newPlaced[index] = item;
      setPlacedItems(newPlaced);
      setDraggables(prev => prev.filter(d => d.id !== eventId));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = (index: number) => {
    if (finished) return;
    const item = placedItems[index];
    if (item) {
      setDraggables(prev => [...prev, item]);
      const newPlaced = [...placedItems];
      newPlaced[index] = null;
      setPlacedItems(newPlaced);
    }
  }

  const checkResult = () => {
    let currentScore = 0;
    placedItems.forEach((item, index) => {
      if (item && item.id === items[index].id) {
        currentScore += 10;
      }
    });
    setScore(currentScore);
    setFinished(true);
    setTimeout(() => {
      onFinish(currentScore, items.length * 10);
    }, 2000);
  };

  return (
    <div
      className="w-full h-full flex flex-col p-4"
      style={{ fontFamily: "'Lora', Georgia, serif" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2
          className="text-2xl font-bold text-[#D4AF37] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <Scroll className="w-6 h-6 inline-block mr-2" />
          Sắp Xếp Dòng Thời Gian
        </h2>
        <p className="text-[#6B5C45] text-sm">Kéo các sự kiện vào đúng vị trí theo thứ tự thời gian</p>
      </div>

      {/* Draggable Area */}
      <div className="flex flex-wrap gap-3 justify-center items-start mb-8 min-h-[120px] p-4 bg-[#2A2318] rounded-xl border border-[#3D3428]">
        {draggables.map(item => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            className="p-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#1A1510] rounded-lg cursor-grab active:cursor-grabbing shadow-lg text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <GripVertical className="w-4 h-4 opacity-50" />
            {item.name}
          </div>
        ))}
        {draggables.length === 0 && !finished && (
          <div className="text-[#6B5C45] italic flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#2E8B57]" />
            Tất cả thẻ đã được xếp!
          </div>
        )}
      </div>

      {/* Timeline Slots */}
      <div className="relative flex justify-between items-center px-4 py-8 overflow-x-auto flex-1">
        {/* Timeline Line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent -z-10"></div>

        {items.map((target, index) => (
          <div
            key={index}
            className="flex flex-col items-center relative min-w-[120px]"
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
          >
            {/* Year Label */}
            <div
              className="mb-4 px-4 py-1.5 bg-[#2A2318] rounded-full text-sm text-[#D4AF37] font-bold border border-[#D4AF37]/30"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {target.year}
            </div>

            {/* Timeline Dot */}
            <div className="w-4 h-4 rounded-full bg-[#D4AF37] border-4 border-[#1A1510] shadow-lg shadow-[#D4AF37]/30 z-10 mb-4"></div>

            {/* Drop Zone */}
            <div
              onClick={() => handleRemove(index)}
              className={`w-36 min-h-[100px] rounded-xl border-2 border-dashed flex items-center justify-center p-3 text-center text-xs transition-all cursor-pointer
                ${placedItems[index]
                  ? (finished
                    ? (placedItems[index]?.id === target.id
                      ? 'bg-[#2E8B57]/20 border-[#2E8B57] text-[#5FD89E]'
                      : 'bg-[#722F37]/20 border-[#722F37] text-[#E8A9A9]')
                    : 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#F4E5B1]'
                  )
                  : 'border-[#3D3428] bg-[#1A1510] hover:bg-[#2A2318] hover:border-[#6B5C45] text-[#6B5C45]'
                }`}
            >
              <span style={{ fontFamily: "'Playfair Display', serif" }}>
                {placedItems[index] ? (
                  <span className="flex items-center gap-1">
                    {finished && placedItems[index]?.id === target.id && <CheckCircle className="w-4 h-4" />}
                    {finished && placedItems[index]?.id !== target.id && <XCircle className="w-4 h-4" />}
                    {placedItems[index]?.name}
                  </span>
                ) : (
                  "Thả vào đây"
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex justify-center">
        {!finished && (
          <button
            onClick={checkResult}
            disabled={draggables.length > 0}
            className="px-10 py-3 bg-gradient-to-r from-[#2E8B57] to-[#1E5631] hover:from-[#1E5631] hover:to-[#2E8B57] text-white font-bold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-sm"
          >
            Kiểm Tra Kết Quả
          </button>
        )}
        {finished && (
          <div className="text-center">
            <div className="score-display text-xl mb-2">
              <div className="coin-icon">
                <Crown className="w-3 h-3" />
              </div>
              <span>Điểm: {score}/{items.length * 10}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineGame;