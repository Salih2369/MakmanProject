import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AnalyticsChat() {
  const { token, user } = useAuth();

  const [model, setModel] = useState("openrouter/auto");
  const [models, setModels] = useState([
    { id: "openrouter/auto", name: "Auto (OpenRouter)" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
  ]);

  const [loadingModels, setLoadingModels] = useState(false);
  const [loading, setLoading] = useState(false);

  const [analyticsSummary, setAnalyticsSummary] = useState("");
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "هلا 👋 أنا مساعد مكمن. اسألني عن التحليلات المحفوظة عندك (مثل الازدحام، التنبيهات، الفروع، الأوقات…).",
    },
  ]);

  const listRef = useRef(null);

  const headers = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const res = await fetch(`${API_BASE}/api/ai/models`, {
        method: "GET",
        headers,
      });
      if (!res.ok) throw new Error("فشل جلب الموديلات");
      const data = await res.json();
      if (Array.isArray(data.models) && data.models.length) {
        setModels(data.models);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchAnalyticsSummary = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`${API_BASE}/api/analytics/summary`, {
        method: "GET",
        headers,
      });
      if (!res.ok) throw new Error("فشل جلب التحليلات");
      const data = await res.json();
      setAnalyticsSummary(data.summary || "");
    } catch (e) {
      console.warn(e);
      setAnalyticsSummary("");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        model,
        messages: nextMessages,
        analyticsSummary,
        userMeta: {
          name: user?.name || user?.username || "",
          email: user?.email || "",
        },
      };

      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل الرد من السيرفر");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "ما قدرت أطلع رد." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "صار خطأ أثناء إرسال سؤالك. تأكد أن السيرفر شغال وأن Endpoint /api/ai/chat موجود.\n\n" +
            (e?.message || ""),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Styles داخل الصفحة فقط (بدون لمس style.css)
  const wrap = {
    width: "min(1100px, 92vw)",
    margin: "0 auto",
    padding: "18px 0 40px",
  };

  const card = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
  };

  const headerBar = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const title = { fontSize: 18, fontWeight: 800, letterSpacing: 0.2 };

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  };

  const select = {
    border: "none",
    outline: "none",
    background: "transparent",
    color: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  };

  const body = {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 14,
    padding: 14,
  };

  const chatBox = {
    ...card,
    height: "calc(70vh)",
    minHeight: 460,
    display: "flex",
    flexDirection: "column",
  };

  const list = {
    padding: 14,
    overflow: "auto",
    flex: 1,
  };

  const bubbleBase = {
    maxWidth: "78%",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
  };

  const bubbleUser = {
    ...bubbleBase,
    marginRight: 0,
    marginLeft: "auto",
    background: "rgba(125, 183, 255, 0.16)",
  };

  const bubbleAI = {
    ...bubbleBase,
    marginLeft: 0,
    marginRight: "auto",
    background: "rgba(255,255,255,0.05)",
  };

  const composer = {
    padding: 14,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  };

  const textarea = {
    flex: 1,
    minHeight: 46,
    maxHeight: 140,
    resize: "none",
    borderRadius: 14,
    padding: "12px 12px",
    outline: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.15)",
    color: "inherit",
    lineHeight: 1.6,
  };

  const btn = (disabled) => ({
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: disabled
      ? "rgba(255,255,255,0.06)"
      : "rgba(125, 183, 255, 0.35)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 900,
    minWidth: 110,
  });

  const side = {
    ...card,
    padding: 14,
    height: "calc(70vh)",
    minHeight: 460,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const sideTitle = { fontSize: 14, fontWeight: 900, opacity: 0.9 };
  const sideBox = {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    flex: 1,
    overflow: "auto",
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    fontSize: 13,
  };

  const sideBtn = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    fontWeight: 900,
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={headerBar}>
          <div>
            <div style={title}>شات بوت التحليلات (Makman AI)</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              اسأل عن التحليلات المحفوظة — وأنا أرد لك بناءً عليها
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={pill}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Model:</span>
              <select
                style={select}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id}
                  </option>
                ))}
              </select>
            </div>

            <button style={sideBtn} onClick={fetchModels} disabled={loadingModels}>
              {loadingModels ? "جارِ الجلب..." : "تحديث الموديلات"}
            </button>
          </div>
        </div>

        <div style={body}>
          <div style={chatBox}>
            <div ref={listRef} style={list}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <div style={m.role === "user" ? bubbleUser : bubbleAI}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ marginBottom: 10 }}>
                  <div style={bubbleAI}>... جاري توليد الرد</div>
                </div>
              )}
            </div>

            <div style={composer}>
              <textarea
                style={textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="اكتب سؤالك عن التحليلات هنا… (Enter للإرسال)"
                disabled={loading}
              />
              <button
                style={btn(loading || !input.trim())}
                onClick={send}
                disabled={loading || !input.trim()}
              >
                إرسال
              </button>
            </div>
          </div>

          <div style={side}>
            <div style={sideTitle}>سياق التحليلات المحفوظة</div>

            <div style={sideBox}>
              {loadingAnalytics
                ? "جارِ تحميل التحليلات..."
                : analyticsSummary
                  ? analyticsSummary
                  : "ما وصلني ملخص تحليلات. إذا ما عندك endpoint /api/analytics/summary في السيرفر، سوّيه أو رجّع string جاهز."}
            </div>

            <button style={sideBtn} onClick={fetchAnalyticsSummary} disabled={loadingAnalytics}>
              {loadingAnalytics ? "جارِ التحديث..." : "تحديث التحليلات"}
            </button>

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              تلميح: <br />
              • "وش أكثر فرع فيه ازدحام اليوم؟" <br />
              • "كم تنبيه عالي صار هذا الأسبوع؟" <br />
              • "اعطني ملخص أداء الفروع"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
