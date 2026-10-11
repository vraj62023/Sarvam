const crypto = require('crypto');
const { chatComplete, translateText } = require('./sarvam');
const { chunkText } = require('../utils/chunk');

const SYSTEM_PROMPT = `You are Kanoon Chhota, a legal-literacy assistant for ordinary Indian citizens with little or no legal background. Explain the given legal document in very simple English at a Class 6 reading level. Short sentences. No legal jargon; if a term is unavoidable, explain it in brackets. Never invent facts. If something is unclear or missing, say so. Return ONLY valid JSON: { docType, summary (max 4 sentences), whatYouMustDo (array), deadlines (array of {date, what}), ifYouIgnore (string), nextSteps (array), urgency (low|medium|high) }. Always include a next step recommending the user contact a lawyer or free legal aid (DLSA / NALSA helpline 15100). You do not give legal advice.`;

function hashText(text, lang) {
  return crypto.createHash('sha256').update(text + '|' + lang).digest('hex');
}

function parseJSON(raw) {
  // Strip code fences
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Translate all string fields in a result object
 */
async function translateResult(result, targetLangCode) {
  if (!targetLangCode || targetLangCode === 'en-IN') return result;

  async function tr(text) {
    if (!text) return text;
    const chunks = chunkText(text, 900);
    const parts = await Promise.all(chunks.map(c => translateText(c, targetLangCode)));
    return parts.join(' ');
  }

  const translated = {
    docType: await tr(result.docType),
    summary: await tr(result.summary),
    whatYouMustDo: await Promise.all((result.whatYouMustDo || []).map(tr)),
    deadlines: await Promise.all(
      (result.deadlines || []).map(async d => ({
        date: d.date,
        what: await tr(d.what),
      }))
    ),
    ifYouIgnore: await tr(result.ifYouIgnore),
    nextSteps: await Promise.all((result.nextSteps || []).map(tr)),
    urgency: result.urgency,
  };
  return translated;
}

/**
 * Core pipeline: text → LLM → JSON → translate
 */
async function analyzeText(text, lang = 'en-IN', db) {
  const textHash = hashText(text, lang);

  // Check cache
  if (db) {
    const cached = await db.findByHash(textHash);
    if (cached) return cached;
  }

  // Step 1: LLM simplify
  let resultEnglish;
  let rawLLM;
  try {
    rawLLM = await chatComplete(SYSTEM_PROMPT, `Legal document text:\n\n${text.slice(0, 8000)}`);
    resultEnglish = parseJSON(rawLLM);
  } catch (e) {
    // Retry once with a nudge
    try {
      rawLLM = await chatComplete(
        SYSTEM_PROMPT,
        `Legal document text (return ONLY valid JSON, no markdown fences):\n\n${text.slice(0, 8000)}`
      );
      resultEnglish = parseJSON(rawLLM);
    } catch (e2) {
      throw new Error('Could not parse LLM response as JSON: ' + e2.message);
    }
  }

  // Step 2: Translate
  let translated = resultEnglish;
  if (lang && lang !== 'en-IN') {
    try {
      translated = await translateResult(resultEnglish, lang);
    } catch (e) {
      console.warn('Translation failed, using English:', e.message);
      translated = resultEnglish;
    }
  }

  const record = {
    textHash,
    docType: resultEnglish.docType,
    urgency: resultEnglish.urgency,
    lang,
    original: text.slice(0, 5000),
    result: resultEnglish,
    translated,
    createdAt: new Date(),
  };

  // Save to DB
  let savedId = null;
  if (db) {
    try {
      savedId = await db.save(record);
    } catch (e) {
      console.warn('DB save failed:', e.message);
    }
  }

  return { ...record, _id: savedId };
}

module.exports = { analyzeText, hashText };
