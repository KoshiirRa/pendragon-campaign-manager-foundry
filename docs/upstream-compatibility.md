# Upstream Pendragon compatibility

This record tracks completed source-level compatibility reviews of the community
[`cragstone/Pendragon`](https://github.com/cragstone/Pendragon) Foundry system.
Release notes are treated as review inputs; compatibility decisions are based on
the tagged source diff.

## Reviewed baseline

- Latest reviewed upstream release: `14.7`
- Upstream tag commit: `1222bb9b63f4b87f4cb7c313ab1ba27c4fc34bc2`
- Review completed: 2026-08-12
- Companion module version reviewed: `0.12.3`
- Result: compatible; no module or backend implementation change required

## Release reviews

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
