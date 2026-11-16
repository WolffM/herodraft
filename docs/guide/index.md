---
title: HeroDraft
summary: >-
  A Discord bot for a 1-on-1 hero-battler game: challenge someone in a
  channel, split a hero pool between you, and fight it out in turns with
  bot-generated battle-card images. Runs as a bot process in a server you
  invite it to; there is no web page.
features:
  - name: Challenge and draft
    summary: 'Issue a challenge with !herodraft, accept it, and get handed a team of heroes.'
    anchor: challenge-and-draft
  - name: Turn-based combat
    summary: 'Attack or switch your active hero each turn, posted as a generated card image.'
    anchor: turn-based-combat
  - name: Dice roller
    summary: '!roll parses dice notation (2d6+3, with modifiers) and posts the result.'
    anchor: dice-roller
trivia:
  - 'The draft was never actually interactive: a `skipDraft` flag that silently assigns heroes at random instead of letting players pick has been hardcoded `true` since the bot''s first working commit, so the whole hand-picking code path has never run (`bc9e418`).'
  - 'The in-game Ability button has never done anything beyond log that it was pressed; attack and switch are the only turns that act (`bc9e418`).'
  - 'Its card-art pipeline grew in one short burst, 2024-07-23 to -25, six weeks after the bot itself; it swapped fonts mid-burst, from one called PixelFont to one called PlanewalkerFont (`9569f57`).'
  - 'The whole first working version of the bot — Discord wiring, fifteen heroes, turn combat, the dice roller — landed in a single commit, "hello bot!" (`bc9e418`).'
---

# HeroDraft

HeroDraft is a Discord bot, not a web app: you add it to a server, and
players issue text commands and click buttons inside a channel. One player
challenges another; the bot splits a pool of 15 heroes between them, and
they fight it out over several turns, each one rendered as a generated
combat-card image posted to the channel.

![A generated combat card: an owl in samurai armor, drawn battle-card style, titled "Samurai" with the ability name "Momentum"](../../assets/SamuraiCombat.png)

- [Features](features.md): the commands, buttons and what each turn does.
- [Contributing](contributing.md): running the bot locally, its layout, what has no tests.
- [History](history.md): a one-day build, then a card-art polish pass six weeks later.
- [Trivia](trivia.md)

## Trivia

The interactive hero draft the bot's commands are named for — `!herodraft3`,
`!herodraft5` — has never actually run: a flag that skips it in favor of a
random split has been hardcoded on since the first working commit
([history](history.md#one-day-then-six-weeks-later)).
