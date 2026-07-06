import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  analyzeManifest,
  buildHtmlAtlas,
  buildMarkdownAtlas,
  loadManifest,
  summarizeAtlas,
  writeArtifacts,
} from "../src/approval-atlas.mjs";

const guardedManifest = {
  product: {
    name: "Northstar Desk",
    tagline: "Operator console for small weekly launches.",
    operator: "solo builder",
  },
  surfaces: [
    {
      name: "searchRepos",
      label: "Search GitHub Repos",
      kind: "tool",
      stage: "discover",
      permissions: ["network", "read"],
      approval: "none",
      touches: ["public-web"],
      intent: "Collect live idea signals.",
    },
    {
      name: "publishWeek",
      label: "Publish Weekly Drop",
      kind: "tool",
      stage: "ship",
      permissions: ["write", "network"],
      approval: "required",
      touches: ["github", "workspace"],
      intent: "Push the final release.",
    },
    {
      name: "cleanupDrafts",
      label: "Cleanup Draft Files",
      kind: "tool",
      stage: "cleanup",
      permissions: ["write", "exec"],
      approval: "required",
      touches: ["filesystem"],
      destructive: true,
      intent: "Delete scratch exports.",
    },
  ],
};

const exposedManifest = {
  product: {
    name: "Loose Switchyard",
    tagline: "Too much power with too little review.",
  },
  surfaces: [
    {
      name: "deleteAssets",
      label: "Delete Assets",
      kind: "tool",
      stage: "cleanup",
      permissions: ["write", "exec"],
      approval: "none",
      touches: ["filesystem", "prod-data"],
      destructive: true,
      intent: "Delete files immediately.",
    },
  ],
};

test("analyzeManifest scores gated high-risk surfaces as Guarded", () => {
  const atlas = analyzeManifest(guardedManifest);

  assert.equal(atlas.summary.surfaceCount, 3);
  assert.equal(atlas.summary.gatedCount, 2);
  assert.equal(atlas.summary.destructiveCount, 1);
  assert.equal(atlas.summary.posture, "Guarded");
  assert.equal(atlas.summary.highestRisk.label, "Cleanup Draft Files");
  assert.equal(atlas.lanes[2].stage, "ship");
});

test("analyzeManifest flags ungated destructive surfaces as Hot", () => {
  const atlas = analyzeManifest(exposedManifest);

  assert.equal(atlas.summary.posture, "Hot");
  assert.equal(atlas.summary.unguardedHighRiskCount, 1);
  assert.match(atlas.hotspots[0].reason, /destructive/);
});

test("renderers include posture, lane cards, and hotspots", () => {
  const atlas = analyzeManifest(guardedManifest);
  const markdown = buildMarkdownAtlas(atlas);
  const html = buildHtmlAtlas(atlas);

  assert.match(markdown, /Approval Atlas/);
  assert.match(markdown, /Posture: Guarded/);
  assert.match(markdown, /Cleanup Draft Files/);
  assert.match(html, /Approval Atlas/);
  assert.match(html, /Risk Hotspots/);
});

test("writeArtifacts persists markdown, html, and summary files", async () => {
  const atlas = analyzeManifest(guardedManifest);
  const outDir = await mkdtemp(path.join(tmpdir(), "approval-atlas-"));

  await writeArtifacts(atlas, outDir);

  const markdown = await readFile(path.join(outDir, "atlas.md"), "utf8");
  const summary = JSON.parse(await readFile(path.join(outDir, "summary.json"), "utf8"));

  assert.match(markdown, /Lane Map/);
  assert.equal(summary.posture, "Guarded");
  assert.equal(summary.highestRisk, "Cleanup Draft Files");
});

test("loadManifest reads local fixtures", async () => {
  const manifest = await loadManifest(new URL("../sample/northstar-desk.surface.json", import.meta.url));
  const atlas = analyzeManifest(manifest);

  assert.equal(manifest.product.name, "Northstar Desk");
  assert.equal(atlas.summary.surfaceCount, 4);
  assert.equal(atlas.summary.posture, "Guarded");
});

test("summarizeAtlas keeps portable review fields", () => {
  const atlas = analyzeManifest(guardedManifest);

  assert.deepEqual(summarizeAtlas(atlas), {
    product: "Northstar Desk",
    posture: "Guarded",
    surfaceCount: 3,
    gatedCount: 2,
    destructiveCount: 1,
    unguardedHighRiskCount: 0,
    highestRisk: "Cleanup Draft Files",
    hotspotLabels: ["Cleanup Draft Files", "Publish Weekly Drop"],
  });
});
