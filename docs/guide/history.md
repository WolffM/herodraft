# HeroDraft: history

One short build, then one short polish pass, six weeks apart. Both are the
whole history.

## One day, then six weeks later

The bot was built essentially in a day: the first commit laid out only
`.gitignore`, `LICENSE` and a one-line README, nothing functional
(`7d36b43`), and 21 minutes later one commit, "hello bot!", added
everything the bot still runs today in one shot — the Discord.js client,
all 15 hardcoded heroes, message and button handling, the
draft/combat/switch flow, the dice roller, and the hero-combat art assets
(`bc9e418`), both commits on 2024-06-09. That same "hello bot!" commit set
a `skipDraft` flag to `true`, which routes `heroDraft()` straight to a
random team split instead of the hand-picking code the function also
contains; nothing in the rest of the repo's history ever sets it back to
`false`, so the pick-your-heroes flow the commands are named for has never
actually run in this bot.

A few more test commits and two small merges followed that same day, then
the repo went quiet for 44 days (`bc9e418` → `bf9906f`).

## Card-art pipeline

Over three days, 2024-07-23 to 2024-07-25, the bot's combat images gained a
proper template system: color-coded card frame and pinline art for each
hero (`bf9906f`), a function to render a textbox onto the combat card for
testing (`770acf1`), a bitmap font loaded with Jimp so the bot could draw
real text onto that textbox instead of a blank template (`7d006fa`,
`dc859f0`), and a font swap partway through, from one called PixelFont to
one called PlanewalkerFont (`9569f57`), with the textbox wired into the
actual combat-image compositing function right after (`3bedac3`, `9e37c7c`).
That pass is the last change the bot has had.

## Trivia

The entire first working version of the bot — Discord wiring, all fifteen
heroes, the draft/combat/switch flow and the dice roller — was one commit,
"hello bot!" (`bc9e418`).
