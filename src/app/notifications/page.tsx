"use client";

import React from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Bell, CheckCircle2, AlertTriangle, ShieldAlert, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/currency";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const { language, t } = useLanguage();

  const isVi = language === "vi";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <span>{isVi ? "Trung Tâm Thông Báo & Nhật Ký Hệ Thống" : "Notification Center & System Audit Log"}</span>
          </h1>
          <p className="text-xs text-txt-secondary mt-1 font-mono">
            {isVi
              ? "Cảnh báo thời gian thực về ngưỡng rủi ro, nhắc nhở ghi nhật ký và xác nhận đồng bộ lệnh."
              : "Real-time alerts for risk threshold approaches, journal reminders, and trade sync confirmations."}
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              soundFX.playClick(500);
              clearAll();
            }}
            className="text-txt-muted hover:text-loss"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isVi ? "Xóa Tất Cả" : "Clear All"}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bento-card p-10 sm:p-14 text-center space-y-3 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-txt-primary">
            {isVi ? "Không Có Thông Báo Nào" : "No Unread Notifications"}
          </h3>
          <p className="text-xs text-txt-secondary max-w-md mx-auto leading-relaxed font-sans">
            {isVi
              ? "Bạn đã cập nhật mọi thông tin. Cảnh báo hệ thống và kiểm soát rủi ro sẽ hiển thị tại đây theo thời gian thực."
              : "You are fully up to date. System notifications and risk alerts will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="bento-card divide-y divide-border/60 overflow-hidden relative">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                soundFX.playClick(700);
                markAsRead(notif.id);
              }}
              className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                notif.read ? "bg-bg-surface opacity-75" : "bg-bg-surface-hover"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  notif.severity === "error"
                    ? "bg-loss-subtle text-loss border border-loss/30"
                    : notif.severity === "warning"
                    ? "bg-warning-subtle text-warning border border-warning/30"
                    : notif.severity === "success"
                    ? "bg-gain-subtle text-gain border border-gain/30"
                    : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                }`}
              >
                {notif.severity === "error" ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : notif.severity === "warning" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : notif.severity === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-txt-primary truncate font-mono">{notif.title}</h4>
                  <span className="text-[10px] font-mono text-txt-muted shrink-0">
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary mt-1 font-sans">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
