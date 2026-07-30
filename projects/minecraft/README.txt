minecraft-tools v0.6
mattlivingston.com/minecraft/

Contents
--------
/index.html  Hub page. Farm hero banner, session-first quick actions,
             then all tools grouped into Build Planning / Survival Systems /
             World Navigation / Reference categories.
             Includes an Estate Plan section with farmstead-map.webp and
             district links into the most relevant tools.
             Card left-border colors match each tool's accent, so the hub
             doubles as a legend for the color system across the set.

/challenge/  Build Challenge Generator
/blocks/     Block Quantity Calculator (openings subtraction)
/palette/    Block Palette Builder
/villagers/  Villager Trade Tracker (localStorage + JSON export/import)
/enchant/    Enchant/Anvil Cost Optimizer
/potion/     Potion Brew Sheet
/highway/    Nether Highway Planner (includes portal coordinate conversion)
/portal/     Redirect to /highway/
/coords/     Base Coordinate Notebook (localStorage)
/farm/       Farm Calculator (crops / hoppers / mob spawn range)
/controls/   Minecraft Controls Guide for Java desktop defaults

All active tool pages now share a compact top navigation, with the current tool
highlighted and a Tool Bench footer with useful cross-links.

v0.7 usability and premium pass
-------------------------------
- Replaced the homepage hero with the attached Iona & Matt farm image.
- Reworked the hub around common play-session actions: places, materials,
  Nether routes, and villager trades.
- Upgraded shared styling with softer panels, rounded controls, better focus
  states, stable type sizing, and clearer mobile spacing.
- Block calculator now updates live and can copy a compact materials summary.
- Coordinate notebook now supports JSON backup/restore, clearing, copy status,
  and Nether/Overworld coordinate copy helpers.
- Highway planner now copies a full route summary.
- Challenge generator now copies the actual build prompt as well as the link.

/assets/hero.webp — Iona & Matt's Farm hero image, ~565KB.
/assets/farmstead-map.webp — Iona's Farmstead master estate plan used on
             the hub as a world-first navigation section.
/shared/     styles.css — token system, now includes a hub accent (gold,
             reused from the enchant tool) for the index page's own UI.

v0.4 polish pass
----------------
- Hub now uses the farmstead hero as a proper suite entrance and renames the
  collection "Iona's Farmstead Toolbox".
- Block wall counts use the actual rectangular ring footprint, so corners are
  counted once instead of being double-counted by perimeter math.
- Villager tracker now has search and profession filtering across names,
  locations, professions, and trade text.

v0.5 tool expansion
-------------------
- Added Potion Brew Sheet with ingredients, modifiers, splash, and lingering
  steps.
- Replaced the Portal Converter with Nether Highway Planner and material
  estimates.
- Added Base Coordinate Notebook for local saved places.
- Added Block Palette Builder for build vibes and practical block roles.
- Added Minecraft Controls Guide focused on desktop Java mouse/keyboard
  controls and F3 debug helpers.

Mobile ship polish
------------------
- Replaced the long mobile nav strip with a compact Tools dropdown.
- Standardized 44px touch targets for inputs, selects, and buttons.
- Reduced mobile card padding and page spacing for small screens.
- Stacked dense tabs, result cards, and action rows so forms do not overflow.
- Tuned the mobile hero height/crop.

Footer refresh
--------------
- Replaced path/version footers with a Tool Bench panel.
- Added useful cross-links, page-specific notes, and "Built for fun by Matt
  Livingston" credit text.

Deploy
------
Drop everything (index.html, assets/, and all six tool folders) into the
site root under /minecraft/. mattlivingston.com/minecraft/ now resolves
to the hub instead of a 404.

Not yet built
-------------
- Image-to-block-list resource calculator (tabled — needs a scoping
  decision on output type and block palette before it's worth building)
- Density/Breach/Wind Burst/Cleaving in the enchant optimizer (pending
  verified multiplier data)

Next version notes
-------------------
- Hub could eventually show "last used" or favorite tools if that ever
  matters, but not worth building until there's a real signal for it
