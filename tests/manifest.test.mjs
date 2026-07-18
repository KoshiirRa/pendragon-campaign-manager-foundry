import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));

test("manifest targets Foundry v14 and Pendragon", () => {
  assert.equal(manifest.id, "pendragon-campaign-manager");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.compatibility.verified, "14");
  assert.ok(manifest.relationships.systems.some(({ id }) => id === "Pendragon"));
});

test("release URLs correspond to the manifest version", () => {
  assert.match(manifest.manifest, /releases\/latest\/download\/module\.json$/);
  assert.match(manifest.download, new RegExp(`/v${manifest.version}/module\\.zip$`));
});

test("manifest includes the integration entry points", async () => {
  assert.deepEqual(manifest.esmodules, ["scripts/main.mjs"]);
  await readFile(new URL("../templates/config.hbs", import.meta.url), "utf8");
  await readFile(new URL("../scripts/api-client.mjs", import.meta.url), "utf8");
});

test("Actor integration supports Pendragon legacy and Foundry v14 hooks", async () => {
  const source = await readFile(
    new URL("../scripts/actor-integration.mjs", import.meta.url),
    "utf8"
  );
  assert.match(source, /getActorSheetHeaderButtons/);
  assert.match(source, /getActorDirectoryEntryContext/);
  assert.match(source, /getApplicationV1HeaderButtons/);
  assert.match(source, /getHeaderControlsApplicationV2/);
  assert.match(source, /getActorContextOptions/);
});

test("Foundry v14 Actor controls use the ApplicationV2 control contract", async () => {
  const source = await readFile(
    new URL("../scripts/actor-integration.mjs", import.meta.url),
    "utf8"
  );
  assert.match(source, /action: "pcm-sync-actor"/);
  assert.match(source, /onClick: \(\) => synchronize\(actor, createClient\)/);
  assert.match(source, /actor\?\.documentName !== "Actor"/);
});

test("diagnostics never log or return the API key value", async () => {
  const main = await readFile(new URL("../scripts/main.mjs", import.meta.url), "utf8");
  assert.match(main, /apiKeyConfigured/);
  assert.doesNotMatch(main, /apiKey:\s*game\.settings\.get/);
  assert.match(main, /\.api\.diagnostics\(\)/);
});

test("estate UI uses Pendragon currency terminology", async () => {
  const source = await readFile(new URL("../scripts/manor-manager.mjs", import.meta.url), "utf8");
  assert.match(source, /Librum/);
  assert.doesNotMatch(source, /GBP|British pound|£/i);
});
