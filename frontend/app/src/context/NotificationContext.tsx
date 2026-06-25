import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_URL = 'https://smart-finance-yjb0.onrender.com';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clearLogs: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && token) {
      socketRef.current = io(API_URL);
      
      socketRef.current.on('connect', () => {
        socketRef.current?.emit('join', user.id);
      });

      socketRef.current.on('new_notification', (data: any) => {
        const newNotif: AppNotification = {
          id: Math.random().toString(),
          title: data.title,
          body: data.body,
          date: new Date(data.date || new Date()).toLocaleString(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user, token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearLogs = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearLogs }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
