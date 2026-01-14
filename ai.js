const express = require("express");
const router = express.Router();

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Missing env: ${name}`);
  return process.env[name];
}

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const apiKey = requireEnv("OPENROUTER_API_KEY");

    const { model, messages, analyticsSummary } = req.body || {};
    if (!model || !Array.isArray(messages)) {
      return res.status(400).json({ message: "model و messages مطلوبين" });
    }

    const system = {
      role: "system",
      content:
        "أنت مساعد تحليلات لنظام مكمن. وظيفتك: الإجابة على أسئلة العميل باستخدام سياق التحليلات المحفوظة فقط. " +
        "إذا ما يكفي السياق، اطلب توضيح أو قل إن البيانات غير متوفرة. " +
        "اكتب بالعربية وبشكل مختصر وواضح.\n\n" +
        (analyticsSummary ? `سياق التحليلات:\n${analyticsSummary}` : "سياق التحليلات: (غير متوفر)"),
    };

    const body = {
      model,
      messages: [system, ...messages],
      temperature: 0.4,
      max_tokens: 700,
    };

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        message: data?.error?.message || "OpenRouter request failed",
        details: data,
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
});

// GET /api/ai/models (اختياري)
router.get("/models", async (req, res) => {
  return res.json({
    models: [
      { id: "openrouter/auto", name: "Auto (OpenRouter)" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
    ],
  });
});

module.exports = router;
