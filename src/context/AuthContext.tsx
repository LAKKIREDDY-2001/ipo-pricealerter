import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AuthUser,
  NotificationItem,
  PriceAlertRule,
  WatchlistEntry,
} from '../types/financial';
import { api } from '../services/api';
import { useLiveMarketStream } from '../hooks/useLiveMarketStream';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  watchlist: WatchlistEntry[];
  alerts: PriceAlertRule[];
  notifications: NotificationItem[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isInWatchlist: (itemType: 'ipo' | 'stock', itemKey: string) => boolean;
  toggleWatchlist: (itemType: 'ipo' | 'stock', itemKey: string, label: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [alerts, setAlerts] = useState<PriceAlertRule[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadProtectedData = useCallback(async () => {
    try {
      const [wlRes, alertRes, notifRes] = await Promise.all([
        api.getWatchlist(),
        api.getAlerts(),
        api.getNotifications(),
      ]);
      setWatchlist(wlRes.items);
      setAlerts(alertRes.alerts);
      setNotifications(notifRes.notifications);
    } catch {
      setWatchlist([]);
      setAlerts([]);
      setNotifications([]);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const { user: current } = await api.me();
      setUser(current);
      if (current) {
        await loadProtectedData();
      } else {
        setWatchlist([]);
        setAlerts([]);
        setNotifications([]);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadProtectedData]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  useLiveMarketStream({
    enabled: Boolean(user),
    onAlerts: () => {
      void loadProtectedData();
    },
  });

  const login = async (email: string, password: string) => {
    const { user: loggedIn } = await api.login(email, password);
    setUser(loggedIn);
    await loadProtectedData();
    return loggedIn;
  };

  const register = async (name: string, email: string, password: string) => {
    const { user: created } = await api.register(name, email, password);
    setUser(created);
    await loadProtectedData();
    return created;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setWatchlist([]);
    setAlerts([]);
    setNotifications([]);
  };

  const isInWatchlist = useCallback(
    (itemType: 'ipo' | 'stock', itemKey: string) =>
      watchlist.some(
        (w) => w.itemType === itemType && w.itemKey.toLowerCase() === itemKey.toLowerCase()
      ),
    [watchlist]
  );

  const toggleWatchlist = async (
    itemType: 'ipo' | 'stock',
    itemKey: string,
    label: string
  ): Promise<boolean> => {
    if (!user) return false;
    const existing = watchlist.find(
      (w) => w.itemType === itemType && w.itemKey.toLowerCase() === itemKey.toLowerCase()
    );
    if (existing) {
      await api.removeFromWatchlist(existing.id);
      setWatchlist((prev) => prev.filter((w) => w.id !== existing.id));
      return false;
    }
    const { item } = await api.addToWatchlist(itemType, itemKey, label);
    setWatchlist((prev) => [item, ...prev]);
    return true;
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        watchlist,
        alerts,
        notifications,
        unreadCount,
        login,
        register,
        logout,
        refreshUserData,
        isInWatchlist,
        toggleWatchlist,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
