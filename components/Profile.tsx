import React, { useMemo } from 'react';
import { UserProfile, MoodLog, MOOD_COLORS, MOOD_LABELS } from '../types';
import { LogOut, Mail, Calendar, CalendarDays, History, PenTool, Clock } from 'lucide-react';

interface ProfileProps {
  user: { email: string | null; username?: string; uid: string }; // Loose type to support both Firebase User and DB Profile
  moods: Record<string, MoodLog>;
  onLogout?: () => void;
  readOnly?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ user, moods, onLogout, readOnly = false }) => {
  const moodList = useMemo(() => Object.values(moods) as MoodLog[], [moods]);
  const sortedMoods = useMemo(() => [...moodList].sort((a, b) => b.timestamp - a.timestamp), [moodList]);
  
  // Helpers
  const getAverage = (logs: MoodLog[]) => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, curr) => acc + curr.value, 0);
    return parseFloat((sum / logs.length).toFixed(1)); 
  };

  const getDaysSinceDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0); 
    
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 0) return 'В будущем';
    return `${diffDays} дн. назад`;
  };

  const formatRecordTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  // 1. Today's Mood
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMood = moodList.find(m => m.date === todayStr);

  // 2. Stats Calculation (Strict)
  const today = new Date();
  
  // --- Current Week (Monday to Sunday) ---
  const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const currentWeekLogs = moodList.filter(m => {
    const [y, mo, d] = m.date.split('-').map(Number);
    const dateObj = new Date(y, mo - 1, d);
    return dateObj >= monday && dateObj <= sunday;
  });

  // --- Current Month (1st to Last) ---
  const currentMonthLogs = moodList.filter(m => {
      const [y, mo] = m.date.split('-').map(Number);
      return y === today.getFullYear() && (mo - 1) === today.getMonth();
  });

  const thisMonthCount = currentMonthLogs.length;

  const stats = [
    { label: 'За 7 дней', value: getAverage(currentWeekLogs), count: currentWeekLogs.length },
    { label: 'За месяц', value: getAverage(currentMonthLogs), count: currentMonthLogs.length },
    { label: 'За всё время', value: getAverage(moodList), count: moodList.length },
  ];

  // Derive Display Name
  const displayName = user.username || user.email?.split('@')[0] || 'Пользователь';

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:gap-8 gap-6">

        {/* LEFT COLUMN: Sidebar (Profile + Stats) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          
          {/* Header Info */}
          <div className="liquid-glass rounded-3xl p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg border-2 border-white/30 shrink-0">
                {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate" title={displayName}>
                {displayName}
              </h2>
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                {readOnly ? (
                    <span>Профиль пользователя</span>
                ) : (
                    <>
                        <Mail size={12} />
                        <span className="truncate">{user.email}</span>
                    </>
                )}
              </div>
            </div>
            {!readOnly && onLogout && (
                <button 
                    onClick={onLogout}
                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Выйти"
                >
                    <LogOut size={20} />
                </button>
            )}
          </div>

          {/* Stats Column (Moved here) */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
            {stats.map((stat, idx) => {
                const roundedForColor = Math.round(stat.value);
                const color = stat.count > 0 ? MOOD_COLORS[roundedForColor] : '#e2e8f0';
                const displayValue = stat.count > 0 
                    ? (stat.value > 0 ? `+${stat.value}` : `${stat.value}`)
                    : '-';
                
                return (
                    <div key={idx} className="liquid-glass rounded-2xl p-4 flex flex-col md:flex-row md:justify-between items-center text-center md:text-left py-6 hover:bg-white/60 transition-colors">
                         <div className="md:order-2">
                             {/* Color Box */}
                            <div 
                                className="w-12 h-12 rounded-xl shadow-sm transition-colors duration-500 flex items-center justify-center font-bold text-lg border border-black/5"
                                style={{ 
                                    backgroundColor: color,
                                    color: '#000000', // Black text as requested
                                }}
                            >
                                {displayValue}
                            </div>
                         </div>
                        
                        <div className="mt-3 md:mt-0 md:order-1">
                             <span className="text-[10px] md:text-xs uppercase font-bold text-gray-400 tracking-wide block mb-1">
                                 {stat.label}
                             </span>
                             <span className="text-xs md:text-sm font-bold text-gray-800">
                                {stat.count > 0 ? MOOD_LABELS[roundedForColor] : 'Нет данных'}
                            </span>
                        </div>
                    </div>
                );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: Main Content (Today + Counts + History) */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">

          {/* Today's Mood (Moved here, Row 2 concept) */}
          <div className="relative overflow-hidden rounded-3xl shadow-lg transition-all duration-500 min-h-[220px] flex flex-col justify-center">
            <div 
                className="absolute inset-0 opacity-80 backdrop-blur-md z-0 transition-colors duration-500"
                style={{ 
                    backgroundColor: todayMood ? MOOD_COLORS[todayMood.value] : '#f1f5f9' 
                }}
            />
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
            
            <div className="relative z-10 p-8 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h3 className="text-sm uppercase font-bold tracking-widest opacity-60 mb-2 mix-blend-overlay text-black">
                        Настроение сегодня
                    </h3>
                    {todayMood ? (
                        <div>
                            <div className="text-5xl font-bold text-gray-900 mb-2 drop-shadow-sm">
                                {MOOD_LABELS[todayMood.value]}
                            </div>
                            <div className="text-xl opacity-75 font-medium text-gray-800">
                                {todayMood.value > 0 ? `+${todayMood.value}` : todayMood.value} по шкале
                            </div>
                        </div>
                    ) : (
                         <div className="text-3xl font-bold text-gray-400">
                            Не отмечено
                         </div>
                    )}
                </div>
            </div>
          </div>

           {/* Counts Row */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="liquid-glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/60 transition-colors">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                </div>
                <div>
                    <div className="text-sm text-gray-500 font-medium">В этом месяце</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {thisMonthCount}
                    </div>
                </div>
            </div>

            <div className="liquid-glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/60 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarDays size={24} />
                </div>
                <div>
                    <div className="text-sm text-gray-500 font-medium">Всего записей</div>
                    <div className="text-2xl font-bold text-gray-900">{moodList.length}</div>
                </div>
            </div>
          </div>

          {/* History List */}
          <div className="liquid-glass rounded-3xl p-6 min-h-[400px]">
            <h3 className="flex items-center gap-2 text-gray-500 font-semibold text-sm uppercase tracking-wider mb-6">
                <History size={16} />
                История настроения
            </h3>
            
            <div className="space-y-3">
              {sortedMoods.map(log => (
                <div key={log.date} className="bg-white/40 hover:bg-white/70 rounded-2xl p-4 flex items-center justify-between transition-all group border border-white/40">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center text-lg font-bold text-white border border-white/20 shrink-0"
                      style={{ 
                          backgroundColor: MOOD_COLORS[log.value],
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    >
                        {log.value > 0 ? `+${log.value}` : log.value}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-base">{MOOD_LABELS[log.value]}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                         <span className="font-medium bg-white/50 px-2 py-0.5 rounded text-gray-600 border border-white/20">
                            {new Date(log.date).toLocaleDateString('ru-RU')}
                         </span>
                         <span className="text-gray-400">
                            ({getDaysSinceDate(log.date)})
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                     {!readOnly && (
                         <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                            <PenTool size={10} />
                            Записано
                         </div>
                     )}
                     <div className="text-xs font-medium text-gray-600">
                        {formatRecordTime(log.timestamp)}
                     </div>
                  </div>
                </div>
              ))}
              {moodList.length === 0 && (
                 <div className="text-center py-20 flex flex-col items-center justify-center text-gray-400">
                    <Clock size={48} className="mb-4 opacity-20" />
                    <p>История пуста</p>
                    <p className="text-sm mt-2 opacity-60">
                        {readOnly ? 'Пользователь еще не отмечал настроение' : 'Начните отмечать настроение в календаре'}
                    </p>
                 </div>
              )}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default Profile;