# Foundry synchronization compatibility

Module 0.12.5 preserves the existing Campaign Manager snapshot API schema.
The horse snapshot `equipped` boolean represents the Actor's selected horse on
Pendragon 14.13 and later. Compare `flags.Pendragon.currentHorse` to the embedded
Horse Item ID, not its PID or UUID. Selection is independent of mounted status.
An explicit empty, null, or stale selection produces no equipped horse. When
the flag is absent, use the legacy Item `system.equipped` value (missing is false).
The modern selection takes precedence over residual legacy Item values.

Identity remains PID, UUID, then Item ID. Horse ownership, age, attributes and
all other snapshot fields retain their existing mappings. No backend schema,
migration, endpoint, or deployment change is needed. The backend already appends
changed horse state and preserves prior history.

Player/GM upgrade steps are in the README. For development, run `npm test`;
regressions cover selection changes, dismounted selection, absent legacy fields,
cleared/deleted selections and legacy compatibility. Winter Phase tests remain
part of the full suite. Foundry UI and live database verification are separate
from these automated checks and were not performed in this reconciliation.

## NPC public description contract (Pendragon 14.16)

For NPC Actors, map only `system.playerNotes` to `public_description`.
Never fall back to `system.description`: upstream now labels it GM Notes.
Missing, null, empty and whitespace-only Player Notes map to explicit null,
including on PATCH, clearing a previously synchronized public description.
This conservative behavior also applies to legacy NPCs without Player Notes.
No GM notes are uploaded or moved into metadata. Character background/features
and follower description mappings are unchanged.

The existing create/PATCH API contract accepts nullable public descriptions;
no backend implementation or deployment change is required. Regression tests
cover create mapping, PATCH null clearing, missing/blank notes and followers.
Resync corrects current stored descriptions, not earlier disclosures or exports.

Upstream 14.16 manor/barony Actors and background/manorImp Items are outside
the character snapshot allowlist. Estate links are not ownership transactions;
Manage Manor remains the explicit backend estate workflow. Item-derived trait,
passion and skill totals and Feast History Glory retain the existing mapping.


## Pendragon 14.17-14.19

Battle/Encounter name/PID/UUID references remain outside the character snapshot.
The upstream migration bug in 14.17/14.18 is fixed in 14.19; the companion module
must not duplicate that migration. Skill categoryLabels and character age are
derived presentation fields; retain categories, prepared totals and born mappings.
The added World Time listener refreshes Actors without emitting a second time
advance. Modern automatic synchronization remains gated on Winter Phase closure,
not arbitrary GM year changes. See the upstream compatibility record for source
references and the distinction between static review and live verification.
