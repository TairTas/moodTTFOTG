import React, { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { LiquidInput } from './Auth';
import { getUidByUsername, getUserMoods, getUserProfile } from '../services/db';
import Profile from './Profile';
import { MoodLog, UserProfile } from '../types';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [foundUser, setFoundUser] = useState<{ profile: UserProfile, moods: Record<string, MoodLog> } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setFoundUser(null);

    try {
      const uid = await getUidByUsername(query);
      if (!uid) {
        throw new Error('Пользователь не найден');
      }

      // Check for legacy format (email instead of UID)
      if (uid.includes('@') || uid.includes('.')) {
          throw new Error('Профиль пользователя устарел. Владелец должен войти в систему, чтобы обновить данные.');
      }

      const [profile, moods] = await Promise.all([
        getUserProfile(uid),
        getUserMoods(uid)
      ]);

      if (!profile) {
        throw new Error('Данные профиля недоступны');
      }

      setFoundUser({ profile, moods });

    } catch (err: any) {
      setError(err.message || 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setFoundUser(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 w-full">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Поиск людей</h1>
        <p className="text-gray-500 text-lg">Найдите друзей и посмотрите их статистику</p>
      </div>

      <div className="max-w-md mx-auto mb-10">
        <form onSubmit={handleSearch} className="relative z-20">
            {/* Pass style to add padding-right so text doesn't go under buttons */}
            <LiquidInput
                label="Введите юзернейм"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                style={{ paddingRight: '5.5rem' }} 
            />
            
            {/* Actions Container */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-30">
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100/50"
                    >
                        <X size={20} />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SearchIcon size={20} />
                    )}
                </button>
            </div>
        </form>
        {error && (
            <div className="mt-4 text-center text-red-500 bg-red-50 py-3 px-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 text-sm leading-relaxed">
                {error}
            </div>
        )}
      </div>

      {foundUser && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-lg font-bold text-gray-700">Результат поиска</h2>
                 <button onClick={clearSearch} className="text-sm text-blue-600 hover:underline font-medium">Очистить</button>
            </div>
            <Profile 
                user={{
                    uid: foundUser.profile.uid,
                    email: foundUser.profile.email,
                    username: foundUser.profile.username
                }} 
                moods={foundUser.moods} 
                readOnly={true} 
            />
        </div>
      )}
    </div>
  );
};

export default Search;