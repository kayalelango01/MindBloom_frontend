/* =========================================
   MindBloom – api.js
   Token Authentication — zero CSRF issues
========================================= */

const BASE = "https://mindbloom-ai-backend.onrender.com/api";

// ─────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem("mb_token");
}

function saveToken(token) {
  localStorage.setItem("mb_token", token);
}

function clearToken() {
  localStorage.removeItem("mb_token");
}

// ─────────────────────────────────────────────
// BASE FETCH WRAPPERS
// ─────────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function get(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers: authHeaders(),
    });
    // ✅ FIX: DRF list endpoints return a plain JSON array, not an object.
    // We must check for array BEFORE calling res.json() and spreading,
    // because spreading an array into an object loses all the data.
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }

    if (Array.isArray(data)) {
      // attach _status on the array itself so callers can check it
      data._status = res.status;
      return data;
    }
    return { ...data, _status: res.status };
  } catch (err) {
    console.error("GET error:", path, err);
    return { _status: 0 };
  }
}

async function post(path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (Array.isArray(data)) { data._status = res.status; return data; }
    return { ...data, _status: res.status };
  } catch (err) {
    console.error("POST error:", path, err);
    return { _status: 0 };
  }
}

async function del(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return { _status: res.status };
  } catch (err) {
    console.error("DELETE error:", path, err);
    return { _status: 0 };
  }
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export async function login(payload) {
  const res = await post("/auth/login/", payload);
  if (res.token) saveToken(res.token);
  return res;
}

export async function register(payload) {
  const res = await post("/auth/register/", payload);
  if (res.token) saveToken(res.token);
  return res;
}

export async function logout() {
  await post("/auth/logout/", {});
  clearToken();
}

export async function getMe() {
  if (!getToken()) return { _status: 401 };
  return get("/auth/me/");
}

// ─────────────────────────────────────────────
// MOODS
// ─────────────────────────────────────────────

export async function logMood(payload) {
  return post("/moods/", payload);
}

export async function getMoods() {
  const res = await get("/moods/");
  // res is already a plain array (with _status attached) or an object
  if (Array.isArray(res)) return res;
  return [];
}

export async function getTodayMood() {
  return get("/moods/today/");
}

// ─────────────────────────────────────────────
// JOURNAL
// ─────────────────────────────────────────────

export async function createJournal(payload) {
  return post("/journal/", payload);
}

export async function getJournal() {
  const res = await get("/journal/");
  if (Array.isArray(res)) return res;
  return [];
}

export async function deleteJournal(id) {
  return del(`/journal/${id}/`);
}

// ─────────────────────────────────────────────
// EMERGENCY CONTACT
// ─────────────────────────────────────────────

export async function getContact() {
  return get("/emergency-contact/");
}

export async function saveContact(payload) {
  return post("/emergency-contact/", payload);
}
// ─────────────────────────────────────────────
// AI ANALYSIS
// ─────────────────────────────────────────────

export async function getAiAnalysis() {
  return get("/ai-analysis/");
}