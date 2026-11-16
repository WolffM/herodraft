# Contributing

How to run the bot locally, where things live, and what it deploys to. What
it does for a player is in [features.md](features.md).

## Run it locally

```sh
npm install
```

You need a `.env` file (git-ignored) with `DISCORD_TOKEN` set to a Discord
bot token with the Guilds, Guild Messages and Message Content intents
enabled, then:

```sh
npm start   # node bot.mjs
```

Without `DISCORD_TOKEN` set, the process logs an error and exits without
starting the client (`bot.mjs`).

## Architecture

| Path            | What it is                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `bot.mjs`       | the whole Discord client: commands, buttons, the draft/combat/switch state machine, the dice roller   |
| `helper.mjs`    | a `heroes` array and `createHeroDataFile()` to write it to `assets/hero_data.json` (never called — `bot.mjs` reads that JSON file directly instead), plus the Jimp image-compositing functions that build each combat/draft card image |
| `saveData.mjs`  | reads and writes per-match JSON game state under `genassets/savedgames/` (git-ignored)                |
| `assets/`       | hero portrait art, the card-frame template images, and the bitmap font used to render card text       |

There is no build step and no package split: `bot.mjs` imports directly from
`helper.mjs` and `saveData.mjs`, and game state lives entirely as JSON files
on disk next to the process, read and rewritten on every turn.

## Tests and gates

There are none: no test file, no linter configuration, and no CI workflow
in the repository.

## How it deploys

There is no deploy pipeline here: this is a long-running Node process
(`npm start`) meant to be kept running wherever you host it, logged into
Discord with a bot token. A push to the default branch triggers nothing.

## Known issues

- `package.json`'s `repository`, `bugs` and `homepage` fields still point at
  a different personal GitHub account and a different repo name than this
  one — stale metadata from before this code lived here, not this repo's
  real location.
- `package.json` declares the `ISC` license while `LICENSE` is the MIT
  license text; the two disagree.
- `package.json` lists a dependency named `discord` (the old, unmaintained
  `discord` npm package) alongside `discord.js`; nothing in `bot.mjs` or
  `helper.mjs` imports from `discord`, only from `discord.js`.

## Trivia

The bot keeps every match's state as a plain JSON file per game under
`genassets/savedgames/`, read back into memory on every single interaction
rather than held in process memory between turns (`saveData.mjs`).
