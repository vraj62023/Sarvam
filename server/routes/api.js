const express = require('express');
const multer = require('multer');
const router = express.Router();
const { analyzeText } = require('../services/analyze');
const { digitiseDocument } = require('../services/sarvam');
const { textToSpeech } = require('../services/sarvam');
const { chatComplete } = require('../services/sarvam');
const { chunkText } = require('../utils/chunk');
const db = require('../services/db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const allowedExt = /\.(pdf|png|jpg|jpeg)$/i;
    if (allowed.includes(file.mimetype) || allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, JPG files are allowed'));
    }
  },
});

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Kanoon Chhota' });
});

// POST /api/analyze-text  {text, lang}
router.post('/analyze-text', async (req, res, next) => {
  try {
    const { text, lang = 'en-IN' } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide at least 10 characters of document text.' });
    }
    const result = await analyzeText(text.trim(), lang, db);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/analyze  multipart {file, lang}
router.post('/analyze', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const lang = req.body.lang || 'en-IN';

    let extractedText = '';
    try {
      extractedText = await digitiseDocument(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
    } catch (docErr) {
      console.error('Doc AI error:', docErr.message);
      const e = new Error(
        'Could not read the document automatically. Please copy and paste the document text instead.'
      );
      e.hint = 'Use the "Paste Text" tab to manually enter the document content.';
      e.status = 422;
      return next(e);
    }

    if (!extractedText || extractedText.length < 20) {
      const e = new Error('The document appears to be empty or unreadable. Please try paste-text mode.');
      e.hint = 'Use the "Paste Text" tab to manually enter the document content.';
      e.status = 422;
      return next(e);
    }

    const result = await analyzeText(extractedText, lang, db);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/tts  {text, lang}
router.post('/tts', async (req, res, next) => {
  try {
    const { text, lang = 'hi-IN' } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    // Chunk to 2400 chars to stay under 2500 limit
    const chunks = chunkText(text, 2400);
    const audioChunks = await Promise.all(chunks.map(chunk => textToSpeech(chunk, lang)));
    const combined = audioChunks.join('');

    res.json({ audio: combined, format: 'wav' });
  } catch (err) {
    next(err);
  }
});

// GET /api/history
router.get('/history', async (req, res, next) => {
  try {
    const history = await db.getHistory(20);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

// GET /api/analysis/:id
router.get('/analysis/:id', async (req, res, next) => {
  try {
    const record = await db.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Analysis not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/ask  {analysisId, question, lang}
router.post('/ask', async (req, res, next) => {
  try {
    const { analysisId, question, lang = 'en-IN' } = req.body;
    if (!analysisId || !question) {
      return res.status(400).json({ error: 'analysisId and question are required' });
    }
    const record = await db.findById(analysisId);
    if (!record) return res.status(404).json({ error: 'Analysis not found' });

    const prompt = `You are Kanoon Chhota. Answer the question based ONLY on the following document text. Do not invent facts. Keep your answer short and simple (Class 6 level). If the answer is not in the document, say "I cannot find that information in this document." Do not give legal advice.`;
    const userMsg = `Document text:\n${record.original}\n\nQuestion: ${question}`;

    const answer = await chatComplete(prompt, userMsg);
    res.json({ answer, question });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
