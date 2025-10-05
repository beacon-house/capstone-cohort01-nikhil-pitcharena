// Swipeable pitch card component with touch gesture support
// Displays pitch information with swipe-to-vote functionality for mobile

import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, X, TrendingUp } from 'lucide-react';

interface PitchCardProps {
  pitch: {
    id: string;
    title: string;
    target_audience: string;
    pain_point: string;
    product_description: string;
    elevator_pitch: string;
    vote_counts: {
      interesting: number;
      needs_work: number;
    };
    ai_score?: number;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  isTopCard: boolean;
}

export function PitchCard({ pitch, onSwipeLeft, onSwipeRight, onTap, isTopCard }: PitchCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTopCard) return;
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTopCard) return;
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging || !isTopCard) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const rotation = isDragging ? dragOffset.x / 20 : 0;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  const showInterestingOverlay = dragOffset.x > 50;
  const showNeedsWorkOverlay = dragOffset.x < -50;

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity: opacity,
        transition: isDragging ? 'none' : 'all 0.3s ease',
        cursor: isTopCard ? 'grab' : 'default',
      }}
      className={`absolute inset-0 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {showInterestingOverlay && (
        <div className="absolute inset-0 bg-emerald-500 bg-opacity-20 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-lg transform -rotate-12">
            INTERESTING
          </div>
        </div>
      )}

      {showNeedsWorkOverlay && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg transform rotate-12">
            NEEDS WORK
          </div>
        </div>
      )}

      <div className="h-full overflow-y-auto p-6" onClick={onTap}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-4">{pitch.title}</h2>
          {pitch.ai_score && (
            <div className="flex-shrink-0 flex items-center space-x-1 px-3 py-1 bg-purple-50 rounded-full">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">{pitch.ai_score}/10</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Target Audience</h3>
            <p className="text-gray-700">{pitch.target_audience}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Problem</h3>
            <p className="text-gray-700">{pitch.pain_point}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Solution</h3>
            <p className="text-gray-700">{pitch.product_description}</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic">Tap to read full pitch</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-emerald-600">
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="font-medium">{pitch.vote_counts.interesting}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <X className="w-4 h-4 mr-1" />
              <span className="font-medium">{pitch.vote_counts.needs_work}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
