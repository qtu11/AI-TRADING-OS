"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppNotification, NotificationSeverity } from "@/types/notification.types";
import { useAuth } from "./AuthContext";
import { getNotifications, saveNotification, markNotificationAsRead, clearAllNotifications } from "@/lib/firebase/db-service";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (
    title: string,
    message: string,
    severity?: NotificationSeverity,
    actionUrl?: string
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    getNotifications(user.uid).then(setNotifications).catch(console.warn);
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = async (
    title: string,
    message: string,
    severity: NotificationSeverity = "info",
    actionUrl?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: user?.uid || "anonymous",
      type: "JOURNAL_REMINDER",
      severity,
      title,
      message,
      read: false,
      actionUrl,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (user?.uid) {
      await saveNotification(newNotif).catch(console.warn);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (user?.uid) {
      await markNotificationAsRead(user.uid, id).catch(console.warn);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    if (user?.uid) {
      clearAllNotifications(user.uid).catch(console.warn);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
