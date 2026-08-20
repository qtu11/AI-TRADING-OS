import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";
import { UserProfile } from "@/types/user.types";
import { Trade, TradeFilterOptions } from "@/types/trade.types";
import { TradingPlan, DailyTask } from "@/types/plan.types";
import { DailyJournal } from "@/types/journal.types";
import { PsychologyEntry } from "@/types/psychology.types";
import { Strategy } from "@/types/strategy.types";
import { Goal } from "@/types/notification.types";
import { AIReviewResponse } from "@/types/ai.types";
import { AppNotification, AuditLogEntry } from "@/types/notification.types";
import { MT5AccountConnection } from "@/types/mt5.types";

// -------------------------------------------------------------
// PERSISTENT STORAGE HELPER (LocalStorage + In-Memory + Realtime Bus)
// -------------------------------------------------------------
function readStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage write error:", e);
  }
}

// In-Memory fallback store with Realtime Event Bus & Persistent Local Sync
const memoryStore: {
  trades: Record<string, Trade[]>;
  plans: Record<string, TradingPlan[]>;
  tasks: Record<string, DailyTask[]>;
  journals: Record<string, Record<string, DailyJournal>>;
  milestoneJournals: Record<string, Record<string, any>>;
  psychology: Record<string, Record<string, PsychologyEntry>>;
  strategies: Record<string, Strategy[]>;
  goals: Record<string, Goal[]>;
  notifications: Record<string, AppNotification[]>;
  auditLogs: Record<string, AuditLogEntry[]>;
  tradeListeners: Record<string, Array<(trades: Trade[]) => void>>;
  planListeners: Record<string, Array<(plan: TradingPlan | null) => void>>;
} = {
  trades: {},
  plans: {},
  tasks: {},
  journals: {},
  milestoneJournals: {},
  psychology: {},
  strategies: {},
  goals: {},
  notifications: {},
  auditLogs: {},
  tradeListeners: {},
  planListeners: {},
};

function ensureInitialized(userId: string) {
  if (!memoryStore.trades[userId]) {
    memoryStore.trades[userId] = readStorage<Trade[]>(`ai_trading_os_trades_${userId}`, []);
  }
  if (!memoryStore.plans[userId]) {
    memoryStore.plans[userId] = readStorage<TradingPlan[]>(`ai_trading_os_plans_${userId}`, []);
  }
  if (!memoryStore.tasks[userId]) {
    memoryStore.tasks[userId] = readStorage<DailyTask[]>(`ai_trading_os_tasks_${userId}`, []);
  }
  if (!memoryStore.journals[userId]) {
    memoryStore.journals[userId] = readStorage<Record<string, DailyJournal>>(`ai_trading_os_journals_${userId}`, {});
  }
  if (!memoryStore.milestoneJournals[userId]) {
    memoryStore.milestoneJournals[userId] = readStorage<Record<string, any>>(`ai_trading_os_milestone_journals_${userId}`, {});
  }
  if (!memoryStore.psychology[userId]) {
    memoryStore.psychology[userId] = readStorage<Record<string, PsychologyEntry>>(`ai_trading_os_psych_${userId}`, {});
  }
  if (!memoryStore.strategies[userId]) {
    memoryStore.strategies[userId] = readStorage<Strategy[]>(`ai_trading_os_strategies_${userId}`, []);
  }
  if (!memoryStore.goals[userId]) {
    memoryStore.goals[userId] = readStorage<Goal[]>(`ai_trading_os_goals_${userId}`, []);
  }
  if (!memoryStore.notifications[userId]) {
    memoryStore.notifications[userId] = readStorage<AppNotification[]>(`ai_trading_os_notifs_${userId}`, []);
  }
  if (!memoryStore.auditLogs[userId]) {
    memoryStore.auditLogs[userId] = readStorage<AuditLogEntry[]>(`ai_trading_os_audit_${userId}`, []);
  }
}

function notifyTradeListeners(userId: string) {
  const listeners = memoryStore.tradeListeners[userId] || [];
  const currentTrades = memoryStore.trades[userId] || [];
  listeners.forEach((cb) => {
    try {
      cb([...currentTrades]);
    } catch (e) {
      console.warn("Trade listener callback error:", e);
    }
  });
}

