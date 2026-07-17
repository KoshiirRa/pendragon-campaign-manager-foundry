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
