import { actorToCharacterPayload, characterUpdatePayload } from "./actor-mapper.mjs";

const MODULE_ID = "pendragon-campaign-manager";

export async function syncActor(actor, { client, campaignId, kind, playerName, worldId }) {
  if (!campaignId) throw new Error("Select a Campaign Manager campaign before syncing Actors.");
  const payload = actorToCharacterPayload(actor, { kind, playerName, worldId });
  const flaggedId = actor.getFlag?.(MODULE_ID, "characterId");
  let existing = null;

  if (flaggedId) {
    try {
      existing = await client.getCharacter(campaignId, flaggedId);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  if (!existing) {
    const characters = await client.listCharacters(campaignId);
    existing = characters.find((character) => character.foundry_uuid === actor.uuid) ?? null;
  }

  if (existing && existing.kind !== kind) {
    throw new Error(
      `This Actor is already linked as ${existing.kind}. Character kind cannot be changed by sync.`
    );
  }

  const character = existing
    ? await client.updateCharacter(campaignId, existing.id, characterUpdatePayload(payload))
    : await client.createCharacter(campaignId, payload);

  await actor.setFlag?.(MODULE_ID, "characterId", character.id);
  await actor.setFlag?.(MODULE_ID, "lastSyncedAt", new Date().toISOString());
  return { character, created: !existing };
}
