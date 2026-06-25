import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://smart-finance-yjb0.onrender.com/api';

interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  monthlySalary?: number;
};

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initial load from AsyncStorage
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setTokenState(storedToken);
        }
      } catch (e) {
        console.error("Failed to load token from storage", e);
      } finally {
        setIsReady(true);
      }
    };
    loadToken();
  }, []);

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem('userToken', newToken);
    } else {
      await AsyncStorage.removeItem('userToken');
    }
  };

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser({ id: res.data._id, name: res.data.name, email: res.data.email, profilePic: res.data.profilePic, monthlySalary: res.data.monthlySalary }))
        .catch(err => {
          console.error("Error fetching profile", err);
          if (err.response?.status === 401) {
            setToken(null);
          }
        });
    } else {
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, isReady }}>
      {isReady ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
