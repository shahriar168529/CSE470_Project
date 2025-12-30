function extractCity(address = '') {
  if (!address) return null;

  return address
    .toLowerCase()
    .replace(/bangladesh/g, '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .slice(-1)[0];
}

module.exports = { extractCity };
