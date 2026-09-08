# Foundry synchronization compatibility

Module 0.12.4 preserves the existing Campaign Manager snapshot API schema.
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
