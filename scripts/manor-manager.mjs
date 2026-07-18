const MODULE_ID = "pendragon-campaign-manager";

export async function manageActorManor(actor, { client, campaignId }) {
  const characterId = actor.getFlag(MODULE_ID, "characterId");
  if (!characterId) throw new Error("Synchronize this Actor before managing a manor.");
  const campaign = await client.getCampaign(campaignId);
  let manors = await client.listManors(campaignId);
  const form = await foundry.applications.api.DialogV2.input({
    window: { title: `Manage Manor: ${actor.name}` },
    content: manorForm(manors, campaign.current_year),
    ok: { label: "Save Manor Record" },
    rejectClose: false
  });
  if (!form) return null;
  const value = (name) => typeof form.get === "function" ? form.get(name) : form.object?.[name] ?? form[name];
  let manorId = value("manorId");
  if (manorId === "new") {
    const name = String(value("manorName") ?? "").trim();
    if (!name) throw new Error("Enter a name for the new manor.");
    const manor = await client.createManor(campaignId, {
      location: { kind: "manor", name, scope: "players", metadata: { source: "foundry_vtt" } },
      assized_rent: numberOrNull(value("assizedRent")),
      population: integerOrNull(value("population")),
      base_defensive_value: 1
    });
    await client.addManorTenure(campaignId, manor.id, {
      holder_character_id: characterId,
      start_year: Number(value("year")),
      tenure_type: "grant",
      terms: "Created from Foundry VTT"
    });
    manorId = manor.id;
  }
  const result = String(value("rollResult") ?? "").trim();
  if (result) {
    await client.createManorResolution(campaignId, manorId, {
      in_game_year: Number(value("year")),
      steward_character_id: value("selfSteward") ? characterId : null,
      stewardship_value: integerOrNull(value("stewardshipValue")),
      roll_result: result,
      income: Number(value("income") || 0),
      expenses: Number(value("expenses") || 0),
      privy_funds: Number(value("privyFunds") || 0),
      famine_stage: Number(value("famineStage") || 0),
      population_change: Number(value("populationChange") || 0),
      notes: String(value("notes") ?? "").trim() || null
    });
  }
  return { manorId };
}

function manorForm(manors, year) {
  const options = manors.map((m) => `<option value="${m.id}">${m.id}</option>`).join("");
  return `<div class="form-group"><label>Manor</label><select name="manorId"><option value="new">Create new manor</option>${options}</select></div>
  <div class="form-group"><label>New manor name</label><input name="manorName"></div>
  <div class="form-group"><label>Assized rent (£)</label><input name="assizedRent" type="number" min="0" step="0.5"></div>
  <div class="form-group"><label>Population</label><input name="population" type="number" min="0"></div><hr>
  <div class="form-group"><label>Year</label><input name="year" type="number" value="${year}" min="1"></div>
  <div class="form-group"><label>Stewardship result</label><select name="rollResult"><option value="">No annual resolution</option><option>critical</option><option>success</option><option>failure</option><option>fumble</option></select></div>
  <div class="form-group"><label>Stewardship value</label><input name="stewardshipValue" type="number" min="0"></div>
  <div class="form-group"><label><input name="selfSteward" type="checkbox"> Actor served as steward</label></div>
  <div class="form-group"><label>Income (£)</label><input name="income" type="number" step="0.5" value="0"></div>
  <div class="form-group"><label>Expenses (£)</label><input name="expenses" type="number" min="0" step="0.5" value="0"></div>
  <div class="form-group"><label>Privy funds (£)</label><input name="privyFunds" type="number" step="0.5" value="0"></div>
  <div class="form-group"><label>Famine stage</label><input name="famineStage" type="number" min="0" value="0"></div>
  <div class="form-group"><label>Population change</label><input name="populationChange" type="number" value="0"></div>
  <div class="form-group"><label>Notes</label><textarea name="notes"></textarea></div>`;
}

function numberOrNull(value) { return value === "" || value == null ? null : Number(value); }
function integerOrNull(value) { const n = numberOrNull(value); return n == null ? null : Math.trunc(n); }