function notifyPlanListeners(userId: string) {
  const listeners = memoryStore.planListeners[userId] || [];
  const userPlans = memoryStore.plans[userId] || [];
  const activePlan = userPlans.find((p) => p.status === "ACTIVE") || userPlans[0] || null;
  listeners.forEach((cb) => {
    try {
      cb(activePlan);
    } catch (e) {
      console.warn("Plan listener callback error:", e);
    }
  });
}

// Safe DB Check
function getDb() {
  return db || null;
}

// -------------------------------------------------------------
// USER PROFILE
// -------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const firestore = getDb();
  if (!firestore) {
    return readStorage<UserProfile | null>(`ai_trading_os_profile_${userId}`, null);
  }

  try {
    const userRef = doc(firestore, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return readStorage<UserProfile | null>(`ai_trading_os_profile_${userId}`, null);
    }
    const profile = snap.data() as UserProfile;
    writeStorage(`ai_trading_os_profile_${userId}`, profile);
    return profile;
  } catch (err) {
    console.warn("getUserProfile Firestore warning:", err);
    return readStorage<UserProfile | null>(`ai_trading_os_profile_${userId}`, null);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  writeStorage(`ai_trading_os_profile_${profile.id}`, profile);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const userRef = doc(firestore, "users", profile.id);
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("saveUserProfile Firestore warning:", err);
  }
}

// -------------------------------------------------------------
// TRADES
// -------------------------------------------------------------
export async function getUserTrades(
  userId: string,
  options?: TradeFilterOptions
): Promise<Trade[]> {
  ensureInitialized(userId);
  const firestore = getDb();

  if (!firestore) {
    return memoryStore.trades[userId] || [];
  }

  try {
    const tradesRef = collection(firestore, "users", userId, "trades");
    let q = query(tradesRef, orderBy("openTime", "desc"));

    if (options?.symbol) {
      q = query(q, where("symbol", "==", options.symbol));
    }
    if (options?.status) {
      q = query(q, where("status", "==", options.status));
    }
    if (options?.pageSize) {
      q = query(q, limit(options.pageSize));
    }

    const snap = await getDocs(q);
    const result = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade));
    if (result.length > 0) {
      memoryStore.trades[userId] = result;
      writeStorage(`ai_trading_os_trades_${userId}`, result);
    }
    return memoryStore.trades[userId] || [];
  } catch (err) {
    console.warn("getUserTrades fallback to persistent storage:", err);
    return memoryStore.trades[userId] || [];
  }
}

export async function saveTrade(arg1: string | Trade, arg2?: Trade): Promise<string> {
  let userId: string;
  let trade: Trade;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    trade = arg2;
  } else {
    trade = arg1 as Trade;
    userId = trade.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const tradeId = trade.id || `trade_${Date.now()}`;
  const record: Trade = {
    ...trade,
    id: tradeId,
    userId,
    updatedAt: new Date().toISOString(),
  };

  const current = memoryStore.trades[userId] || [];
  const idx = current.findIndex((t) => t.id === tradeId);
  if (idx >= 0) current[idx] = record;
  else current.unshift(record);

  memoryStore.trades[userId] = current;
  writeStorage(`ai_trading_os_trades_${userId}`, current);
  notifyTradeListeners(userId);

  const firestore = getDb();
  if (firestore) {
    try {
      const tradeRef = doc(firestore, "users", userId, "trades", tradeId);
      await setDoc(tradeRef, record, { merge: true });
    } catch (err) {
      console.warn("saveTrade Firestore sync warning:", err);
    }
  }

  return tradeId;
}

export async function deleteTrade(userId: string, tradeId: string): Promise<void> {
  ensureInitialized(userId);
  memoryStore.trades[userId] = (memoryStore.trades[userId] || []).filter((t) => t.id !== tradeId);
  writeStorage(`ai_trading_os_trades_${userId}`, memoryStore.trades[userId]);
  notifyTradeListeners(userId);

  const firestore = getDb();
  if (firestore) {
    try {
      const tradeRef = doc(firestore, "users", userId, "trades", tradeId);
      await deleteDoc(tradeRef);
    } catch (err) {
      console.warn("deleteTrade Firestore warning:", err);
    }
  }
}

