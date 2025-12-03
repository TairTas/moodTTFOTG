import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MoodLog, MOOD_COLORS, hexToRgba } from '../types';

interface CalendarProps {
  currentDate: Date;
  onDateClick: (dateStr: string) => void;
  moods: Record<string, MoodLog>;
  onChangeMonth: (offset: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onDateClick, moods, onChangeMonth }) => {
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [key, setKey] = useState(0); // Force re-render for animation

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  
  // Adjust for Monday start (Russian calendar standard)
  const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  // Generate grid days
  const calendarDays = useMemo(() => {
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < startDayOffset; i++) {
      days.push({ day: null });
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      // Format YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr });
    }
    return days;
  }, [year, month, daysInMonth, startDayOffset]);

  const handlePrevMonth = () => {
    setSlideDirection('left');
    setKey(prev => prev + 1);
    onChangeMonth(-1);
  };

  const handleNextMonth = () => {
    setSlideDirection('right');
    setKey(prev => prev + 1);
    onChangeMonth(1);
  };

  return (
    <div className="w-full max-w-md mx-auto liquid-glass rounded-3xl p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-20 relative">
        <button 
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-black/5 text-gray-700 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 tracking-wide select-none">
          {monthNames[month]} {year}
        </h2>
        <button 
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-black/5 text-gray-700 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid Wrapper for Animation */}
      <div 
        key={`${year}-${month}-${key}`} 
        className={`${slideDirection === 'left' ? 'slide-in-left' : slideDirection === 'right' ? 'slide-in-right' : ''}`}
      >
        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
          {calendarDays.map((item, index) => {
            if (!item.day) {
              return <div key={`empty-${index}`} />;
            }
            
            const moodLog = moods[item.dateStr!];
            const isToday = isCurrentMonth && item.day === today.getDate();
            
            // Determine color
            const moodColor = moodLog ? MOOD_COLORS[moodLog.value] : null;
            
            return (
              <button
                key={item.dateStr}
                onClick={() => onDateClick(item.dateStr!)}
                className="relative flex items-center justify-center aspect-square rounded-2xl transition-all duration-300 active:scale-95 group hover:bg-gray-100/50"
              >
                {/* Glass Gem Background (if mood exists) */}
                {moodColor && (
                   <div 
                     className="absolute inset-0 rounded-2xl backdrop-blur-sm transition-all duration-500"
                     style={{ 
                       backgroundColor: hexToRgba(moodColor, 0.25),
                       border: `1px solid ${hexToRgba(moodColor, 0.4)}`,
                       boxShadow: `0 4px 12px ${hexToRgba(moodColor, 0.25)}, inset 0 0 10px ${hexToRgba(moodColor, 0.1)}`
                     }}
                   />
                )}

                {/* Today Ring */}
                {isToday && !moodColor && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                )}
                 {/* Today Ring (if colored, add separate ring) */}
                 {isToday && moodColor && (
                  <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/50 z-10" />
                )}

                {/* Day Number */}
                <span className={`z-10 text-sm font-medium ${moodColor ? 'text-gray-800 font-bold' : 'text-gray-700'}`}>
                  {item.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;