import { ref, set, get, child, onValue, off, remove } from 'firebase/database';
import { db } from '../firebase';
import { MoodLog, UserProfile } from '../types';

// --- User & Auth Helpers ---

// Store mapping: username -> uid
export const registerUsername = async (username: string, email: string, uid: string) => {
  const normalizedUsername = username.toLowerCase().trim();
  const usernameRef = ref(db, `usernames/${normalizedUsername}`);
  // We store the UID so we can find the user's data at users/{uid}
  await set(usernameRef, uid);
};

export const getEmailByUsername = async (username: string): Promise<string | null> => {
  const uid = await getUidByUsername(username);
  if (uid && !uid.includes('@')) {
    const profile = await getUserProfile(uid);
    return profile ? profile.email : null;
  }
  // Fallback for legacy data
  if (uid && uid.includes('@')) return uid;
  
  return null;
};

export const getUidByUsername = async (username: string): Promise<string | null> => {
  const normalizedUsername = username.toLowerCase().trim();
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `usernames/${normalizedUsername}`));
  if (snapshot.exists()) {
    return snapshot.val(); // Returns UID string (or email in legacy cases)
  }
  return null;
};

export const saveUserProfile = async (userId: string, profile: UserProfile) => {
  if (userId.includes('.') || userId.includes('@')) {
      console.warn("Attempted to save profile with invalid path characters, skipping:", userId);
      return; 
  }
  const userRef = ref(db, `users/${userId}/profile`);
  await set(userRef, profile);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Safe exit for invalid IDs to prevent app crash
  if (!userId || userId.includes('.') || userId.includes('@')) return null; 
  
  const dbRef = ref(db);
  try {
    const snapshot = await get(child(dbRef, `users/${userId}/profile`));
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (e) {
    console.error("Error fetching user profile:", e);
  }
  return null;
};

// --- Mood Helpers ---

export const saveMood = async (userId: string, mood: MoodLog) => {
  if (userId.includes('.') || userId.includes('@')) return;
  const moodRef = ref(db, `users/${userId}/moods/${mood.date}`);
  await set(moodRef, mood);
};

export const deleteMood = async (userId: string, dateStr: string) => {
  if (userId.includes('.') || userId.includes('@')) return;
  const moodRef = ref(db, `users/${userId}/moods/${dateStr}`);
  await remove(moodRef);
};

export const subscribeToMoods = (userId: string, callback: (moods: Record<string, MoodLog>) => void) => {
  if (!userId || userId.includes('.') || userId.includes('@')) {
      callback({});
      return () => {};
  }
  const moodsRef = ref(db, `users/${userId}/moods`);
  const listener = onValue(moodsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  
  return () => off(moodsRef, 'value', listener);
};

export const getUserMoods = async (userId: string): Promise<Record<string, MoodLog>> => {
    if (!userId || userId.includes('.') || userId.includes('@')) return {};
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `users/${userId}/moods`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
    } catch (e) {
        console.error("Error fetching user moods:", e);
    }
    return {};
};