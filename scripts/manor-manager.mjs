const MODULE_ID = "pendragon-campaign-manager";

export async function manageActorManor(actor, { client, campaignId }) {
  const characterId = actor.getFlag(MODULE_ID, "characterId");
  if (!characterId) throw new Error("Synchronize this Actor before managing a manor.");
  const campaign = await client.getCampaign(campaignId);
  const manors = await manorChoices(client, campaignId);
  const selection = await input(`Estate Manager: ${actor.name}`, selectionForm(manors), "Continue");
  if (!selection) return null;
  const manorId = field(selection, "manorId");
  if (manorId === "new") return createManor(actor, client, campaignId, campaign.current_year, characterId);

  const estate = await loadEstate(client, campaignId, manorId);
  const action = field(selection, "action");
  const form = await input(`${estate.name}: ${actionLabel(action)}`, actionForm(action, estate, campaign.current_year), "Add Historical Record");
  if (!form) return null;
  await submitAction({ action, form, client, campaignId, manorId, characterId, year: campaign.current_year });
  return { manorId, action };
}

async function manorChoices(client, campaignId) {
  const manors = await client.listManors(campaignId);
  return Promise.all(manors.map(async (manor) => {
    const location = await client.getLocation(campaignId, manor.location_id);
    return { ...manor, name: location.name };
  }));
}

async function loadEstate(client, campaignId, manorId) {
  const manor = (await client.listManors(campaignId)).find((item) => item.id === manorId);
  if (!manor) throw new Error("The selected manor no longer exists.");
  const [location, tenures, resolutions, treasury, assets, household, improvements, defenses] = await Promise.all([
    client.getLocation(campaignId, manor.location_id),
    client.listManorTenures(campaignId, manorId),
    client.listManorResolutions(campaignId, manorId),
    client.listManorTreasury(campaignId, manorId),
    client.listManorAssets(campaignId, manorId),
    client.listManorHousehold(campaignId, manorId),
    client.listManorImprovements(campaignId, manorId),
    client.listManorDefenses(campaignId, manorId)
  ]);
  return { ...manor, name: location.name, tenures, resolutions, treasury, assets, household, improvements, defenses };
}

async function createManor(actor, client, campaignId, year, characterId) {
  const form = await input(`Create Manor: ${actor.name}`, createForm(year), "Create Manor");
  if (!form) return null;
  const name = text(field(form, "name"));
  if (!name) throw new Error("Enter a manor name.");
  const manor = await client.createManor(campaignId, {
    location: { kind: "manor", name, description: nullableText(field(form, "description")), scope: "players", metadata: { source: "foundry_vtt" } },
    customary_income: nullableNumber(field(form, "customaryIncome")),
    assized_rent: nullableNumber(field(form, "assizedRent")),
    population: nullableInteger(field(form, "population")),
    base_defensive_value: integer(field(form, "baseDefensiveValue"), 1),
    acreage: nullableInteger(field(form, "acreage")),
    notes: nullableText(field(form, "notes"))
  });
  await client.addManorTenure(campaignId, manor.id, {
    holder_character_id: characterId,
    start_year: integer(field(form, "year"), year),
    tenure_type: text(field(form, "tenureType")) || "grant",
    terms: nullableText(field(form, "terms"))
  });
  return { manorId: manor.id, action: "create" };
}

