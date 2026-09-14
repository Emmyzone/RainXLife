// Rough reading-time estimate based on ~200 words per minute
function estimateReadingTime(...textBlocks) {
  const text = textBlocks.filter(Boolean).join(' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

module.exports = estimateReadingTime;
