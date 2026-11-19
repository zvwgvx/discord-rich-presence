'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Client, RichPresence } = require('discord.js-selfbot-v13');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const token = process.env.DISCORD_USER_TOKEN?.trim();
const startedAt = config.elapsedStartAt ? new Date(config.elapsedStartAt) : config.elapsedStartMode === 'session' ? new Date() : new Date(`${config.dayCounter?.startDate || '2010-01-01'}T00:00:00+07:00`);

if (!token) {
  console.error('Missing DISCORD_USER_TOKEN in the service environment');
  process.exit(78);
}

const client = new Client({ checkUpdate: false });
let lastState = Symbol('not-applied');

function getDayState() {
  const counter = config.dayCounter;

  if (!counter?.enabled) {
    return config.state;
  }

  const start = /^\d{4}-\d{2}-\d{2}$/.exec(counter.startDate || '');

  if (!start) {
    throw new Error('dayCounter.startDate must be in YYYY-MM-DD format');
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: counter.timeZone || 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const current = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
  const [year, month, day] = counter.startDate.split('-').map(Number);
  const anchor = Date.UTC(year, month - 1, day);
  const count = Math.max(1, Math.floor((current - anchor) / 86400000) + 1);

  return (counter.template || 'Day {day}').replaceAll('{day}', String(count));
}

async function createPresence(state) {
  const presence = new RichPresence(client)
    .setName(config.name)
    .setType(config.activityType || 'PLAYING');

  if (config.details) presence.setDetails(config.details);
  if (state) presence.setState(state);
  if (config.platform) presence.setPlatform(config.platform);

  if (config.party?.enabled) {
    presence.setParty({
      current: config.party.current,
      max: config.party.max,
      id: config.party.id,
    });
  }

  if (config.showElapsed) {
    presence.setStartTimestamp(startedAt);
  }

  if (!config.applicationId) {
    console.warn('Application ID is not configured. Image assets will not be displayed.');
    return presence;
  }

  presence.setApplicationId(config.applicationId);

  let largeImage = config.largeImage;
  let smallImage = config.smallImage;
  const largeUrl = config.imageUrls?.large?.trim();
  const smallUrl = config.imageUrls?.small?.trim();

  if (largeUrl || smallUrl) {
    const urls = [largeUrl, smallUrl].filter(Boolean);
    const external = await RichPresence.getExternal(client, config.applicationId, ...urls);
    const resolve = (url, fallback) => external.find(item => item.url === url)?.external_asset_path || fallback;

    if (largeUrl) {
      largeImage = resolve(largeUrl, largeImage);
    }

    if (smallUrl) {
      smallImage = resolve(smallUrl, smallImage);
    }
  }

  if (largeImage) {
    presence.setAssetsLargeImage(largeImage);
  }

  if (config.largeText) {
    presence.setAssetsLargeText(config.largeText);
  }

  if (smallImage) {
    presence.setAssetsSmallImage(smallImage);
  }

  if (config.smallText) {
    presence.setAssetsSmallText(config.smallText);
  }

  return presence;
}

async function refreshPresence(force = false) {
  const state = getDayState();

  if (!force && state === lastState) {
    return;
  }

  const presence = await createPresence(state);
  client.user.setPresence({
    status: config.status || 'online',
    activities: [presence],
  });

  lastState = state;
  console.log('Rich Presence applied:', config.name, '|', state, '| settings.activityDisplay:', client.settings?.activityDisplay, '| app:', config.applicationId, '| image:', config.largeImage);
}

client.once('ready', async () => {
  try {
    await refreshPresence();

    const interval = config.dayCounter?.enabled ? 60000 : Math.max(0, Number(config.refreshMinutes || 0)) * 60000;
    if (interval > 0) {
      setInterval(() => {
        refreshPresence(!config.dayCounter?.enabled).catch(error => {
          console.error('Presence update failed:', error?.message || 'Unknown error');
        });
      }, interval);
    }
  } catch (error) {
    console.error('Failed to configure Rich Presence:', error?.message || 'Unknown error');
    process.exitCode = 1;
    client.destroy();
  }
});

client.on('error', error => {
  console.error('Discord connection error:', error?.message || 'Unknown error');
});

function shutdown() {
  client.destroy();
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

client.login(token).catch(error => {
  console.error('Discord login failed:', error?.message || 'Unknown error');
  process.exit(1);
});
