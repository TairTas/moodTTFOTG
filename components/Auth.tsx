import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import { registerUsername, getUidByUsername, saveUserProfile, getUserProfile } from '../services/db';
import { Eye, EyeOff } from 'lucide-react';

// --- Sound Effect Helper ---
const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Subtle "Glassy" Pop/Click
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    
    // Cleanup
    setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close();
    }, 200);
  } catch (e) {
    // Ignore audio errors
  }
};

// --- Custom Animated Input Component ---
interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isPassword?: boolean;
  isRevealed?: boolean;
}

interface CharItem {
  id: number;
  char: string;
  isExiting: boolean;
}

export const LiquidInput: React.FC<LiquidInputProps> = ({ label, value, onChange, type, isPassword, isRevealed, ...props }) => {
  const [visualChars, setVisualChars] = useState<CharItem[]>([]);
  const prevValueRef = useRef<string>('');
  const nextIdRef = useRef(0);
  const [isFocused, setIsFocused] = useState(false);
  
  // Wave Animation State
  const [isWaving, setIsWaving] = useState(false);
  const [waveIndex, setWaveIndex] = useState(0); 

  // Convert prop value to string safely
  const stringValue = typeof value === 'string' ? value : '';
  const len = stringValue.length;

  // 1. Handle typing animations (Add/Remove chars) + Sound
  useEffect(() => {
    const prev = prevValueRef.current;
    const current = stringValue;

    if (current === prev) return;

    // Play sound on change
    playClickSound();

    if (current.startsWith(prev) && current.length === prev.length + 1) {
      // Append
      const newChar = current.slice(-1);
      setVisualChars(chars => [
        ...chars, 
        { id: nextIdRef.current++, char: newChar, isExiting: false }
      ]);
    } else if (prev.startsWith(current) && prev.length === current.length + 1) {
      // Backspace
      setVisualChars(chars => {
        const lastIndex = chars.findLastIndex(c => !c.isExiting);
        if (lastIndex === -1) return chars;
        const newChars = [...chars];
        newChars[lastIndex] = { ...newChars[lastIndex], isExiting: true };
        return newChars;
      });
      setTimeout(() => {
        setVisualChars(chars => chars.filter(c => !c.isExiting)); 
      }, 250);
    } else {
      // Reset (Paste/Cut/Clear)
      const newItems = current.split('').map(c => ({
        id: nextIdRef.current++,
        char: c,
        isExiting: false
      }));
      setVisualChars(newItems);
    }
    prevValueRef.current = current;
  }, [stringValue]);

  // 2. Handle Wave Animation ONLY when reveal state toggles
  useEffect(() => {
    if (!isPassword) return;

    setIsWaving(true);
    setWaveIndex(0);
    
    // Animate wave
    const interval = setInterval(() => {
      setWaveIndex(prev => {
        if (prev >= len + 2) { // +2 buffer to ensure completion
          clearInterval(interval);
          setIsWaving(false);
          return prev;
        }
        return prev + 1;
      });
    }, 30); // Speed of wave

    return () => clearInterval(interval);
  }, [isRevealed, isPassword]);

  // Helper to determine what to show for a char at index i
  const getDisplayChar = (char: string, index: number) => {
    if (!isPassword) return char;
    
    // If NOT animating the wave, always use masking logic directly
    if (!isWaving) {
        return isRevealed ? char : '•';
    }
    
    // If Waving, use waveIndex to drive transition
    if (isRevealed) {
      // Revealing: Dots -> Chars
      return index < waveIndex ? char : '•';
    } else {
      // Hiding: Chars -> Dots
      return index < waveIndex ? '•' : char;
    }
  };

  return (
    <div className="relative group">
      {/* Background Visual Layer */}
      <div 
        className="
          absolute inset-0 px-4 pt-6 pb-2 rounded-xl liquid-input pointer-events-none overflow-hidden
          flex items-center text-gray-900 font-medium tracking-wide
        "
        aria-hidden="true"
      >
        {visualChars.map((item, index) => (
          <span
            key={item.id}
            className={`
              inline-block whitespace-pre
              ${item.isExiting ? 'animate-char-out' : 'animate-char-in'}
            `}
          >
            {getDisplayChar(item.char, index)}
          </span>
        ))}
        {/* Custom Caret - Only visible when focused and at the end */}
        {isFocused && (
            <div className="w-[2px] h-5 bg-blue-600 animate-pulse ml-0.5 rounded-full" />
        )}
      </div>

      {/* Real Input (Transparent, caret transparent) */}
      <input
        {...props}
        value={value}
        onChange={onChange}
        onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
        }}
        onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
        }}
        type="text"
        className="
          relative z-10 w-full px-4 pt-6 pb-2 
          rounded-xl bg-transparent border-none
          text-transparent font-medium
          outline-none
          placeholder-transparent
          caret-transparent
        "
        style={{ color: 'transparent', textShadow: 'none', caretColor: 'transparent' }}
        autoComplete={isPassword ? "new-password" : "off"}
        autoCapitalize="none"
        autoCorrect="off"
      />

      <label 
        className={`
          absolute left-4 top-4 text-gray-500 text-sm transition-all duration-200 pointer-events-none z-20
          peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
          peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:font-semibold
          ${stringValue || isFocused ? 'top-1.5 text-xs font-semibold' : ''}
        `}
      >
        {label}
      </label>
    </div>
  );
};


