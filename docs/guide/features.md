# HeroDraft: features

What each command and button does. How the bot is put together is in
[contributing.md](contributing.md).

## Challenge and draft

**What it does.** `!herodraft3`, `!herodraft5` or `!herodraft0` posts an
"Accept Challenge" button in the channel. Once a second player clicks it,
the bot picks who goes first with a coin flip, then splits the 15-hero pool
between the two teams and starts the match.

**How to use it.** Type `!herodraftN` in a channel the bot is in (`N` sets
how many heroes end up on each team for the `3`/`5` cases), then have the
other player click **Accept Challenge**. Each player then picks their
starting active hero from a row of buttons.

**What it does not do.** Despite the command's name, there is no actual
draft: the bot never deals heroes out for players to pick between — it
shuffles the pool and deals each team its heroes directly, with no choice
involved (`bot.mjs`, the `skipDraft` branch of `heroDraft()`; see
[history](history.md)). The `N` in `!herodraft0` produces an empty starting
team on each side.

## Turn-based combat

**What it does.** Each turn, the bot posts a generated image of the two
active heroes facing off, their current HP and energy, and three buttons:
**Attack**, **Ability** and **Switch**. Attack deals the active hero's fixed
damage to the opponent's active hero; Switch brings a different living hero
off the bench. When a hero's HP reaches zero it's marked defeated, and the
match ends once a whole team is down.

**How to use it.** Click **Attack** or **Switch** on your turn; a defeated
hero forces an automatic switch prompt if you have another hero left.

**What it does not do.** **Ability** does nothing: its handler only logs
that it was pressed and returns, for every hero (`bot.mjs`,
`actionType === 'ability'`). Every hero's ability is cosmetic flavor text in
`hero_data.json` with no effect in combat.

## Dice roller

**What it does.** `!roll`, followed by standard dice notation
(`2d6`, `1d20+5`, or two dice expressions added or subtracted), rolls the
dice and posts the total. When the roll's difficulty — dice count times
die size, multiplied again by a modifier dice group if one was rolled — is
at least 20, it also flags a critical success if the total equals the
best possible roll, or a critical failure if the total equals the number
of dice *groups* parsed (`bot.mjs`, `calculateRollResult`, around line
776): for a single roll like `1d20` that means a failure flag only when
the total is 1, but for a multi-group roll the comparison is against the
group count, not the dice themselves.

**How to use it.** `!roll 1d20+3` in any channel the bot is in; this works
outside of an active match.

**What it does not do.** Only one `+`/`-` modifier term is parsed per roll;
chained modifiers (`1d20+2+3`) are not supported.

## Trivia

The combat and draft images are composited fresh each time rather than
cached ahead of time — see [contributing.md](contributing.md#architecture)
for how.