async function submitAction({ action, form, client, campaignId, manorId, characterId, year }) {
  const effectiveYear = integer(field(form, "year"), year);
  if (action === "annual") return client.createManorResolution(campaignId, manorId, {
    in_game_year: effectiveYear, steward_character_id: field(form, "selfSteward") ? characterId : null,
    stewardship_value: nullableInteger(field(form, "skill")), roll_result: required(form, "result"),
    income: number(field(form, "income")), expenses: number(field(form, "expenses")),
    privy_funds: number(field(form, "privyFunds")), famine_stage: integer(field(form, "famineStage")),
    population_change: integer(field(form, "populationChange")), notes: nullableText(field(form, "notes"))
  });
  if (action === "treasury") return client.addManorTreasuryEntry(campaignId, manorId, {
    in_game_year: effectiveYear, amount: nonzero(field(form, "amount")), category: required(form, "category"), description: required(form, "description")
  });
  if (action === "asset") {
    const asset = await client.addManorAsset(campaignId, manorId, { asset_type: required(form, "type"), name: required(form, "name"), description: nullableText(field(form, "description")) });
    return client.addManorAssetEntry(campaignId, manorId, asset.id, assetEntry(form, effectiveYear));
  }
  if (action === "asset-state") return client.addManorAssetEntry(campaignId, manorId, required(form, "assetId"), assetEntry(form, effectiveYear));
  if (action === "household") return client.addManorHouseholdMember(campaignId, manorId, {
    name: required(form, "name"), role: required(form, "role"), social_rank: nullableText(field(form, "rank")),
    key_skill: nullableText(field(form, "skillName")), key_skill_value: nullableInteger(field(form, "skillValue")),
    annual_cost: number(field(form, "annualCost")), start_year: effectiveYear, end_year: nullableInteger(field(form, "endYear")), notes: nullableText(field(form, "notes"))
  });
  if (action === "improvement") {
    const improvement = await client.addManorImprovement(campaignId, manorId, { name: required(form, "name"), improvement_type: required(form, "type"), description: nullableText(field(form, "description")) });
    return client.addManorImprovementEntry(campaignId, manorId, improvement.id, improvementEntry(form, effectiveYear));
  }
  if (action === "improvement-state") return client.addManorImprovementEntry(campaignId, manorId, required(form, "improvementId"), improvementEntry(form, effectiveYear));
  if (action === "defense") return client.addManorDefense(campaignId, manorId, {
    name: required(form, "name"), ring_order: integer(field(form, "ringOrder")), defensive_value: integer(field(form, "defensiveValue")),
    construction_cost: nullableNumber(field(form, "constructionCost")), improvement_id: nullableText(field(form, "improvementId"))
  });
  throw new Error(`Unknown estate action: ${action}`);
}

function assetEntry(form, year) { return { effective_year: year, quantity: nullableNumber(field(form, "quantity")), status: required(form, "status"), annual_income: number(field(form, "annualIncome")), annual_cost: number(field(form, "annualCost")), notes: nullableText(field(form, "notes")) }; }
function improvementEntry(form, year) { return { effective_year: year, status: required(form, "status"), income_modifier: number(field(form, "incomeModifier")), maintenance_cost: number(field(form, "maintenanceCost")), notes: nullableText(field(form, "notes")) }; }

function selectionForm(manors) {
  const options = manors.map((m) => `<option value="${escape(m.id)}">${escape(m.name)}</option>`).join("");
  return `<p>Select an estate and the historical record to append.</p>${group("Manor", `<select name="manorId"><option value="new">Create new manor</option>${options}</select>`)}${group("Action", `<select name="action"><option value="annual">Annual resolution</option><option value="treasury">Treasury entry</option><option value="asset">New asset or livestock</option><option value="asset-state">Asset state</option><option value="household">Household employment</option><option value="improvement">New improvement</option><option value="improvement-state">Improvement state</option><option value="defense">Defense layer</option></select>`)}`;
}

function createForm(year) { return `${group("Name", inputField("name"))}${group("Description", textarea("description"))}${money("Customary income", "customaryIncome")}${money("Assized rent", "assizedRent")}${num("Population", "population")}${num("Acreage", "acreage")}${num("Base Defensive Value", "baseDefensiveValue", 1)}${num("Start year", "year", year)}${group("Tenure type", inputField("tenureType", "grant"))}${group("Terms", textarea("terms"))}${group("GM notes", textarea("notes"))}`; }