const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let loginEmail = email; 
      let isLegacyUser = false;
      const usernameInput = email.trim();

      // Check if input is a username (doesn't contain @)
      if (!loginEmail.includes('@')) {
         const lookupValue = await getUidByUsername(usernameInput);
         if (!lookupValue) {
           throw new Error('Пользователь с таким юзернеймом не найден');
         }

         // Handle Legacy Data: If lookupValue contains @, it's an email (Old Format)
         // We will login with it, but flag it for repair
         if (lookupValue.includes('@')) {
             loginEmail = lookupValue;
             isLegacyUser = true;
         } else {
             // It's a proper UID, fetch profile to get email for login
             const profile = await getUserProfile(lookupValue);
             if (profile?.email) {
                 loginEmail = profile.email;
             } else {
                 throw new Error('Не удалось получить почту для этого юзернейма');
             }
         }
      }

      // Perform Login
      const userCredential = await auth.signInWithEmailAndPassword(loginEmail, password);
      
      // --- AUTO-REPAIR LOGIC ---
      if (userCredential.user && isLegacyUser && !loginEmail.includes('@') === false) {
          // If we logged in using a legacy username mapping, we MUST fix it now.
          // We have the real UID: userCredential.user.uid
          // We have the username: usernameInput
          try {
              console.log("Fixing legacy username mapping for:", usernameInput);
              await registerUsername(usernameInput, loginEmail, userCredential.user.uid);
              
              // Also ensure profile exists at the correct UID path
              await saveUserProfile(userCredential.user.uid, {
                  uid: userCredential.user.uid,
                  email: loginEmail,
                  username: usernameInput
              });
              console.log("Legacy username fixed successfully.");
          } catch (fixErr) {
              console.error("Failed to auto-fix legacy username:", fixErr);
          }
      }

    } catch (err: any) {
      console.error(err);
      setError('Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username.length < 3) {
        setError("Юзернейм слишком короткий");
        setLoading(false);
        return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const existingUid = await getUidByUsername(username);
      if (existingUid) {
        throw new Error("Этот юзернейм уже занят");
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        await registerUsername(username, email, user.uid);
        await saveUserProfile(user.uid, {
          uid: user.uid,
          email: email,
          username: username
        });
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>

      {/* Liquid Glass Card */}
      <div className="liquid-glass w-full max-w-md rounded-3xl p-8 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">MoodFlow</h1>
          <p className="text-gray-600 font-medium">Отслеживай своё настроение</p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm text-red-600 text-sm p-3 rounded-xl text-center border border-red-100">
              {error}
            </div>
          )}

          {isLogin ? (
            <LiquidInput
              label="Юзернейм или Почта"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <>
              <LiquidInput
                label="Почта"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <LiquidInput
                label="Юзернейм"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </>
          )}

          <div className="relative">
            <LiquidInput
              label="Пароль"
              type="text"
              isPassword={true}
              isRevealed={showPassword}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors z-20"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
                <LiquidInput
                label="Подтвердите пароль"
                type="text"
                isPassword={true}
                isRevealed={showPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={toggleMode}
            className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;