import React, { useEffect, useMemo, useRef, useState } from "react";
import { getToken } from "../js/auth";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const MODELS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini (سريع)" },
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 mini" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

function buildAnalyticsContext(analytics) {
  if (!analytics?.length) return "لا توجد تحليلات محفوظة حالياً.";
  const lines = analytics.slice(0, 30).map((a, i) => {
    const t = a?.title || a?.type || a?.event || "تحليل";
    const branch = a?.branchName || a?.branch || "—";
    const sev = a?.severity || a?.priority || "—";
    const ts = a?.createdAt || a?.time || a?.timestamp || "";
    const detail = a?.details || a?.message || a?.summary || "";
    return `${i + 1}) ${t} | فرع: ${branch} | أولوية: ${sev} | وقت: ${ts} | ${detail}`.trim();
  });
  return lines.join("\n");
}

export default function Chatbot() {
  const [model, setModel] = useState(MODELS[0].id);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "هلا! اسألني عن التحليلات المحفوظة (تنبيهات، ازدحام، نشاط غير اعتيادي…)، وبأجاوبك بناءً على البيانات الموجودة عندك.",
    },
  ]);

  const listRef = useRef(null);

  const analyticsContext = useMemo(() => buildAnalyticsContext(analytics), [analytics]);

  useEffect(() => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const tryFetch = async (url) => {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("bad");
      return res.json();
    };

    (async () => {
      try {
        const r = await tryFetch(`${API_BASE}/api/reports?limit=30`);
        const list = r?.reports || r?.data || r || [];
        if (Array.isArray(list) && list.length) {
          setAnalytics(list);
          return;
        }
      } catch (_) {}

      try {
        const a = await tryFetch(`${API_BASE}/api/alerts?limit=30`);
        const list = a?.alerts || a?.data || a || [];
        if (Array.isArray(list) && list.length) {
          setAnalytics(list);
          return;
        }
      } catch (_) {}

      try {
        const raw = localStorage.getItem("makman_analytics");
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list) && list.length) setAnalytics(list);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;

    setInput("");
    setBusy(true);

    const next = [...messages, { role: "user", content: q }];
    setMessages(next);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/openrouter/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "أنت مساعد لتحليلات منصة (مكمن). أجب بدقة وبالعربية وبناءً فقط على (سياق التحليلات) المرفق. " +
                "إذا لم تجد معلومة كافية في السياق، قل: (لا توجد بيانات كافية ضمن التحليلات المحفوظة). " +
                "لا تخترع أرقاماً أو فروعاً غير موجودة. " +
                "قدّم إجابة قصيرة ثم نقاط مختصرة.",
            },
            {
              role: "user",
              content: `سياق التحليلات:\n${analyticsContext}\n\nسؤال المستخدم: ${q}`,
            },
          ],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || data?.error || "تعذر الاتصال بالمساعد.";
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
        return;
      }

      const answer =
        data?.content ||
        data?.choices?.[0]?.message?.content ||
        data?.result?.content ||
        "تم.";

      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ حصل خطأ في الاتصال." }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ padding: "22px 28px", maxWidth: 1250, margin: "0 auto" }}>
      <div className="glass-card" style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>شات بوت التحليلات</div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              اسأل عن التحليلات المحفوظة لديك وسيتم الرد وفقاً لها.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ opacity: 0.8 }}>الموديل:</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} style={{ color: "#000" }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr" }}>
        <div
          ref={listRef}
          style={{
            maxHeight: "62vh",
            overflowY: "auto",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === "user" ? "flex-start" : "flex-end",
                maxWidth: "86%",
                background: m.role === "user" ? "rgba(255,255,255,0.06)" : "rgba(120,170,255,0.12)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: "12px 14px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          ))}

          {busy && (
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "86%",
                background: "rgba(120,170,255,0.10)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: "12px 14px",
                opacity: 0.85,
              }}
            >
              يكتب…
            </div>
          )}
        </div>

        <div
          style={{
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="اكتب سؤالك هنا…"
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "inherit",
              borderRadius: 14,
              padding: "12px 12px",
              outline: "none",
              lineHeight: 1.5,
            }}
          />

          <button
            onClick={send}
            disabled={busy || !input.trim()}
            style={{
              minWidth: 120,
              height: 44,
              borderRadius: 14,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy || !input.trim() ? 0.6 : 1,
            }}
            className="primary-btn"
          >
            إرسال
          </button>
        </div>
      </div>

      <div style={{ opacity: 0.7, marginTop: 10, fontSize: 13 }}>
        * إذا APIs عندك مختلفة للتقارير/التنبيهات، فقط عدّل روابط الجلب في الصفحة.
      </div>
    </div>
  );
}
