# Upstream Pendragon compatibility

This record tracks completed source-level compatibility reviews of the community
[`cragstone/Pendragon`](https://github.com/cragstone/Pendragon) Foundry system.
Release notes are treated as review inputs; compatibility decisions are based on
the tagged source diff.

## Reviewed baseline

- Latest reviewed upstream release: `14.12`
- Upstream tag commit: `8c0b539a1ea247a4f9f423e22415faa5d13fc006`
- Review completed: 2026-09-01
- Companion module version reviewed: `0.12.3`
- Result: compatible; no module or backend implementation change required

## Release reviews

### Pendragon 14.12

Compared tagged source `14.11...14.12` in addition to reading the release notes.

- The functional change is limited to CSS variables and styling that keep
  Character Creation text visible in dark mode.
- Winter Phase completion, World Time, hooks, Application APIs, Actor and Item
  data models, and all synchronization contracts are unchanged.
- The system manifest remains compatible with Foundry v14 (`minimum` and
  `maximum` 14; verified build `14.367`). No backend or module implementation
  change is required.

### Pendragon 14.11

Compared tagged source `14.10...14.11` in addition to reading the release notes.

- The Skill Selection dialog is now resizable and scrollable. Character
  Creation now returns a pass/fail label for each knighthood prerequisite and
  displays it in a tooltip.
- These sheet and dialog changes do not alter stored traits, passions, skills,
  Glory, or the Actor/Item data consumed by synchronization.
- Winter Phase completion, World Time, hooks, and the system manifest's
  Foundry v14 compatibility remain unchanged. No backend or module
  implementation change is required.

### Pendragon 14.10

Compared tagged source `14.9...14.10` in addition to reading the release notes.

- Upstream roll, Ideal, follower-sheet, and Winter Phase lookups now tolerate
  Actors and Items whose `flags.Pendragon.pidFlag` path is absent. The companion
  module already treats PIDs as optional and falls back to Foundry UUIDs or Item
  IDs for stable synchronization identity.
- The included GM macro can add missing PIDs to world Actors and Items. This is
  an upstream repair tool and does not change the module's idempotent mapping or
  the Campaign Manager API contract.
- Winter Phase still advances World Time through the existing flow. Family,
  history, horses, wounds, squires, inventory, traits, passions, skills, and
  Glory data models used by synchronization are unchanged.
- Default Actor artwork, localization, instructions, pack content, CSS, and the
  verified Foundry build update to `14.367` require no backend or module change.

### Pendragon 14.9

Compared tagged source `14.8...14.9` in addition to reading the release notes.

- Winter Phase completion, World Time, hooks, Application APIs, and the Actor
  and Item contracts used by synchronization are unchanged.
- Character creation now rolls the second parent-Glory component with `3D6`
  instead of `2D6`. This affects newly generated upstream character data only;
  the module continues to synchronize the resulting character and history
  values without depending on the roll formula.
- The Ideal Item `dam` field changed from a number to a string so formulas such
  as `+1D6` are valid. Ideal Items are not part of the Campaign Manager sync
  contract, so no API or module change is required.
- The remaining changes are sheet CSS and artwork. The system manifest remains
  compatible with Foundry v14 and advances its verified build to `14.366`.

### Pendragon 14.8

Compared tagged source `14.7...14.8` in addition to reading the release notes.

- Winter Phase completion and calendar integration are unchanged. No World
  Time, `updateSetting`, or `updateWorldTime` contract changed.
- Manual Glory adds `system.manualGlory` to Pendragon's computed
  `system.glory`; the module already synchronizes that computed total. The new
  GM Glory Award tool creates ordinary History Items with year, description,
  and Glory, all of which the existing history snapshot maps.
- Horse Items add nonnegative `libra` and `denarii` fields to repair cost
  display. Horse identity, ownership, and synchronized stat fields are
  unchanged; these display-price fields do not alter the Campaign Manager
  horse contract.
- Registered PID safety fixes, Horsemanship display, opposed/combat dice timing,
  roll-table range handling, Actor default art, sheet presentation, journals,
  packs, and localization do not affect synchronization.
- Actor family/history/horses/wounds/squires/inventory and
  traits/passions/skills/Glory remain compatible. The system manifest still
  targets Foundry v14 (`minimum` and `maximum` 14; verified build `14.365`).
  No backend migration, deployment, module version bump, or module release is
  required.

### Pendragon 14.7

Compared tagged source `14.6...14.7` in addition to reading the release notes.

- Winter Phase completion and calendar integration are unchanged in behavior.
  `PENWinter.changeYear` still advances Foundry World Time with
  `game.time.set({ year })`, so the module's `updateSetting` and
  `updateWorldTime` integration remains valid.
- Pendragon Actor and Item data contracts consumed by synchronization are
  unchanged for family, history, horses, wounds, squires, inventory, traits,
  passions, skills, and Glory.
- No relevant hook or ApplicationV2 contract changed. The upstream sheet and
  settings edits are formatting changes except for the default value of the
  unrelated `switchShift` dice option.
- The functional code changes select the newest matching open opposed/combat
  card, close stale cards after 24 hours, preserve prototype-token dynamic rings
  when creating Encounter tokens, and repair default scene artwork.
- Other changes update French localization, instructions, pack tooling, CSS,
  and the Pendragon system manifest. The system still declares Foundry v14
  compatibility (`minimum` and `maximum` 14; verified build `14.365`). The
  companion module already declares Foundry v14 and the `Pendragon` system
  relationship.
- None of the changed files alter the Campaign Manager API contract or require
  a backend migration, deployment, module version bump, or module release.

### Pendragon 14.6

Reviewed before this document was introduced. The companion module's Winter
Phase integration was updated for Pendragon's Foundry World Time calendar:
Pendragon advances the year with `game.time.set({ year })`, and the module
observes `updateWorldTime` while retaining the legacy serialized-setting path.
That compatibility is implemented in companion module version `0.12.2` and
remains present in `0.12.3`.
