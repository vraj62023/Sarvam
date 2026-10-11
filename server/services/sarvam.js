/**
 * Sarvam AI service functions
 * All endpoints confirmed from docs.sarvam.ai
 * Auth header: api-subscription-key
 */
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const { SARVAM_API_KEY, SARVAM_BASE } = require('../config');

const API = axios.create({
  baseURL: SARVAM_BASE,
  timeout: 45000,
  headers: { 'api-subscription-key': SARVAM_API_KEY },
});

// Retry helper
async function withRetry(fn, retries = 1) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

/**
 * Chat completion using sarvam-105b
 * POST /v1/chat/completions
 */
async function chatComplete(systemPrompt, userContent) {
  return withRetry(async () => {
    const res = await API.post('/v1/chat/completions', {
      model: 'sarvam-105b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });
    return res.data.choices[0].message.content;
  });
}

/**
 * Translate text to target language
 * POST /translate
 * target_language_code examples: hi-IN, bn-IN, ta-IN, te-IN, mr-IN, gu-IN, kn-IN, ml-IN, pa-IN, od-IN
 * Max ~1000 chars per request recommended
 */
async function translateText(text, targetLangCode) {
  if (!text || targetLangCode === 'en-IN') return text;
  return withRetry(async () => {
    const res = await API.post('/translate', {
      input: text,
      source_language_code: 'en-IN',
      target_language_code: targetLangCode,
      model: 'mayura:v1',
      mode: 'formal',
    });
    return res.data.translated_text || text;
  });
}

/**
 * Text-to-Speech using Bulbul v4 Flash
 * POST /text-to-speech
 * Returns base64-encoded WAV in response.audios[]
 * Limit: 2500 chars per request
 */
async function textToSpeech(text, langCode) {
  return withRetry(async () => {
    const res = await API.post('/text-to-speech', {
      text,
      language_code: langCode || 'hi-IN',
      speaker: 'meera',
      model: 'bulbul:v1',
      enable_preprocessing: true,
    });
    // Response has audios array of base64-encoded WAV strings
    const audios = res.data.audios || [];
    return audios.join('');
  });
}

/**
 * Document Intelligence - Digitise (OCR)
 * POST /doc-ai/v1/job/digitise  → poll → download
 * Returns extracted markdown text
 */
async function digitiseDocument(fileBuffer, mimeType, originalName) {
  const MAX_POLL_MS = 40000;
  const POLL_INTERVAL = 3000;

  // Step 1: Create job and upload
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: originalName,
    contentType: mimeType,
  });
  form.append('language', 'en-IN');
  form.append('output_format', 'md');

  const createRes = await withRetry(async () => {
    return API.post('/doc-ai/v1/job/digitise', form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,
    });
  });

  const jobId = createRes.data.job_id;
  if (!jobId) throw new Error('No job_id returned from Doc AI');

  // Step 2: Poll for completion
  const deadline = Date.now() + MAX_POLL_MS;
  const TERMINAL = new Set(['completed', 'partially_completed', 'failed', 'rejected']);

  let status = '';
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
    const statusRes = await API.get(`/doc-ai/v1/job/${jobId}/status`);
    status = (statusRes.data.status || '').toLowerCase();
    if (TERMINAL.has(status)) break;
  }

  if (!['completed', 'partially_completed'].includes(status)) {
    throw new Error(`Doc AI job ${status || 'timed out'}`);
  }

  // Step 3: Get download URL
  const dlRes = await API.get(`/doc-ai/v1/job/${jobId}/download-url`);
  const downloadUrl = dlRes.data.url;
  if (!downloadUrl) throw new Error('No download URL from Doc AI');

  // Step 4: Download the ZIP and extract markdown
  const zipRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 15000 });
  const zip = new AdmZip(Buffer.from(zipRes.data));
  const entries = zip.getEntries();

  let mdText = '';
  for (const entry of entries) {
    if (entry.entryName.endsWith('.md') || entry.entryName.includes('output')) {
      mdText += entry.getData().toString('utf8') + '\n';
    }
  }

  if (!mdText) {
    // Try any text file
    for (const entry of entries) {
      if (!entry.isDirectory) {
        mdText += entry.getData().toString('utf8') + '\n';
        break;
      }
    }
  }

  return mdText.trim();
}

module.exports = { chatComplete, translateText, textToSpeech, digitiseDocument };