export function subscribeToTrades(
  userId: string,
  callback: (trades: Trade[]) => void
): Unsubscribe {
  ensureInitialized(userId);

  if (!memoryStore.tradeListeners[userId]) memoryStore.tradeListeners[userId] = [];
  memoryStore.tradeListeners[userId].push(callback);

  // Send initial data immediately
  callback(memoryStore.trades[userId] || []);

  const firestore = getDb();
  if (!firestore) {
    return () => {
      memoryStore.tradeListeners[userId] = (memoryStore.tradeListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  }

  try {
    const tradesRef = collection(firestore, "users", userId, "trades");
    const q = query(tradesRef, orderBy("openTime", "desc"), limit(100));

    const unsubFirestore = onSnapshot(q, (snap) => {
      const trades = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade));
      if (trades.length > 0) {
        memoryStore.trades[userId] = trades;
        writeStorage(`ai_trading_os_trades_${userId}`, trades);
      }
      callback(memoryStore.trades[userId] || []);
    }, (err) => {
      console.warn("subscribeToTrades Firestore snapshot warning:", err);
      callback(memoryStore.trades[userId] || []);
    });

    return () => {
      unsubFirestore();
      memoryStore.tradeListeners[userId] = (memoryStore.tradeListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  } catch (err) {
    return () => {
      memoryStore.tradeListeners[userId] = (memoryStore.tradeListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  }
}

// -------------------------------------------------------------
// TRADING PLANS
// -------------------------------------------------------------
export async function getActiveTradingPlan(userId: string): Promise<TradingPlan | null> {
  ensureInitialized(userId);
  const userPlans = memoryStore.plans[userId] || [];
  const activePlan = userPlans.find((p) => p.status === "ACTIVE") || userPlans[0] || null;

  const firestore = getDb();
  if (!firestore) return activePlan;

  try {
    const plansRef = collection(firestore, "users", userId, "tradingPlans");
    const q = query(plansRef, where("status", "==", "ACTIVE"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return activePlan;
    const plan = { id: snap.docs[0].id, ...snap.docs[0].data() } as TradingPlan;
    memoryStore.plans[userId] = [plan];
    writeStorage(`ai_trading_os_plans_${userId}`, [plan]);
    return plan;
  } catch (err) {
    console.warn("getActiveTradingPlan Firestore warning:", err);
    return activePlan;
  }
}

export async function saveTradingPlan(arg1: string | TradingPlan, arg2?: TradingPlan): Promise<string> {
  let userId: string;
  let plan: TradingPlan;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    plan = arg2;
  } else {
    plan = arg1 as TradingPlan;
    userId = plan.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const planId = plan.id || `plan_${Date.now()}`;
  const record: TradingPlan = {
    ...plan,
    id: planId,
    userId,
    updatedAt: new Date().toISOString(),
  };

  const current = memoryStore.plans[userId] || [];
  const idx = current.findIndex((p) => p.id === planId);
  if (idx >= 0) current[idx] = record;
  else current.unshift(record);

  memoryStore.plans[userId] = current;
  writeStorage(`ai_trading_os_plans_${userId}`, current);
  notifyPlanListeners(userId);

  const firestore = getDb();
  if (firestore) {
    try {
      const planRef = doc(firestore, "users", userId, "tradingPlans", planId);
      await setDoc(planRef, record, { merge: true });
    } catch (err) {
      console.warn("saveTradingPlan Firestore sync warning:", err);
    }
  }

  return planId;
}

export function subscribeToActivePlan(
  userId: string,
  callback: (plan: TradingPlan | null) => void
): Unsubscribe {
  ensureInitialized(userId);

  if (!memoryStore.planListeners[userId]) memoryStore.planListeners[userId] = [];
  memoryStore.planListeners[userId].push(callback);

  const userPlans = memoryStore.plans[userId] || [];
  callback(userPlans.find((p) => p.status === "ACTIVE") || userPlans[0] || null);

  const firestore = getDb();
  if (!firestore) {
    return () => {
      memoryStore.planListeners[userId] = (memoryStore.planListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  }

  try {
    const plansRef = collection(firestore, "users", userId, "tradingPlans");
    const q = query(plansRef, where("status", "==", "ACTIVE"), limit(1));

    const unsubFirestore = onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
      } else {
        const plan = { id: snap.docs[0].id, ...snap.docs[0].data() } as TradingPlan;
        memoryStore.plans[userId] = [plan];
        writeStorage(`ai_trading_os_plans_${userId}`, [plan]);
        callback(plan);
      }
    }, (err) => {
      console.warn("subscribeToActivePlan snapshot warning:", err);
      const current = memoryStore.plans[userId] || [];
      callback(current.find((p) => p.status === "ACTIVE") || current[0] || null);
    });

    return () => {
      unsubFirestore();
      memoryStore.planListeners[userId] = (memoryStore.planListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  } catch (err) {
    return () => {
      memoryStore.planListeners[userId] = (memoryStore.planListeners[userId] || []).filter(
        (cb) => cb !== callback
      );
    };
  }
}

// -------------------------------------------------------------
// DAILY TASKS
// -------------------------------------------------------------
export async function getDailyTasks(userId: string, date: string): Promise<DailyTask[]> {
  ensureInitialized(userId);
  const local = (memoryStore.tasks[userId] || []).filter((t) => t.date === date);

  const firestore = getDb();
  if (!firestore) return local;

  try {
    const tasksRef = collection(firestore, "users", userId, "dailyTasks");
    const q = query(tasksRef, where("date", "==", date));
    const snap = await getDocs(q);
    const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyTask));
    if (remote.length > 0) {
      memoryStore.tasks[userId] = remote;
      writeStorage(`ai_trading_os_tasks_${userId}`, remote);
      return remote;
    }
    return local;
  } catch (err) {
    return local;
  }
}

export async function saveDailyTask(arg1: string | DailyTask, arg2?: DailyTask): Promise<void> {
  let userId: string;
  let task: DailyTask;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    task = arg2;
  } else {
    task = arg1 as DailyTask;
    userId = "dev-trader-01";
  }

  ensureInitialized(userId);
  const taskId = task.id || `task_${Date.now()}`;
  const record = { ...task, id: taskId };

  const current = memoryStore.tasks[userId] || [];
  const idx = current.findIndex((t) => t.id === taskId);
  if (idx >= 0) current[idx] = record;
  else current.push(record);

  memoryStore.tasks[userId] = current;
  writeStorage(`ai_trading_os_tasks_${userId}`, current);

  const firestore = getDb();
  if (firestore) {
    try {
      const taskRef = doc(firestore, "users", userId, "dailyTasks", taskId);
      await setDoc(taskRef, record, { merge: true });
    } catch (err) {
      console.warn("saveDailyTask Firestore warning:", err);
    }
  }
}

// -------------------------------------------------------------
// DAILY JOURNAL
// -------------------------------------------------------------
export async function getDailyJournal(userId: string, date: string): Promise<DailyJournal | null> {
  ensureInitialized(userId);
  const local = memoryStore.journals[userId]?.[date] || null;

  const firestore = getDb();
  if (!firestore) return local;

  try {
    const journalRef = doc(firestore, "users", userId, "journals", date);
    const snap = await getDoc(journalRef);
    if (!snap.exists()) return local;
    const remote = snap.data() as DailyJournal;
    if (!memoryStore.journals[userId]) memoryStore.journals[userId] = {};
    memoryStore.journals[userId][date] = remote;
    writeStorage(`ai_trading_os_journals_${userId}`, memoryStore.journals[userId]);
    return remote;
  } catch (err) {
    return local;
  }
}

export async function getAllJournals(userId: string): Promise<DailyJournal[]> {
  ensureInitialized(userId);
  return Object.values(memoryStore.journals[userId] || {});
}

export async function saveDailyJournal(arg1: string | DailyJournal, arg2?: DailyJournal): Promise<void> {
  let userId: string;
  let journal: DailyJournal;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    journal = arg2;
  } else {
    journal = arg1 as DailyJournal;
    userId = journal.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const record = { ...journal, userId, updatedAt: new Date().toISOString() };
  if (!memoryStore.journals[userId]) memoryStore.journals[userId] = {};
  memoryStore.journals[userId][journal.date] = record;
  writeStorage(`ai_trading_os_journals_${userId}`, memoryStore.journals[userId]);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const journalRef = doc(firestore, "users", userId, "journals", journal.date);
    await setDoc(journalRef, record, { merge: true });
  } catch (err) {
    console.warn("saveDailyJournal Firestore warning:", err);
  }
}

// -------------------------------------------------------------
// MILESTONE JOURNALS
// -------------------------------------------------------------
export async function getMilestoneJournal(userId: string, milestoneId: string): Promise<any | null> {
  ensureInitialized(userId);
  const local = memoryStore.milestoneJournals[userId]?.[milestoneId] || null;

  const firestore = getDb();
  if (!firestore) return local;

  try {
    const journalRef = doc(firestore, "users", userId, "milestoneJournals", milestoneId);
    const snap = await getDoc(journalRef);
    if (!snap.exists()) return local;
    const remote = snap.data();
    if (!memoryStore.milestoneJournals[userId]) memoryStore.milestoneJournals[userId] = {};
    memoryStore.milestoneJournals[userId][milestoneId] = remote;
    writeStorage(`ai_trading_os_milestone_journals_${userId}`, memoryStore.milestoneJournals[userId]);
    return remote;
  } catch (err) {
    return local;
  }
}

export async function saveMilestoneJournal(userId: string, journal: any): Promise<void> {
  ensureInitialized(userId);
  const record = { ...journal, updatedAt: new Date().toISOString() };
  if (!memoryStore.milestoneJournals[userId]) memoryStore.milestoneJournals[userId] = {};
  memoryStore.milestoneJournals[userId][journal.milestoneId] = record;
  writeStorage(`ai_trading_os_milestone_journals_${userId}`, memoryStore.milestoneJournals[userId]);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const journalRef = doc(firestore, "users", userId, "milestoneJournals", journal.milestoneId);
    await setDoc(journalRef, record, { merge: true });
  } catch (err) {
    console.warn("saveMilestoneJournal Firestore warning:", err);
  }
}

// -------------------------------------------------------------
// PSYCHOLOGY ENTRIES
// -------------------------------------------------------------
export async function getPsychologyEntry(userId: string, date: string): Promise<PsychologyEntry | null> {
  ensureInitialized(userId);
  const local = memoryStore.psychology[userId]?.[date] || null;

  const firestore = getDb();
  if (!firestore) return local;

  try {
    const entryRef = doc(firestore, "users", userId, "psychology", date);
    const snap = await getDoc(entryRef);
    if (!snap.exists()) return local;
    const remote = snap.data() as PsychologyEntry;
    if (!memoryStore.psychology[userId]) memoryStore.psychology[userId] = {};
    memoryStore.psychology[userId][date] = remote;
    writeStorage(`ai_trading_os_psych_${userId}`, memoryStore.psychology[userId]);
    return remote;
  } catch (err) {
    return local;
  }
}

export async function getPsychologyEntries(userId: string): Promise<PsychologyEntry[]> {
  ensureInitialized(userId);
  return Object.values(memoryStore.psychology[userId] || {});
}

export async function savePsychologyEntry(arg1: string | PsychologyEntry, arg2?: PsychologyEntry): Promise<void> {
  let userId: string;
  let entry: PsychologyEntry;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    entry = arg2;
  } else {
    entry = arg1 as PsychologyEntry;
    userId = entry.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const record = { ...entry, userId, updatedAt: new Date().toISOString() };
  if (!memoryStore.psychology[userId]) memoryStore.psychology[userId] = {};
  memoryStore.psychology[userId][entry.date] = record;
  writeStorage(`ai_trading_os_psych_${userId}`, memoryStore.psychology[userId]);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const entryRef = doc(firestore, "users", userId, "psychology", entry.date);
    await setDoc(entryRef, record, { merge: true });
  } catch (err) {
    console.warn("savePsychologyEntry Firestore warning:", err);
  }
}

// -------------------------------------------------------------
// STRATEGIES
// -------------------------------------------------------------
export async function getUserStrategies(userId: string): Promise<Strategy[]> {
  ensureInitialized(userId);
  return memoryStore.strategies[userId] || [];
}

export async function saveStrategy(arg1: string | Strategy, arg2?: Strategy): Promise<string> {
  let userId: string;
  let strategy: Strategy;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    strategy = arg2;
  } else {
    strategy = arg1 as Strategy;
    userId = strategy.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const id = strategy.id || `strat_${Date.now()}`;
  const record = { ...strategy, id, userId, updatedAt: new Date().toISOString() };

  const current = memoryStore.strategies[userId] || [];
  const idx = current.findIndex((s) => s.id === id);
  if (idx >= 0) current[idx] = record;
  else current.unshift(record);

  memoryStore.strategies[userId] = current;
  writeStorage(`ai_trading_os_strategies_${userId}`, current);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "strategies", id);
      await setDoc(ref, record, { merge: true });
    } catch (err) {
      console.warn("saveStrategy Firestore warning:", err);
    }
  }
  return id;
}

