import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from './firebase';
import { saveMood, subscribeToMoods, deleteMood } from './services/db';
import { MoodLog, MoodValue, MOOD_COLORS } from './types';
import Auth from './components/Auth';
import Calendar from './components/Calendar';
import MoodSlider from './components/MoodSlider';
import Profile from './components/Profile';
import Search from './components/Search';
import { Calendar as CalendarIcon, User as UserIcon, Search as SearchIcon } from 'lucide-react';

function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App State
  const [activeTab, setActiveTab] = useState<'calendar' | 'search' | 'profile'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date()); // For Calendar View
  const [moods, setMoods] = useState<Record<string, MoodLog>>({});
  
  // Modal State
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempMood, setTempMood] = useState<MoodValue>(0);
  const [isEditing, setIsEditing] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Data Listener (Only if user is logged in)
  useEffect(() => {
    if (!user) {
        setMoods({});
        return;
    }
    const unsubscribe = subscribeToMoods(user.uid, (data) => {
      setMoods(data);
    });
    return unsubscribe;
  }, [user]);

  // Handlers
  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    
    // Check if we already have a mood for this date to init slider
    const existingLog = moods[dateStr];
    if (existingLog) {
      setTempMood(existingLog.value);
      setIsEditing(true);
    } else {
      setTempMood(0);
      setIsEditing(false);
    }
    
    setIsModalOpen(true);
  };

  const handleSaveMood = async () => {
    if (!user || !selectedDateStr) return;
    
    const moodLog: MoodLog = {
      date: selectedDateStr,
      value: tempMood,
      timestamp: Date.now()
    };
    
    await saveMood(user.uid, moodLog);
    setIsModalOpen(false);
  };

  const handleDeleteMood = async () => {
    if (!user || !selectedDateStr) return;
    
    // Immediate deletion without window.confirm to avoid blocking/issues
    try {
        await deleteMood(user.uid, selectedDateStr);
        setIsModalOpen(false);
    } catch (error) {
        console.error("Error deleting mood:", error);
    }
  };

  const handleChangeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // Render Loading
  if (authLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  // Render Auth
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 relative overflow-hidden font-sans pb-24 md:pb-10">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>

      {/* Top Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto mb-4">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-sm">M</div>
           <span className="font-bold text-xl tracking-tight text-gray-800">MoodFlow</span>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* Expanded width for Profile/Search on desktop, centered compact width for Calendar */}
      <main className={`relative z-10 px-4 mx-auto transition-all duration-300 ${activeTab === 'calendar' ? 'max-w-md' : 'w-full md:max-w-5xl'}`}>
        
        {activeTab === 'calendar' && (
           <div className="max-w-md mx-auto">
              <header className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  Привет, {user.email?.split('@')[0]}!
                </h1>
                <p className="text-gray-500 text-lg">
                  Отметь своё настроение сегодня
                </p>
              </header>

              <Calendar 
                currentDate={currentDate} 
                onDateClick={handleDateClick} 
                moods={moods}
                onChangeMonth={handleChangeMonth}
              />
           </div>
        )}

        {activeTab === 'search' && <Search />}

        {activeTab === 'profile' && (
          <Profile user={user} moods={moods} onLogout={handleLogout} />
        )}

      </main>

      {/* Floating Bottom Navigation (Morphing Tabs) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[420px] z-40">
        <div className="liquid-glass rounded-full p-2 flex justify-between items-center shadow-2xl gap-2">
          
          {/* Calendar Tab */}
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`
              flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap
              ${activeTab === 'calendar' 
                ? 'bg-blue-600 text-white flex-[3] shadow-md' 
                : 'text-gray-500 hover:bg-black/5 hover:text-gray-700 flex-[1]'
              }
            `}
          >
            <CalendarIcon size={20} className="shrink-0" />
            <span 
              className={`
                 font-bold text-sm transition-all duration-300 origin-left
                 ${activeTab === 'calendar' ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 hidden'}
              `}
            >
              Календарь
            </span>
          </button>
          
           {/* Search Tab */}
           <button 
            onClick={() => setActiveTab('search')}
            className={`
              flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap
              ${activeTab === 'search' 
                ? 'bg-blue-600 text-white flex-[3] shadow-md' 
                : 'text-gray-500 hover:bg-black/5 hover:text-gray-700 flex-[1]'
              }
            `}
          >
            <SearchIcon size={20} className="shrink-0" />
            <span 
              className={`
                 font-bold text-sm transition-all duration-300 origin-left
                 ${activeTab === 'search' ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 hidden'}
              `}
            >
              Поиск
            </span>
          </button>

          {/* Profile Tab */}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`
              flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap
              ${activeTab === 'profile' 
                ? 'bg-blue-600 text-white flex-[3] shadow-md' 
                : 'text-gray-500 hover:bg-black/5 hover:text-gray-700 flex-[1]'
              }
            `}
          >
            <UserIcon size={20} className="shrink-0" />
            <span 
              className={`
                 font-bold text-sm transition-all duration-300 origin-left
                 ${activeTab === 'profile' ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-4 w-0 hidden'}
              `}
            >
              Профиль
            </span>
          </button>

        </div>
      </div>

      {/* Mood Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           {/* Dark Backdrop with blur */}
           <div 
             className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl transition-all duration-300"
             onClick={() => setIsModalOpen(false)}
           />
           
           {/* Ambient Mood Glow */}
           <div 
              className="absolute pointer-events-none w-[600px] h-[600px] rounded-full blur-[100px] opacity-40 transition-colors duration-700 ease-in-out"
              style={{ 
                  backgroundColor: MOOD_COLORS[tempMood],
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%'
              }}
           />

           {/* Modal Content */}
           <div className="relative z-10 w-full max-w-md p-6">
             <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-0 right-0 p-2 text-white/50 hover:text-white transition-colors"
             >
               <span className="sr-only">Закрыть</span>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
             
             <MoodSlider 
               initialValue={tempMood}
               isEditing={isEditing}
               onChange={setTempMood}
               onSave={handleSaveMood}
               onDelete={handleDeleteMood}
             />
           </div>
        </div>
      )}

    </div>
  );
}

export default App;