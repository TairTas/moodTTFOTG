import React, { useState, useRef, useEffect } from 'react';
import { MOOD_COLORS, MOOD_LABELS, MoodValue } from '../types';
import { Trash2 } from 'lucide-react';

interface MoodSliderProps {
  initialValue?: MoodValue;
  isEditing: boolean;
  onChange: (val: MoodValue) => void;
  onSave: () => void;
  onDelete: () => void;
}

const MoodSlider: React.FC<MoodSliderProps> = ({ initialValue = 0, isEditing, onChange, onSave, onDelete }) => {
  const [val, setVal] = useState(initialValue);
  // localPercent tracks the exact visual position (0-100)
  const [localPercent, setLocalPercent] = useState(((initialValue - (-3)) / (3 - (-3))) * 100);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const min = -3;
  const max = 3;

  // Calculate percentage for a given value (0 to 100)
  const getPercentageFromValue = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleInteract = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    
    // Set visual position immediately for smooth dragging
    const percentage = (x / rect.width) * 100;
    setLocalPercent(percentage);
    
    // Calculate logical value
    const rawValue = (percentage / 100) * (max - min) + min;
    const roundedValue = Math.round(rawValue);
    const clampedValue = Math.max(min, Math.min(max, roundedValue)) as MoodValue;
    
    if (clampedValue !== val) {
      setVal(clampedValue);
      onChange(clampedValue);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteract(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteract(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleInteract(e.clientX);
      }
    };
    const onUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Snap visual slider to the center of the selected integer value
        setLocalPercent(getPercentageFromValue(val));
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        // e.preventDefault(); // preventing default on touch move can sometimes block scrolling if not careful, but needed here for slider
        handleInteract(e.touches[0].clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, val]);

  // When props change externally or on mount, ensure localPercent matches if not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPercent(getPercentageFromValue(val));
    }
  }, [val, isDragging]);

  const currentColor = MOOD_COLORS[val];
  const currentLabel = MOOD_LABELS[val];

  return (
    <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-300 relative z-10">
      
      {/* Mood Display */}
      <div className="mb-12 text-center">
        <h2 
          className="text-5xl font-bold text-white mb-3 transition-all duration-300"
          style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }} 
        >
          {currentLabel}
        </h2>
        <p 
          className="text-white/90 text-xl font-medium"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        >
          Как вы себя чувствуете?
        </p>
      </div>

      {/* Slider Container */}
      <div 
        className="relative w-full max-w-sm h-14 select-none touch-none mb-10" 
        ref={sliderRef}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        {/* Track */}
        <div 
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 shadow-inner"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        ></div>

        {/* Ticks (Visual only) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 pointer-events-none opacity-40">
           {Array.from({length: 7}).map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
           ))}
        </div>

        {/* Thumb */}
        <div 
          className="absolute top-1/2 w-14 h-14 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-center backdrop-blur-md bg-white/80 border border-white/60 z-10"
          style={{ 
            left: `${localPercent}%`, 
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
            transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.2s ease', // Spring animation on release
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* Inner orb for color representation */}
          <div 
            className="w-10 h-10 rounded-full shadow-inner transition-colors duration-300"
            style={{ 
              backgroundColor: currentColor, 
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.5), 0 0 15px ${currentColor}` 
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {isEditing && (
            <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:border-red-400 hover:text-red-100 backdrop-blur-md transition-all active:scale-95"
                title="Удалить запись"
            >
                <Trash2 size={24} />
            </button>
        )}
        
        <button
            type="button"
            onClick={onSave}
            className="px-12 py-4 rounded-full bg-white text-gray-900 font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] border border-white/50 backdrop-blur-sm"
        >
            Сохранить
        </button>
      </div>

    </div>
  );
};

export default MoodSlider;