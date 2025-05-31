import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, SplashScreen } from 'expo-router';

interface Profile {
  name: string;
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (userData: { id: string; email: string; full_name: string }) => void;
  isLoggedIn: boolean;
  isReady: boolean;
}

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
  isLoggedIn: false,
  isReady: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const authStorageKey = 'auth-session';
  const userStorageKey = 'current-user';

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check AsyncStorage for auth state
        const storedSession = await AsyncStorage.getItem(authStorageKey);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          setIsLoggedIn(parsedSession.isLoggedIn);
        }

        // Load current user data
        const storedUser = await AsyncStorage.getItem(userStorageKey);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setProfile(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsReady(true);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Hide splash screen when ready
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Store auth state in AsyncStorage
  const storeAuthState = async (newState: { isLoggedIn: boolean }) => {
    try {
      const jsonValue = JSON.stringify(newState);
      await AsyncStorage.setItem(authStorageKey, jsonValue);
    } catch (error) {
      console.error('Error storing auth state:', error);
    }
  };

  // Store user data in AsyncStorage
  const storeUserData = async (userData: Profile | null) => {
    try {
      if (userData) {
        const jsonValue = JSON.stringify(userData);
        await AsyncStorage.setItem(userStorageKey, jsonValue);
      } else {
        await AsyncStorage.removeItem(userStorageKey);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  // Login function with AsyncStorage
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : [];

      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      setUser(user);
      setProfile(user);
      setIsLoggedIn(true);
      storeAuthState({ isLoggedIn: true });
      storeUserData(user);

      router.replace('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);
      storeAuthState({ isLoggedIn: false });
      storeUserData(null);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Set user and profile data
  const setUserData = (userData: { id: string; email: string; full_name: string }) => {
    const newUser = {
      name: userData.full_name, // or set as needed
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newUser);
    setProfile(newUser);
    setIsLoggedIn(true);
    storeAuthState({ isLoggedIn: true });
    storeUserData(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        setUser: setUserData,
        isLoggedIn,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);