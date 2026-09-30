# Upstream Pendragon compatibility

This record tracks completed source-level compatibility reviews of the community
[`cragstone/Pendragon`](https://github.com/cragstone/Pendragon) Foundry system.
Release notes are treated as review inputs; compatibility decisions are based on
the tagged source diff.

## Reviewed baseline

- Latest reviewed upstream release: `14.20`
- Upstream tag commit: `06734c06a109c274bf3013b465d1ce9b0ccf931e`
- Review completed: 2026-09-29
- Companion module version reviewed: `0.12.5`
- Result: compatible; 0.12.5 prevents NPC GM Notes from being sent publicly

## Pendragon 14.15-14.20 publication verified

Source review completed on 2026-09-29 for releases 14.15 through 14.20 using
their release notes and tagged source comparisons. Module v0.12.5 publication
was verified on 2026-09-29: tag `v0.12.5` resolves to
`1af3c553ed98b8a62ce0d3d8d30cb20334fccada`; the GitHub release provides
`module.zip` and `module.json`. The downloaded ZIP has `module.json` at its
root, and the released manifest declares module version 0.12.5, Foundry v14
compatibility, and the corresponding tagged download URL.

## Pendragon 14.13-14.14 publication verified

Source review completed on 2026-09-08 for releases
[14.13](https://github.com/cragstone/Pendragon/releases/tag/14.13) and
[14.14](https://github.com/cragstone/Pendragon/releases/tag/14.14), using release
notes and tagged source comparisons
[14.12...14.13](https://github.com/cragstone/Pendragon/compare/14.12...14.13) and
[14.13...14.14](https://github.com/cragstone/Pendragon/compare/14.13...14.14).
Module v0.12.4 publication verified on 2026-09-15: tag resolves to
`1fcc1a677c86b33a90401779f6cd69aec9b08933`; downloaded ZIP contains the
horse adapter, root manifest and integration documentation.

### Pendragon 14.13

Tag commit: `0291f41ccfbab9a0b8958e790bf87b7cb15ddd44`.

- HorseData removes `system.equipped`; both character sheets now select a horse
  through `flags.Pendragon.currentHorse`. Module 0.12.4 maps that Item ID to the
  existing API `equipped` field, with legacy fallback when the flag is absent.
  Selection is independent of mounted status. Horse identity, ownership, age
  and remaining attributes retain their mappings; the new `born` field does not
  replace `age`. No backend API or database change is needed.
- Character Sheet V2 inherits ActorSheetV2 through PendragonActorSheet and keeps
  the public ApplicationV2 header-control contract used by the module. V1 remains
  the default with a sheet-switch control. Some V2 upstream actions remain
  unavailable; users can switch to V1. Live UI verification remains pending.
- Winter Phase completion, World Time, calendar settings and their hook source
  files are unchanged. Family and squire collections are reorganized for sheet
  display without replacing the embedded Items used by snapshots.
- HistoryData clears descriptions duplicated by the Item title. The module
  already preserves the title separately and accepts an empty description;
  History Item identity, year, source and reported Glory retain their mappings.
- Wound/healing actions update the existing wound value/treated fields and
  remove healed wounds; snapshot semantics remain compatible. Trait, passion,
  skill and total Glory mappings remain compatible. Derived actor data moves
  into CharacterData without changing the fields consumed by synchronization.
- Combat action/card logic, damage calculations, weapon capability getters,
  PID editor construction, migration null guards, localization, templates and
  styling do not require additional synchronization changes. Weapon selection
  is distinct from inventory equipped state; weapon/armour equipment toggles
  still update their existing Item field.
- The manifest continues to target Foundry 14, verified `14.367`.

### Pendragon 14.14

Tag commit: `885eb96e635abd80462e6fddb5f0a6e4f2e6198b`.

- CharacterData adds non-persisted empty defaults for class, culture, homeland
  and religion IDs/names to fix character-creation completion detection.
- Bio birth/death controls, localized sheet labels, effects layout and other
  presentation fixes preserve the snapshot contract. No additional module or
  backend change is required beyond the 14.13 horse adapter.
- Winter Phase, World Time and Foundry 14 manifest compatibility remain intact.

Validation: all 41 module tests passed on the Linux development VM with Node
22.23.2, including three new horse-selection regressions and existing snapshot,
manifest, ApplicationV2 and Winter Phase coverage. Live Foundry and database
checks were not performed. No backend deployment is required.

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

## Pendragon 14.15-14.16 reconciliation pending publication

Reviewed release notes and actual tagged source comparisons:
[14.14...14.15](https://github.com/cragstone/Pendragon/compare/14.14...14.15)
and [14.15...14.16](https://github.com/cragstone/Pendragon/compare/14.15...14.16).
The baseline remains 14.14 until module 0.12.5 publication is verified.

### Pendragon 14.15

Feast Deck controls and Geniality live in Combat/Combatant flags and chat cards,
outside the snapshot contract. FeastGlory.createAwards calls the existing
Actor.addHistoryEvent, so awarded Glory and History Items synchronize normally
on the next explicit sync or Winter Phase completion. No adapter change needed.

### Pendragon 14.16

Tag commit: `ac631ab23ea8bf0a7bc72404df22a094055be1ee`.

- NPC sheets now label system.description GM Notes and introduce playerNotes.
  The previous mapper sent description as public_description. Module 0.12.5
  fixes this privacy incompatibility: NPCs send only playerNotes, with explicit
  null for absent/empty notes and no GM-note fallback, even for legacy NPCs.
  Existing current descriptions can be corrected by resync; prior disclosures
  or exported copies cannot be retracted. No live campaign data was inspected.
- Trait, passion and skill totals move from Actor preparation to Item models.
  Their prepared total/oppvalue fields and formulas remain consumed directly;
  NPC/follower totals now include modifiers rather than only base values.
- New manor/barony Actors, background/manorImp Items and character estate UUID
  links are additive, outside the character sync allowlist. They do not replace
  family, horse, history, wound, squire or inventory Items. Automatic estate
  import is not implemented; use Manage Manor for backend estate records.
- Family/relationship drop handling adds estate support without replacing
  existing snapshot collections. Horse selection remains currentHorse.
  New weapon special and skill/trait npcSource fields do not change mappings.
- Winter Phase and World Time source files are unchanged. gameYear is only
  relocated in settings registration; existing modern and legacy hooks remain.
- Sheet registration adds estate sheets; supported character/NPC sheets still
  use the public ApplicationV2 header contract. GM-tab visibility, Help links,
  display settings, styles, translations and estate calculations require no
  further module change.
- Manifest retains system ID Pendragon and Foundry minimum/maximum 14, verified
  14.367. String compatibility versions and new document types remain compatible.

Validation: all 43 module tests passed on dev-vm using Node 22.23.2, including
NPC privacy/null-clearing and follower regressions plus horse, snapshot, manifest,
ApplicationV2 and Winter Phase coverage. Backend nullable public_description and
PATCH exclude_unset behavior support this change without schema or service edits.
Developer/API contract and player upgrade instructions were updated in this
module. Live Foundry UI and PostgreSQL end-to-end checks remain unperformed.


## Pendragon 14.17-14.20 reconciliation pending publication

Reviewed on 2026-09-22 using live GitHub release notes and tagged source diffs
[14.16...14.17](https://github.com/cragstone/Pendragon/compare/14.16...14.17),
[14.17...14.18](https://github.com/cragstone/Pendragon/compare/14.17...14.18),
and [14.18...14.19](https://github.com/cragstone/Pendragon/compare/14.18...14.19).
Rechecked the pending 14.15-14.16 privacy fix against source and API schemas.

### Pendragon 14.17

Tag commit: `5549071ab244bcff1e121f181babd4db6f8dc5c0`.

Battle encounters and Encounter NPC references become name/PID/UUID objects,
with priority-based lookup and UUID fallback. These Actors are outside the
module character allowlist; synchronized character/Item identities are unchanged.
The upstream migration processes world and eligible compendium Actors.
Its getUpdatesFor function references undefined newPID instead of newPid when
resolving old references, which can abort migration. This remains in 14.18 and
is corrected in 14.19. Back up worlds before upgrading; prefer 14.19 over
14.17/14.18. Campaign Manager does not run or repair this upstream migration.
Character creation resolves compendium UUIDs asynchronously, and unowned Weapon
sheets use optional Actor access. Neither changes the API snapshot contract.

### Pendragon 14.18

Tag commit: `a3506f1a1a1948e3f1c7b8467af41341d366b30d`.

New combat actions, movement/armour helpers, unarmed damage handling and chat-card
outcomes use existing horse, equipment and skill fields. They do not change
stored snapshot schemas, wound synchronization or Winter Phase completion.
No additional adapter change is needed; the upstream migration warning above
also applies to this release.

### Pendragon 14.19

Tag commit: `3a17744b047f7dc525572d3f19d7a4242a56b698`.

- A new updateWorldTime listener reinitializes Actors and rerenders character
  sheets so derived age reflects the current year. Character age is declared
  non-persisted; the module continues to send born as birth_year. The listener
  does not write a setting or advance time again, so it does not introduce a
  second Winter Phase completion. Winter Phase and calendar source files are
  unchanged across 14.14...14.19; game.time.set and the winter-setting closure
  sequence remain authoritative. The existing module only responds to modern
  World Time changes when Winter Phase closure is pending; arbitrary GM year
  changes are not a new automatic campaign-year synchronization feature.
- Skill drops convert Item documents to source objects before calculating
  starting values. Localized categoryLabels are additive; the mapper still uses
  categories and prepared total. Follower modifier defaults become zero and
  auto-calculation toggles preserve computed HP; stat field paths are unchanged.
- Feast/Glory socket refresh uses system.Pendragon; History creation still calls
  addHistoryEvent. Total Glory and history provenance mapping remain unchanged.
- Battle opening gains UUID fallback, and the migration fixes newPid casing.
  No backend or module migration should duplicate these upstream operations.
- Family/history/horse/wound/squire/inventory models consumed by the module are
  unchanged. No new ApplicationV2 header contract is introduced.
- Manifest keeps system ID Pendragon, Foundry minimum/maximum 14 and verified
  build 14.368. No change to the companion relationship or API routes is needed.

Validation: all 43 module tests passed on dev-vm with Node 22.23.2 on 2026-09-22.
The backend CharacterCreate/CharacterUpdate nullable public_description and
service PATCH exclude_unset behavior were checked. No backend implementation
change or deployment is required. Live Foundry hook ordering, UI, upstream world
migration and PostgreSQL end-to-end behavior were not exercised.

### Pendragon 14.20

Reviewed on 2026-09-29 using the release notes and the tagged source comparison
[14.19...14.20](https://github.com/cragstone/Pendragon/compare/14.19...14.20).
Tag commit: `06734c06a109c274bf3013b465d1ce9b0ccf931e`.

- `PendragonItem.createDialog` now excludes `history` alongside wound, family,
  squire and relationship Items, preventing History Items from being created in
  the Item Directory. This does not alter Actor `addHistoryEvent`, existing
  History Item fields, or the module's read-and-synchronize history mapping.
  The module does not create History Items through the directory dialog.
- The remaining changes are journal CSS and declaration artwork. Winter Phase
  completion, World Time/calendar hooks, Actor and Item data models, public
  Application APIs, family, horses, wounds, squires, inventory, traits,
  passions, skills and Glory contracts are unchanged.
- The upstream manifest remains a Foundry v14 system (minimum and maximum 14,
  verified build 14.368). No backend or additional companion-module code change
