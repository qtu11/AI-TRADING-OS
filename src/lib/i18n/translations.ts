import enMessages from "@/../messages/en.json";
import viMessages from "@/../messages/vi.json";

export type Language = "en" | "vi";

export const translations = {
  en: {
    // Navigation
    nav_dashboard: enMessages.nav.dashboard,
    nav_plan: enMessages.nav.plan,
    nav_calendar: enMessages.nav.calendar,
    nav_goals: enMessages.nav.goals,
    nav_trades: enMessages.nav.trades,
    nav_strategies: enMessages.nav.strategies,
    nav_risk: enMessages.nav.risk,
    nav_journal: enMessages.nav.journal,
    nav_psychology: enMessages.nav.psychology,
    nav_reviews: enMessages.nav.reviews,
    nav_ai_coach: enMessages.nav.ai_coach,
    nav_analytics: enMessages.nav.analytics,
    nav_market: enMessages.nav.market,
    nav_economic_calendar: enMessages.nav.economic_calendar,
    nav_reports: enMessages.nav.reports,
    nav_notifications: enMessages.nav.notifications,
    nav_integrations: enMessages.nav.integrations,
    nav_settings: enMessages.nav.settings,
    nav_logout: enMessages.nav.logout,

    // Dashboard Header
    dash_good_morning: enMessages.dashboard.good_morning,
    dash_market_status: enMessages.dashboard.market_status,
    dash_active_plan: enMessages.dashboard.active_plan,
    dash_ai_status: enMessages.dashboard.ai_status,
    dash_active: enMessages.dashboard.active,
    dash_ready: enMessages.dashboard.ready,

    // Session Clocks
    sess_sydney: enMessages.sessions.sydney,
    sess_tokyo: enMessages.sessions.tokyo,
    sess_london: enMessages.sessions.london,
    sess_newyork: enMessages.sessions.new_york,

    // KPI Cards
    kpi_balance: enMessages.dashboard.balance,
    kpi_equity: enMessages.dashboard.equity,
    kpi_winrate: enMessages.dashboard.win_rate,
    kpi_profit_factor: enMessages.dashboard.profit_factor,
    kpi_expectancy: enMessages.dashboard.expectancy,
    kpi_max_drawdown: enMessages.dashboard.max_drawdown,
    kpi_net_profit: enMessages.dashboard.today_pnl,
    kpi_total_trades: "Total Executions",

    // Common Buttons & Actions
    btn_new_trade: enMessages.actions.log_trade,
    btn_save: enMessages.actions.save,
    btn_cancel: enMessages.actions.cancel,
    btn_delete: enMessages.actions.delete,
    btn_edit: enMessages.actions.edit,
    btn_sync_mt5: enMessages.actions.sync_mt5,
    btn_generate_briefing: enMessages.actions.generate_briefing,
    btn_ask_ai: enMessages.actions.ask_copilot,
    btn_create_plan: enMessages.plan.create_button,

    // Language Toggle
    lang_switch: "Tiếng Việt",

    // Admin & User Roles
    role_admin: enMessages.auth.admin_badge,
    role_trader: enMessages.auth.trader_badge,
    admin_login_notice: "Admin mode authorized via environment credentials.",
  },
  vi: {
    // Navigation
    nav_dashboard: viMessages.nav.dashboard,
    nav_plan: viMessages.nav.plan,
    nav_calendar: viMessages.nav.calendar,
    nav_goals: viMessages.nav.goals,
    nav_trades: viMessages.nav.trades,
    nav_strategies: viMessages.nav.strategies,
    nav_risk: viMessages.nav.risk,
    nav_journal: viMessages.nav.journal,
    nav_psychology: viMessages.nav.psychology,
    nav_reviews: viMessages.nav.reviews,
    nav_ai_coach: viMessages.nav.ai_coach,
    nav_analytics: viMessages.nav.analytics,
    nav_market: viMessages.nav.market,
    nav_economic_calendar: viMessages.nav.economic_calendar,
    nav_reports: viMessages.nav.reports,
    nav_notifications: viMessages.nav.notifications,
    nav_integrations: viMessages.nav.integrations,
    nav_settings: viMessages.nav.settings,
    nav_logout: viMessages.nav.logout,

    // Dashboard Header
    dash_good_morning: viMessages.dashboard.good_morning,
    dash_market_status: viMessages.dashboard.market_status,
    dash_active_plan: viMessages.dashboard.active_plan,
    dash_ai_status: viMessages.dashboard.ai_status,
    dash_active: viMessages.dashboard.active,
    dash_ready: viMessages.dashboard.ready,

    // Session Clocks
    sess_sydney: viMessages.sessions.sydney,
    sess_tokyo: viMessages.sessions.tokyo,
    sess_london: viMessages.sessions.london,
    sess_newyork: viMessages.sessions.new_york,

    // KPI Cards
    kpi_balance: viMessages.dashboard.balance,
    kpi_equity: viMessages.dashboard.equity,
    kpi_winrate: viMessages.dashboard.win_rate,
    kpi_profit_factor: viMessages.dashboard.profit_factor,
    kpi_expectancy: viMessages.dashboard.expectancy,
    kpi_max_drawdown: viMessages.dashboard.max_drawdown,
    kpi_net_profit: viMessages.dashboard.today_pnl,
    kpi_total_trades: "Tổng Số Lệnh Thực Thi",

    // Common Buttons & Actions
    btn_new_trade: viMessages.actions.log_trade,
    btn_save: viMessages.actions.save,
    btn_cancel: viMessages.actions.cancel,
    btn_delete: viMessages.actions.delete,
    btn_edit: viMessages.actions.edit,
    btn_sync_mt5: viMessages.actions.sync_mt5,
    btn_generate_briefing: viMessages.actions.generate_briefing,
    btn_ask_ai: viMessages.actions.ask_copilot,
    btn_create_plan: viMessages.plan.create_button,

    // Language Toggle
    lang_switch: "English",

    // Admin & User Roles
    role_admin: viMessages.auth.admin_badge,
    role_trader: viMessages.auth.trader_badge,
    admin_login_notice: "Chế độ quản trị viên đã được xác thực qua thông tin biến môi trường.",
  },
};
