const SYNCHRONIZED_ITEM_TYPES = new Set(["trait", "skill", "passion"]);

export function actorToSnapshot(actor, effectiveYear) {
  const items = Array.from(actor.items ?? []).filter((item) => SYNCHRONIZED_ITEM_TYPES.has(item.type));
  return {
    effective_year: effectiveYear,
    traits: items.filter((item) => item.type === "trait").map(mapTrait),
    skills: items.filter((item) => item.type === "skill").map(mapSkill),
    passions: items.filter((item) => item.type === "passion").map(mapPassion),
    glory_total: nonnegativeInteger(actor.system?.glory ?? actor.system?.gloryTotal)
  };
}

function mapTrait(item) {
  const value = nonnegativeInteger(
    item.system?.total ??
      number(item.system?.value) + number(item.system?.religious) + number(item.system?.winter)
  );
  return {
    source_key: sourceKey(item),
    name: cleanName(item.name, "Unnamed Trait"),
    opposed_name: cleanName(item.system?.oppName, `Opposed ${item.name ?? "Trait"}`),
    value,
    opposed_value: nonnegativeInteger(item.system?.oppvalue ?? Math.max(0, 20 - value))
  };
}

function mapSkill(item) {
  const system = item.system ?? {};
  return {
    source_key: sourceKey(item),
    name: cleanName(item.name, "Unnamed Skill"),
    category: skillCategory(system),
    value: nonnegativeInteger(
      system.total ??
        number(system.value) +
          number(system.culture) +
          number(system.family) +
          number(system.create) +
          number(system.winter)
    )
  };
}

function mapPassion(item) {
  const system = item.system ?? {};
  return {
    source_key: sourceKey(item),
    name: cleanName(item.name, "Unnamed Passion"),
    subject_text: cleanOptional(system.specName),
    value: nonnegativeInteger(
      system.total ??
        number(system.value) +
          number(system.inherit) +
          number(system.sol) +
          number(system.homeland) +
          number(system.winter)
    )
  };
}

function sourceKey(item) {
  return item.flags?.Pendragon?.pidFlag?.id || item.uuid || `Item.${item.id}`;
}

function skillCategory(system) {
  if (system.combat) return "combat";
  const first = Array.isArray(system.categories) ? system.categories[0] : null;
  return cleanOptional(typeof first === "string" ? first : first?.name) ?? "ordinary";
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function nonnegativeInteger(value) {
  return Math.max(0, Math.trunc(number(value)));
}

function cleanName(value, fallback) {
  return cleanOptional(value) ?? fallback;
}

function cleanOptional(value) {
  const result = typeof value === "string" ? value.trim() : "";
  return result || null;
}
