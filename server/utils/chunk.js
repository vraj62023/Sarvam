/**
 * Chunk text into pieces under maxLen characters, splitting on sentence boundaries
 */
function chunkText(text, maxLen = 2400) {
  if (!text || text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at sentence boundary
    let splitAt = maxLen;
    const sentenceEnd = remaining.lastIndexOf('.', maxLen);
    const newline = remaining.lastIndexOf('\n', maxLen);
    const best = Math.max(sentenceEnd, newline);
    if (best > maxLen * 0.5) splitAt = best + 1;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  return chunks.filter(Boolean);
}

module.exports = { chunkText };
