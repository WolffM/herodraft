# HeroDraft: trivia

Each fact names the commit it comes from.

## Trivia

- **The draft was never a draft.** `!herodraft3`/`!herodraft5` promise a
  pick-your-heroes draft, but a `skipDraft` flag that instead deals a random
  split has been hardcoded `true` since the bot's very first working
  commit — the interactive picking code sits right next to it, unreachable
  (`bc9e418`).
- **A whole bot in one commit.** Discord wiring, fifteen heroes, turn-based
  combat, switching, and a dice roller with crit detection — the entire
  first working version was a single commit titled "hello bot!" (`bc9e418`).
- **A silent ability button.** Every hero has a named special ability in its
  data file, but clicking **Ability** in a match only logs that it happened;
  no hero's ability has ever done anything in combat (`bc9e418`).
- **Six weeks between two bursts.** After the bot's one-day build on
  2024-06-09, nothing changed for 44 days, until the card-art template
  system arrived over three days starting 2024-07-23 (`bc9e418` → `bf9906f`;
  fact sheet, 2026-11-16).
