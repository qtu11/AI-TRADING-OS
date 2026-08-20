"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Settings, Shield, User, Globe, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { userProfile, updateUserProfileData } = useAuth();
  const { language, t } = useLanguage();

  const isVi = language === "vi";

  const [displayName, setDisplayName] = useState(userProfile?.displayName || "Elite Trader");
  const [currency, setCurrency] = useState(userProfile?.currency || "USD");
  const [timezone, setTimezone] = useState(userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [startingCapital, setStartingCapital] = useState(userProfile?.startingCapital ?? 0);
  const [riskProfile, setRiskProfile] = useState(userProfile?.riskProfile || "moderate");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfileData({
      displayName,
      currency,
      timezone,
      startingCapital: Number(startingCapital) || 0,
      riskProfile: riskProfile as any,
    });
    soundFX.playSuccess();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-border shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/15 text-brand-500 border border-brand-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <span>{isVi ? "Cài Đặt Hệ Thống & Tùy Chọn Hồ Sơ" : "Platform Settings & Profile Preferences"}</span>
        </h1>
        <p className="text-xs text-txt-secondary mt-1 font-mono">
          {isVi
            ? "Cấu hình đơn vị tiền tệ cơ sở, múi giờ địa phương cho nhật ký và tham số vốn khởi điểm."
            : "Configure default base currency, local timezone for journal timestamps, and starting capital parameters."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <User className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "Hồ Sơ Nhà Giao Dịch" : "Trader Profile"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isVi ? "Tên Hiển Thị" : "Trader Display Name"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label={isVi ? "Email Tài Khoản" : "Account Email"}
              value={userProfile?.email || "trader@aitrading.os"}
              disabled
              helperText={isVi ? "Được quản lý thông qua Firebase Authentication." : "Managed through Firebase Authentication."}
            />
          </div>
        </div>

        {/* Financial & Timezone Preferences */}
        <div className="bento-card p-5 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Globe className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-txt-primary uppercase tracking-wider font-mono">
              {isVi ? "Cơ Sở Tài Chính & Múi Giờ" : "Financial Base & Timezone"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={isVi ? "Số Dư Vốn Ban Đầu ($)" : "Starting Account Balance ($)"}
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(Number(e.target.value))}
              required
            />

            <Select
              label={isVi ? "Tiền Tệ Cơ Sở" : "Base Currency"}
              value={currency}
              onChange={(e) => {
                soundFX.playSwitch();
                setCurrency(e.target.value);
              }}
              options={[
                { value: "USD", label: "USD ($) - US Dollar" },
                { value: "EUR", label: "EUR (€) - Euro" },
                { value: "GBP", label: "GBP (£) - British Pound" },
                { value: "JPY", label: "JPY (¥) - Japanese Yen" },
                { value: "AUD", label: "AUD ($) - Australian Dollar" },
              ]}
            />

            <Select
              label={isVi ? "Múi Giờ Làm Việc" : "User Timezone"}
              value={timezone}
              onChange={(e) => {
                soundFX.playSwitch();
                setTimezone(e.target.value);
              }}
              options={[
                { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+7)" },
                { value: "America/New_York", label: "America/New_York (EST)" },
                { value: "Europe/London", label: "Europe/London (BST)" },
                { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
              ]}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-xs text-gain font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {isVi ? "Đã lưu cài đặt thành công!" : "Preferences saved successfully!"}
            </span>
          ) : (
            <div />
          )}

          <Button variant="primary" size="md" type="submit">
            <Save className="w-4 h-4 mr-2" />
            {isVi ? "Lưu Cài Đặt Hồ Sơ" : "Save Profile Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
