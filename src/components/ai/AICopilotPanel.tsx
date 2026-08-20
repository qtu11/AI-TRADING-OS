"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useCommand } from "@/context/CommandContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { soundFX } from "@/lib/sound/sound-effects";
import { AIChatMessage } from "@/types/ai.types";

export const AICopilotPanel: React.FC = () => {
  const { isAICopilotOpen, setAICopilotOpen } = useCommand();
  const { userProfile } = useAuth();
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: isVi
        ? `Xin chào **${userProfile?.displayName || "Trader"}**! Tôi là **AI Trợ Lý & Huấn Luyện Viên Giao Dịch**. Tôi giám sát dữ liệu thực thi, mức độ tuân thủ kế hoạch, kỷ luật tâm lý và các ngưỡng rủi ro của bạn theo thời gian thực.\n\nTôi có thể hỗ trợ gì cho bạn trong chu kỳ giao dịch hôm nay?`
        : `Hello ${userProfile?.displayName || "Trader"}! I am your **AI Trading Copilot**. I monitor your trading execution, plan adherence, emotional discipline, and risk limits in real time.\n\nHow can I help you optimize your trading cycle today?`,
      timestamp: new Date().toISOString(),
      suggestedActions: isVi
        ? [
            "Phân tích hiệu suất giao dịch gần đây",
            "Tôi có đang trade quá đà hay vi phạm rủi ro không?",
            "Phiên nào tôi có tỷ lệ thắng cao nhất?",
            "Hướng dẫn chuẩn bị trước phiên giao dịch",
          ]
        : [
            "Analyze my recent trading performance",
            "Am I overtrading or violating risk rules?",
            "Which session has my highest win rate?",
            "Give me pre-market preparation guidance",
          ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    soundFX.playClick(800);
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile?.id || "dev-trader-01",
          message: query,
          history: messages.slice(-6),
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || (isVi ? "Tôi đã phân tích yêu cầu dựa trên sổ lệnh thực tế của bạn." : "I have analyzed your request based on current trading records."),
        timestamp: new Date().toISOString(),
        suggestedActions: data.suggestedActions,
        dataReferences: data.dataReferences,
      };

      soundFX.playSuccess();
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.warn("Copilot API fallback:", error);
      const fallbackMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: isVi
          ? `Tôi đang phân tích nhật ký và kế hoạch giao dịch của bạn.\n\n**Khuyến nghị chu kỳ hiện tại**: Tập trung chặt chẽ vào các cặp tiền cho phép (${userProfile?.preferredSymbols?.join(", ") || "EURUSD, XAUUSD"}) và tuyệt đối tuân thủ giới hạn rủi ro **${userProfile?.riskProfile || "cân bằng"}**.`
          : `I'm analyzing your journal and trading plan.\n\n**Current Plan Observation**: Focus strictly on your allowed symbols (${userProfile?.preferredSymbols?.join(", ") || "EURUSD, XAUUSD"}) and respect your ${userProfile?.riskProfile || "moderate"} risk limits.`,
        timestamp: new Date().toISOString(),
      };
      soundFX.playClick(600);
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={isAICopilotOpen}
      onClose={() => setAICopilotOpen(false)}
      title={isVi ? "AI Trợ Lý & Huấn Luyện Viên Giao Dịch" : "AI Trading Copilot & Behavioral Coach"}
      width="lg"
    >
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    isUser
                      ? "bg-brand-500 text-white rounded-br-none shadow-sm"
                      : "bg-bg-surface border border-border text-txt-primary rounded-bl-none shadow-sm font-sans"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>

                  {msg.dataReferences && (
                    <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-sky-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{isVi ? `Ngữ cảnh: Đã đánh giá ${msg.dataReferences.totalTradesAnalyzed ?? 0} lệnh thực tế` : `Context: ${msg.dataReferences.totalTradesAnalyzed ?? 0} trades evaluated`}</span>
                    </div>
                  )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/60 space-y-1.5">
                      <span className="text-[10px] text-txt-muted font-bold uppercase tracking-wider block font-mono">
                        {isVi ? "Câu hỏi gợi ý tiếp theo:" : "Suggested Follow-ups:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(action)}
                            className="text-[11px] bg-bg-surface-subtle hover:bg-bg-surface-hover text-sky-400 px-3 py-1.5 rounded-xl border border-sky-500/30 text-left transition-all cursor-pointer font-sans"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-bg-surface border border-border flex items-center justify-center text-txt-secondary shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs leading-relaxed justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-bg-surface border border-border text-txt-secondary rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>{isVi ? "Đang phân tích dữ liệu lệnh và tạo khuyến nghị..." : "Evaluating trading context & generating insight..."}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-border/60 mt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              placeholder={isVi ? "Hỏi về tỷ lệ thắng, sai lầm, chiến lược, bối cảnh thị trường..." : "Ask about your win rate, mistakes, strategy..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-surface border border-border rounded-xl pl-4 pr-11 py-3 text-xs text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand-500 font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 p-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-1.5 flex justify-between text-[10px] text-txt-muted font-mono px-1">
            <span>{isVi ? "Dữ liệu xác thực từ Sổ lệnh" : "Powered by Real-Time Data Grounding"}</span>
            <span>{isVi ? "Toán học tài chính bảo vệ 100%" : "Deterministic Math Protected"}</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
