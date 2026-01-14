const BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || "http://localhost:5000";

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = {};
  let text = "";
  try {
    text = await res.text();
    data = JSON.parse(text);
  } catch (e) {
    // If it's not JSON, it might be HTML from a 404 or error
    if (!res.ok) {
      const snippet = text.slice(0, 100).replace(/<[^>]+>/g, "").trim();
      throw new Error(`خطأ في الخادم (${res.status}): ${snippet || "استجابة غير صالحة"}`);
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "حدث خطأ غير متوقع");
  }
  return data;
}

export const apiBase = BASE;