export async function deleteStrategy(userId: string, strategyId: string): Promise<void> {
  ensureInitialized(userId);
  memoryStore.strategies[userId] = (memoryStore.strategies[userId] || []).filter((s) => s.id !== strategyId);
  writeStorage(`ai_trading_os_strategies_${userId}`, memoryStore.strategies[userId]);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "strategies", strategyId);
      await deleteDoc(ref);
    } catch (err) {
      console.warn("deleteStrategy Firestore warning:", err);
    }
  }
}

// -------------------------------------------------------------
// GOALS & REVIEWS
// -------------------------------------------------------------
export async function getUserGoals(userId: string): Promise<Goal[]> {
  ensureInitialized(userId);
  return memoryStore.goals[userId] || [];
}

export async function saveGoal(arg1: string | Goal, arg2?: Goal): Promise<string> {
  let userId: string;
  let goal: Goal;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    goal = arg2;
  } else {
    goal = arg1 as Goal;
    userId = goal.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const id = goal.id || `goal_${Date.now()}`;
  const record = { ...goal, id, userId, updatedAt: new Date().toISOString() };

  const current = memoryStore.goals[userId] || [];
  const idx = current.findIndex((g) => g.id === id);
  if (idx >= 0) current[idx] = record;
  else current.unshift(record);

  memoryStore.goals[userId] = current;
  writeStorage(`ai_trading_os_goals_${userId}`, current);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "goals", id);
      await setDoc(ref, record, { merge: true });
    } catch (err) {
      console.warn("saveGoal Firestore warning:", err);
    }
  }
  return id;
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  ensureInitialized(userId);
  memoryStore.goals[userId] = (memoryStore.goals[userId] || []).filter((g) => g.id !== goalId);
  writeStorage(`ai_trading_os_goals_${userId}`, memoryStore.goals[userId]);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "goals", goalId);
      await deleteDoc(ref);
    } catch (err) {
      console.warn("deleteGoal Firestore warning:", err);
    }
  }
}

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  currentValue: number,
  isCompleted?: boolean
): Promise<void> {
  ensureInitialized(userId);
  const current = memoryStore.goals[userId] || [];
  const target = current.find((g) => g.id === goalId);
  if (target) {
    target.currentValue = currentValue;
    if (isCompleted !== undefined) target.isCompleted = isCompleted;
    target.updatedAt = new Date().toISOString();
    writeStorage(`ai_trading_os_goals_${userId}`, current);
  }

  const firestore = getDb();
  if (!firestore) return;

  try {
    const ref = doc(firestore, "users", userId, "goals", goalId);
    await updateDoc(ref, {
      currentValue,
      isCompleted: isCompleted !== undefined ? isCompleted : undefined,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("updateGoalProgress Firestore warning:", err);
  }
}

export async function getUserReviews(userId: string): Promise<AIReviewResponse[]> {
  const firestore = getDb();
  if (!firestore) return [];

  try {
    const ref = collection(firestore, "users", userId, "reviews");
    const snap = await getDocs(ref);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as AIReviewResponse));
  } catch (err) {
    return [];
  }
}

