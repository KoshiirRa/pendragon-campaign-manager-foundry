const SUPPORTED_TYPES = new Set(["character", "npc", "follower"]);

export function actorToCharacterPayload(actor, { kind, playerName = null, worldId = null } = {}) {
  if (!SUPPORTED_TYPES.has(actor.type)) {
    throw new Error(`Pendragon Actor type '${actor.type}' is not supported for character sync.`);
  }
  if (kind !== "player_knight" && kind !== "npc") {
    throw new Error("Character kind must be player_knight or npc.");
  }
  const normalizedPlayer = playerName?.trim() || null;
  if (kind === "player_knight" && !normalizedPlayer) {
    throw new Error("A player name is required for a player knight.");
  }

  const system = actor.system ?? {};
  return {
    kind,
    name: actor.name?.trim() || "Unnamed Character",
    player_name: kind === "player_knight" ? normalizedPlayer : null,
    gender: textOrNull(system.gender),
    culture: textOrNull(system.culture),
    religion: textOrNull(system.religion),
    social_class: textOrNull(system.class),
    birth_year: positiveYearOrNull(system.born),
    coat_of_arms: textOrNull(system.coatOfArms),
    public_description: descriptionFor(actor.type, system),
    foundry_uuid: actor.uuid,
    metadata: {
      foundry_actor_id: actor.id,
      foundry_actor_type: actor.type,
      foundry_world_id: worldId,
      pendragon: {
        homeland: textOrNull(system.homeland),
        home: textOrNull(system.home),
        family: textOrNull(system.family),
        lord: textOrNull(system.lord),
        motto: textOrNull(system.motto),
        heraldry: textOrNull(system.heraldry)
      }
    }
  };
}

export function characterUpdatePayload(payload) {
  const { kind: _kind, ...update } = payload;
  return update;
}

function descriptionFor(type, system) {
  const value = type === "character" ? system.background || system.features : system.description;
  return textOrNull(stripHtml(value));
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function positiveYearOrNull(value) {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 && year <= 9999 ? year : null;
}

function textOrNull(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}
