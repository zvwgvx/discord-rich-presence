'use strict';

const fs = require('node:fs');
const path = require('node:path');

const preset = process.argv[2];
if (!preset || !/^[a-z0-9_-]+$/i.test(preset)) {
  console.error('Usage: node preset.js <preset-name>');
  process.exit(1);
}

const file = path.join(__dirname, 'presets', `${preset}.json`);
if (!fs.existsSync(file)) {
  console.error('Preset not found:', preset);
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(file, 'utf8'));
fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(source, null, 2) + '\n', { mode: 0o600 });
console.log('Active preset:', preset);