export async function saveReview(arg1: string | any, arg2?: any): Promise<string> {
  let userId: string;
  let review: any;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    review = arg2;
  } else {
    review = arg1;
    userId = review?.userId || "dev-trader-01";
  }

  const firestore = getDb();
  const id = review.id || `review_${Date.now()}`;
  if (!firestore) return id;

  try {
    const ref = doc(firestore, "users", userId, "reviews", id);
    await setDoc(ref, { ...review, id, userId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("saveReview Firestore warning:", err);
  }
  return id;
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  ensureInitialized(userId);
  return memoryStore.notifications[userId] || [];
}

export async function saveNotification(arg1: string | AppNotification, arg2?: AppNotification): Promise<string> {
  let userId: string;
  let notif: AppNotification;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    notif = arg2;
  } else {
    notif = arg1 as AppNotification;
    userId = notif.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const id = notif.id || `notif_${Date.now()}`;
  const record = { ...notif, id, userId };

  const current = memoryStore.notifications[userId] || [];
  current.unshift(record);
  memoryStore.notifications[userId] = current;
  writeStorage(`ai_trading_os_notifs_${userId}`, current);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "notifications", id);
      await setDoc(ref, record, { merge: true });
    } catch (err) {
      console.warn("saveNotification Firestore warning:", err);
    }
  }
  return id;
}

