export type NotificationType = 
  | "RISK_LIMIT_APPROACHING" 
  | "RISK_LIMIT_BREACHED" 
  | "TRADE_SYNC_SUCCESS" 
  | "TRADE_SYNC_FAILED" 
  | "PLAN_MILESTONE_REACHED" 
  | "JOURNAL_REMINDER" 
  | "SESSION_START" 
  | "HIGH_IMPACT_NEWS";

export type NotificationSeverity = "info" | "warning" | "error" | "success";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType?: "trade" | "plan" | "journal" | "integration" | "setting" | "system";
  entityId?: string;
  details: Record<string, any> | string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: "FINANCIAL" | "PERFORMANCE" | "DISCIPLINE" | "PSYCHOLOGY" | "LEARNING";
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  unit: "%" | "$" | "trades" | "days" | "points";
  deadline?: string;
  progressPercent: number; // 0 - 100
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
