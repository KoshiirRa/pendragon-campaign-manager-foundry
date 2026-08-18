# Upstream Pendragon compatibility

This record tracks completed source-level compatibility reviews of the community
[`cragstone/Pendragon`](https://github.com/cragstone/Pendragon) Foundry system.
Release notes are treated as review inputs; compatibility decisions are based on
the tagged source diff.

## Reviewed baseline

- Latest reviewed upstream release: `14.9`
- Upstream tag commit: `6830dba83dee00f0a04e04f93ed55a1bea39af35`
- Review completed: 2026-08-18
- Companion module version reviewed: `0.12.3`
- Result: compatible; no module or backend implementation change required

## Release reviews

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
