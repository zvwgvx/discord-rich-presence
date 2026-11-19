'use strict';

const fs = require('node:fs');
const path = require('node:path');

const [preset, mode, value] = process.argv.slice(2);
if (!preset || !/^[a-z0-9_-]+$/i.test(preset) || !['days', 'hours', 'at'].includes(mode) || !value) {
  console.error('Usage: node time.js <preset> <days|hours|at> <number|ISO-8601>');
  process.exit(1);
}

let start;
if (mode === 'at') {
  start = new Date(value);
} else {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    console.error('Expected a non-negative number');
    process.exit(1);
  }
  start = new Date(Date.now() - amount * (mode === 'days' ? 86400000 : 3600000));
}

if (!Number.isFinite(start.getTime())) {
  console.error('Invalid start timestamp');
  process.exit(1);
}

const file = path.join(__dirname, 'presets', `${preset}.json`);
if (!fs.existsSync(file)) {
  console.error('Preset not found:', preset);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.showElapsed = true;
data.elapsedStartAt = start.toISOString();
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('Preset:', preset, '| elapsedStartAt:', data.elapsedStartAt);
console.log('Run: node preset.js', preset);