function actionForm(action, e, year) {
  const summary = `<div class="pcm-estate-summary"><strong>${escape(e.name)}</strong> — ${e.resolutions.length} annual results; ${e.assets.length} assets; ${e.household.length} household records; ${e.improvements.length} improvements; ${e.defenses.length} defenses; treasury balance ${sum(e.treasury).toFixed(2)} Librum</div><hr>`;
  const common = num("Year", "year", year);
  if (action === "annual") return summary + common + group("Stewardship result", `<select name="result"><option>critical</option><option>success</option><option>failure</option><option>fumble</option></select>`) + num("Stewardship value", "skill") + group("Actor served as steward", `<input name="selfSteward" type="checkbox">`) + money("Income", "income", 0) + money("Expenses", "expenses", 0) + money("Privy funds", "privyFunds", 0) + num("Famine stage", "famineStage", 0) + num("Population change", "populationChange", 0) + group("Notes", textarea("notes"));
  if (action === "treasury") return summary + common + money("Amount (+ income, - expense)", "amount", 0) + group("Category", inputField("category")) + group("Description", textarea("description"));
  if (action === "asset" || action === "asset-state") return summary + (action === "asset" ? group("Asset type", inputField("type", "livestock")) + group("Name", inputField("name")) + group("Description", textarea("description")) : group("Asset", select("assetId", e.assets))) + common + num("Quantity", "quantity") + group("Status", inputField("status", "active")) + money("Annual income", "annualIncome", 0) + money("Annual cost", "annualCost", 0) + group("Notes", textarea("notes"));
  if (action === "household") return summary + common + group("Name", inputField("name")) + group("Role", inputField("role")) + group("Social rank", inputField("rank")) + group("Key skill", inputField("skillName")) + num("Skill value", "skillValue") + money("Annual cost", "annualCost", 0) + num("End year (optional)", "endYear") + group("Notes", textarea("notes"));
  if (action === "improvement" || action === "improvement-state") return summary + (action === "improvement" ? group("Type", inputField("type", "building")) + group("Name", inputField("name")) + group("Description", textarea("description")) : group("Improvement", select("improvementId", e.improvements))) + common + group("Status", inputField("status", "complete")) + money("Income modifier", "incomeModifier", 0) + money("Maintenance cost", "maintenanceCost", 0) + group("Notes", textarea("notes"));
  return summary + group("Name", inputField("name")) + num("Ring order", "ringOrder", e.defenses.length) + num("Defensive Value", "defensiveValue", 0) + money("Construction cost", "constructionCost") + group("Related improvement", `<select name="improvementId"><option value="">None</option>${options(e.improvements)}</select>`);
}

async function input(title, content, label) { return foundry.applications.api.DialogV2.input({ window: { title }, content, ok: { label }, rejectClose: false }); }
function actionLabel(value) { return value.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function sum(entries) { return entries.reduce((total, entry) => total + Number(entry.amount), 0); }
function field(form, name) { return typeof form.get === "function" ? form.get(name) : form.object?.[name] ?? form[name]; }
function required(form, name) { const value = text(field(form, name)); if (!value) throw new Error(`${name} is required.`); return value; }
function text(value) { return String(value ?? "").trim(); }
function nullableText(value) { return text(value) || null; }
function number(value) { return value === "" || value == null ? 0 : Number(value); }
function nullableNumber(value) { return value === "" || value == null ? null : Number(value); }
function integer(value, fallback = 0) { const result = nullableInteger(value); return result == null ? fallback : result; }
function nullableInteger(value) { const result = nullableNumber(value); return result == null ? null : Math.trunc(result); }
function nonzero(value) { const result = number(value); if (!result) throw new Error("Treasury amount must not be zero."); return result; }
function group(label, control) { return `<div class="form-group"><label>${label}</label>${control}</div>`; }
function inputField(name, value = "") { return `<input name="${name}" value="${escape(value)}">`; }
function textarea(name) { return `<textarea name="${name}"></textarea>`; }
function num(label, name, value = "") { return group(label, `<input name="${name}" type="number" value="${escape(value)}">`); }
function money(label, name, value = "") { return group(`${label} (Librum)`, `<input name="${name}" type="number" step="0.01" value="${escape(value)}">`); }
function select(name, entries) { return `<select name="${name}">${options(entries)}</select>`; }
function options(entries) { return entries.map((entry) => `<option value="${escape(entry.id)}">${escape(entry.name)}</option>`).join(""); }
function escape(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