export async function markNotificationAsRead(userId: string, notifId: string): Promise<void> {
  ensureInitialized(userId);
  const current = memoryStore.notifications[userId] || [];
  const target = current.find((n) => n.id === notifId);
  if (target) {
    target.read = true;
    writeStorage(`ai_trading_os_notifs_${userId}`, current);
  }

  const firestore = getDb();
  if (!firestore) return;

  try {
    const ref = doc(firestore, "users", userId, "notifications", notifId);
    await updateDoc(ref, { read: true });
  } catch (err) {
    console.warn("markNotificationAsRead Firestore warning:", err);
  }
}

export async function deleteNotification(userId: string, notifId: string): Promise<void> {
  ensureInitialized(userId);
  memoryStore.notifications[userId] = (memoryStore.notifications[userId] || []).filter((n) => n.id !== notifId);
  writeStorage(`ai_trading_os_notifs_${userId}`, memoryStore.notifications[userId]);

  const firestore = getDb();
  if (firestore) {
    try {
      const ref = doc(firestore, "users", userId, "notifications", notifId);
      await deleteDoc(ref);
    } catch (err) {
      console.warn("deleteNotification Firestore warning:", err);
    }
  }
}

export async function clearAllNotifications(userId: string): Promise<void> {
  ensureInitialized(userId);
  memoryStore.notifications[userId] = [];
  writeStorage(`ai_trading_os_notifs_${userId}`, []);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const ref = collection(firestore, "users", userId, "notifications");
    const snap = await getDocs(ref);
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
  } catch (err) {
    console.warn("clearAllNotifications Firestore warning:", err);
  }
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
export async function addAuditLog(
  arg1: string | any,
  arg2?: any
): Promise<void> {
  let userId: string;
  let logData: any;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    logData = arg2;
  } else {
    logData = arg1;
    userId = logData?.userId || "dev-trader-01";
  }

  ensureInitialized(userId);
  const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: AuditLogEntry = {
    ...logData,
    id: logId,
    userId,
    timestamp: new Date().toISOString(),
  };

  const current = memoryStore.auditLogs[userId] || [];
  current.unshift(record);
  memoryStore.auditLogs[userId] = current.slice(0, 100);
  writeStorage(`ai_trading_os_audit_${userId}`, memoryStore.auditLogs[userId]);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const ref = doc(firestore, "users", userId, "auditLogs", logId);
    await setDoc(ref, record);
  } catch (err) {
    console.warn("addAuditLog Firestore warning:", err);
  }
}

