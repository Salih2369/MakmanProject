const express = require("express");

const router = express.Router();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function pickAssistantContent(json) {
  return (
    json?.choices?.[0]?.message?.content ||
    json?.choices?.[0]?.delta?.content ||
    json?.content ||
    ""
  );
}

router.post("/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: "OPENROUTER_API_KEY غير موجود في السيرفر (.env).",
      });
    }

    const { model, messages } = req.body || {};
    if (!model || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "بيانات الطلب غير صحيحة." });
    }

    if (messages.length > 20) {
      return res.status(400).json({ message: "عدد الرسائل كبير." });
    }

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "Makman",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        top_p: 0.9,
      }),
    });

    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        "OpenRouter: فشل الطلب.";
      return res.status(resp.status).json({ message: errMsg, raw: json });
    }

    const content = pickAssistantContent(json);
    return res.json({ content, raw: json });
  } catch (e) {
    console.error("OpenRouter API Error:", e);
    return res.status(500).json({ message: "خطأ داخلي في الشات.", error: String(e?.message || e) });
  }
});

module.exports = router;
