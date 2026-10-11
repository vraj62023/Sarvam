const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  textHash: { type: String, unique: true, index: true },
  docType: String,
  urgency: { type: String, enum: ['low', 'medium', 'high'] },
  lang: String,
  original: String,
  result: mongoose.Schema.Types.Mixed,
  translated: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