export async function recordAuditLog(
  arg1: any,
  arg2?: string,
  arg3?: string,
  arg4?: Record<string, any>
): Promise<void> {
  if (typeof arg1 === "string" && arg2 && arg3) {
    await addAuditLog(arg1, {
      action: arg2,
      details: arg3,
      metadata: arg4,
    });
  } else if (typeof arg1 === "object") {
    const userId = arg1.userId || "dev-trader-01";
    await addAuditLog(userId, {
      action: arg1.action || "SYSTEM_EVENT",
      details: typeof arg1.details === "string" ? arg1.details : JSON.stringify(arg1.details || {}),
      metadata: arg1.metadata || arg1.details,
    });
  }
}

// -------------------------------------------------------------
// MT5 INTEGRATIONS
// -------------------------------------------------------------
export async function getMT5Connection(userId: string): Promise<MT5AccountConnection | null> {
  const local = readStorage<MT5AccountConnection | null>(`ai_trading_os_mt5_${userId}`, null);
  const firestore = getDb();
  if (!firestore) return local;

  try {
    const ref = doc(firestore, "users", userId, "integrations", "mt5");
    const snap = await getDoc(ref);
    if (!snap.exists()) return local;
    const remote = snap.data() as MT5AccountConnection;
    writeStorage(`ai_trading_os_mt5_${userId}`, remote);
    return remote;
  } catch (err) {
    return local;
  }
}

export async function saveMT5Connection(arg1: string | MT5AccountConnection, arg2?: MT5AccountConnection): Promise<void> {
  let userId: string;
  let conn: MT5AccountConnection;

  if (typeof arg1 === "string" && arg2) {
    userId = arg1;
    conn = arg2;
  } else {
    conn = arg1 as MT5AccountConnection;
    userId = conn.userId || "dev-trader-01";
  }

  writeStorage(`ai_trading_os_mt5_${userId}`, conn);

  const firestore = getDb();
  if (!firestore) return;

  try {
    const ref = doc(firestore, "users", userId, "integrations", "mt5");
    await setDoc(ref, {
      ...conn,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("saveMT5Connection Firestore warning:", err);
  }
}
