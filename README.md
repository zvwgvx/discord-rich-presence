# Discord Rich Presence

A small Node.js controller for a personal Discord Rich Presence activity, with a ready-to-use **Grand Theft Auto VI** preset.

**[GTA VI setup and play-time guide →](GTA_VI.md)**

> This project uses `discord.js-selfbot-v13` and a user account session. Discord prohibits selfbots; use can lead to account restrictions. This is not an official Discord or PlayStation integration.

## Features

- JSON-based presets under `presets/`
- Custom application ID and large/small images
- Optional PlayStation platform hint, details, state and party
- Elapsed play-time using either a fixed start timestamp or current session
- Optional automatic refresh (`refreshMinutes`)
- systemd user-service template for Linux

## Requirements

- Node.js 20.18.0 or newer
- npm
- A Discord account session credential supplied privately as `DISCORD_USER_TOKEN`
- Linux + systemd for the always-on service example (optional)

Never publish a credential or commit the `.env` file. The public application ID in the GTA VI preset is not a login credential.

## Quick start

```bash
git clone https://github.com/zvwgvx/discord-rich-presence.git
cd discord-rich-presence
npm ci
cp .env.example .env
chmod 600 .env
```

Edit `.env` locally and replace the placeholder with your own credential. Do not share its value.

Activate the GTA VI preset and start the app:

```bash
npm run gta6
```

`config.json` is generated locally and ignored by Git. To use another profile, place its JSON file in `presets/<name>.json`, then run `node preset.js <name>`. This repository includes only the GTA VI example.

## Host as a systemd user service (Linux)

The included service expects the repository at `$HOME/discord-rich-presence` and Node.js at `/usr/bin/node`.

```bash
mkdir -p ~/.config/systemd/user
cp discord-rich-presence-selfbot.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now discord-rich-presence-selfbot.service
systemctl --user status discord-rich-presence-selfbot.service
```

If your Node.js binary is elsewhere (for example, an `nvm` installation), run `command -v node` and edit `ExecStart` in the service file to use that absolute path.

For the user service to stay running after logout, systemd lingering may need to be enabled by an administrator:

```bash
sudo loginctl enable-linger "$USER"
```

Useful maintenance commands:

```bash
systemctl --user restart discord-rich-presence-selfbot.service
journalctl --user -u discord-rich-presence-selfbot.service -n 50 --no-pager
systemctl --user stop discord-rich-presence-selfbot.service
```

## Presets and configuration

The JSON preset defines the activity name, application ID, image asset IDs, activity text, status and elapsed timer. Change any preset, re-apply it, then restart the service:

```bash
node preset.js gta6
systemctl --user restart discord-rich-presence-selfbot.service
```

The GTA VI preset is documented in [GTA_VI.md](GTA_VI.md). Never commit `config.json`, `.env`, `node_modules/` or private presets.

## Limitations

- Discord may not display Rich Presence in all clients or on your own profile view.
- Another desktop/mobile/web session may affect the displayed activity.
- Setting `platform: "ps5"` does not reproduce the official PlayStation Network activity header or PlayStation icon.
