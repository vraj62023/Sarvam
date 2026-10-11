// API helper functions
const BASE = '/api';

export async function analyzeText(text, lang) {
  const res = await fetch(`${BASE}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

export async function analyzeFile(file, lang) {
  const form = new FormData();
  form.append('file', file);
  form.append('lang', lang);
  const res = await fetch(`${BASE}/analyze`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

export async function getTTS(text, lang) {
  const res = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  });
  if (!res.ok) throw new Error('TTS failed');
  return res.json(); // { audio: base64, format: 'wav' }
}

export async function getHistory() {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

export async function getAnalysis(id) {
  const res = await fetch(`${BASE}/analysis/${id}`);
  if (!res.ok) throw new Error('Analysis not found');
  return res.json();
}

export async function askQuestion(analysisId, question, lang) {
  const res = await fetch(`${BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, question, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Question failed');
  }
  return res.json();
}

export function playBase64Audio(base64, format = 'wav') {
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNums)], { type: `audio/${format}` });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  return audio;
}
