const SYNCHRONIZED_ITEM_TYPES = new Set(["trait", "skill", "passion"]);

export function actorToSnapshot(actor, effectiveYear, { familyName = null } = {}) {
  const items = Array.from(actor.items ?? []).filter((item) => SYNCHRONIZED_ITEM_TYPES.has(item.type));
  return {
    effective_year: effectiveYear,
    traits: items.filter((item) => item.type === "trait").map(mapTrait),
    skills: items.filter((item) => item.type === "skill").map(mapSkill),
    passions: items.filter((item) => item.type === "passion").map(mapPassion),
    glory_total: nonnegativeInteger(actor.system?.glory ?? actor.system?.gloryTotal),
    stats: ["siz", "dex", "str", "con", "app"].map((code) => ({
      code,
      value: nonnegativeInteger(actor.system?.stats?.[code]?.total ?? actor.system?.stats?.[code]?.value)
    })),
    inventory: Array.from(actor.items ?? [])
      .filter((item) => ["gear", "weapon", "armour"].includes(item.type))
      .map(mapInventory),
    horses: Array.from(actor.items ?? []).filter((item) => item.type === "horse").map(mapHorse),
    family_name: cleanOptional(familyName),
    relatives: Array.from(actor.items ?? []).filter((item) => item.type === "family").map(mapRelative),
    is_heir: Boolean(actor.system?.heir)
  };
}

function mapRelative(item) {
  const system = item.system ?? {};
  return {
    source_key: item.uuid || `Item.${item.id}`,
    name: cleanName(item.name, "Unnamed Relative"),
    relation: ["parent", "spouse", "child", "other"].includes(system.relation) ? system.relation : "other",
    gender: cleanOptional(system.gender),
    birth_year: positiveYear(system.born),
    death_year: positiveYear(system.died),
    glory_total: nonnegativeInteger(system.glory),
    blessed_birth: Boolean(system.blessed),
    barren_marriage: Boolean(system.barrenMarriage),
    description: cleanOptional(stripHtml(system.description)),
    gm_description: cleanOptional(stripHtml(system.GMdescription))
  };
}

function mapInventory(item) {
  const system = item.system ?? {};
  return {
    source_key: sourceKey(item),
    item_type: item.type,
    name: cleanName(item.name, "Unnamed Item"),
    description: cleanOptional(stripHtml(system.description)),
    quantity: nonnegativeInteger(system.quantity ?? 1),
    equipped: Boolean(system.equipped),
    libra: nonnegativeInteger(system.libra),
    denarii: nonnegativeInteger(system.denarii),
    skill: cleanOptional(system.skillName ?? system.skill),
    damage_formula: cleanOptional(system.dmgForm ?? system.damageRoll),
    weapon_range: cleanOptional(system.range),
    mounted_use: cleanOptional(system.mounted),
    melee: system.melee !== false,
    armour_points: nonnegativeInteger(system.ap),
    material: cleanOptional(system.material),
    is_shield: item.type === "armour" && system.type === false
  };
}

function mapHorse(item) {
  const system = item.system ?? {};
  return {
    source_key: sourceKey(item),
    name: cleanOptional(system.horseName) ?? cleanName(item.name, "Unnamed Horse"),
    breed: cleanOptional(system.breed),
    colour: cleanOptional(system.colour),
    personality: cleanOptional(system.personality),
    features: cleanOptional(system.features),
    description: cleanOptional(stripHtml(system.description)),
    siz: nonnegativeInteger(system.siz),
    dex: nonnegativeInteger(system.dex),
    str: nonnegativeInteger(system.str),
    con: nonnegativeInteger(system.con),
    hp: nonnegativeInteger(system.hp),
    max_hp: nonnegativeInteger(system.maxHP),
    move: nonnegativeInteger(system.move),
    armour: nonnegativeInteger(system.armour),
    horse_armour: nonnegativeInteger(system.horseArmour),
    age: nonnegativeInteger(system.age),
    equipped: Boolean(system.equipped)
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

function positiveYear(value) {
  const year = nonnegativeInteger(value);
  return year > 0 ? year : null;
}

function cleanName(value, fallback) {
  return cleanOptional(value) ?? fallback;
}

function cleanOptional(value) {
  const result = typeof value === "string" ? value.trim() : "";
  return result || null;
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .trim();
}
