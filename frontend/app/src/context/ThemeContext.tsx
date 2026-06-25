import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  subText: string;
  border: string;
  primary: string;
  secondary: string;
  danger: string;
  success: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  text: '#12121A',
  subText: '#666666',
  border: '#E0E0E0',
  primary: '#42A5F5',
  secondary: '#BB86FC',
  danger: '#F44336',
  success: '#4CAF50',
};

const darkColors: ThemeColors = {
  background: '#050505',
  cardBackground: '#12121A',
  text: '#FFFFFF',
  subText: '#888888',
  border: '#1e1e24',
  primary: '#42A5F5',
  secondary: '#BB86FC',
  danger: '#F44336',
  success: '#4CAF50',
};

import { Platform } from 'react-native';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      if (Platform.OS === 'web') {
        const savedTheme = localStorage.getItem('app_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      } else {
        AsyncStorage.getItem('app_theme').then(savedTheme => {
          if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
        }).catch(() => {});
      }
    } catch (e) {}
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('app_theme', newTheme);
      } else {
        await AsyncStorage.setItem('app_theme', newTheme);
      }
    } catch (e) {}
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
