/**
 * Database abstraction: MongoDB if available, in-memory Map otherwise
 */
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

// In-memory fallback
const memStore = new Map();
const memHistory = [];

let usingMongo = false;
let Analysis = null;

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('[DB] MONGODB_URI not set – using in-memory store');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    Analysis = require('../models/Analysis');
    usingMongo = true;
    console.log('[DB] MongoDB connected');
  } catch (e) {
    console.warn('[DB] MongoDB connection failed – using in-memory store:', e.message);
  }
}

async function findByHash(textHash) {
  if (usingMongo) {
    return Analysis.findOne({ textHash }).lean();
  }
  return memStore.get(textHash) || null;
}

async function save(record) {
  if (usingMongo) {
    const doc = await Analysis.findOneAndUpdate(
      { textHash: record.textHash },
      record,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return doc._id.toString();
  }
  // In-memory
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const stored = { ...record, _id: id };
  memStore.set(record.textHash, stored);
  memHistory.unshift(stored);
  if (memHistory.length > 50) memHistory.pop();
  return id;
}

async function getHistory(limit = 20) {
  if (usingMongo) {
    return Analysis.find({}, 'docType urgency lang createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
  return memHistory.slice(0, limit).map(r => ({
    _id: r._id,
    docType: r.docType,
    urgency: r.urgency,
    lang: r.lang,
    createdAt: r.createdAt,
  }));
}

async function findById(id) {
  if (usingMongo) {
    return Analysis.findById(id).lean();
  }
  for (const v of memStore.values()) {
    if (v._id === id) return v;
  }
  return null;
}

module.exports = { connectDB, findByHash, save, getHistory, findById };
