const fs = require('node:fs/promises');

async function getStoredLists() {
  const rawFileContent = await fs.readFile('lists.json', { encoding: 'utf-8' });
  const data = JSON.parse(rawFileContent);
  const storedLists = data.lists ?? [];
  return storedLists;
}

function storeLists(lists) {
  return fs.writeFile('lists.json', JSON.stringify({ lists: lists || [] }));
}

exports.getStoredLists = getStoredLists;
exports.storeLists = storeLists;