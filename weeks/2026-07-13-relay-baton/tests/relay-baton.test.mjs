import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  analyzeManifest,
  buildHtmlBaton,
  buildMarkdownBaton,
  loadManifest,
  summarizeBaton,
  writeArtifacts,
} from "../src/relay-baton.mjs";

const movingManifest = {
  project: {
    name: "Studio Weave",
    tagline: "Friday handoff pack for a README-first AI micro-tool.",
    operator: "solo launch desk",
    objective: "Ship a polished weekly drop without losing context between discovery, build, review, and publish.",
  },
  baton: {
    status: "moving",
    holder: "Verifier",
    next: "Publisher",
    handoffWindow: "Today before 18:00",
    promise: "Every handoff should preserve the brief, risks, proof, and next action.",
  },
  stages: [
    {
      label: "Capture Brief",
      lane: "capture",
      owner: "Scout",
      status: "done",
      approval: "none",
      risk: "low",
      goal: "Pick one wedge.",
      output: "Chosen direction",
    },
    {
      label: "Build Artifact",
      lane: "build",
      owner: "Maker",
      status: "done",
      approval: "none",
      risk: "medium",
      goal: "Ship the generator.",
      output: "Renderer + dist",
    },
    {
      label: "Verify Artifacts",
      lane: "verify",
      owner: "Verifier",
      status: "active",
      approval: "review",
      risk: "medium",
      goal: "Run tests and smoke checks.",
      output: "Green verification",
    },
    {
      label: "Publish to Main",
      lane: "ship",
      owner: "Publisher",
      status: "queued",
      approval: "required",
      risk: "high",
      goal: "Push origin/main.",
      output: "Live weekly drop",
    },
  ],
  checks: [
    { label: "Node tests", status: "pass", note: "Covered" },
    { label: "Coverage floor", status: "pass", note: "Above 80%" },
    { label: "README lead", status: "watch", note: "Product-first" },
  ],
  blockers: [
    {
      label: "Push gate still pending",
      severity: "watch",
      owner: "Publisher",
      note: "Wait for verification.",
    },
  ],
  handoff: {
    from: "Verifier",
    to: "Publisher",
    ask: "Review the outputs and push.",
    packet: ["README.md", "dist/index.html", "dist/summary.json"],
    nextMessage: "Verification is nearly done, then publish.",
  },
};

const blockedManifest = {
  project: {
    name: "Loose Relay",
    tagline: "A handoff flow with too many loose ends.",
  },
  baton: {
    status: "blocked",
    holder: "Builder",
    next: "Reviewer",
  },
  stages: [
    {
      label: "Implement Fix",
      lane: "build",
      owner: "Builder",
      status: "blocked",
      approval: "required",
      risk: "high",
      goal: "Patch the failing path.",
      output: "Working build",
    },
  ],
  checks: [{ label: "Integration smoke", status: "fail", note: "Still broken" }],
  blockers: [{ label: "Build still failing", severity: "hot", owner: "Builder", note: "Need another pass" }],
};

test("analyzeManifest summarizes a moving relay with pending approvals", () => {
  const report = analyzeManifest(movingManifest);

  assert.equal(report.summary.stageCount, 4);
  assert.equal(report.summary.blockedCount, 0);
  assert.equal(report.summary.pendingApprovals, 2);
  assert.equal(report.summary.failingChecks, 0);
  assert.equal(report.summary.watchChecks, 1);
  assert.equal(report.summary.activeStage.label, "Verify Artifacts");
  assert.equal(report.summary.momentum, "In motion");
  assert.equal(report.hotspots[0].label, "Publish to Main");
});

test("analyzeManifest marks blocked flows as Blocked", () => {
  const report = analyzeManifest(blockedManifest);

  assert.equal(report.summary.blockedCount, 1);
  assert.equal(report.summary.failingChecks, 1);
  assert.equal(report.summary.momentum, "Blocked");
  assert.equal(report.summary.readyToShip, false);
  assert.equal(report.hotspots[0].label, "Implement Fix");
});

test("renderers include baton holder, route, and handoff note", () => {
  const report = analyzeManifest(movingManifest);
  const markdown = buildMarkdownBaton(report);
  const html = buildHtmlBaton(report);

  assert.match(markdown, /Relay Baton/);
  assert.match(markdown, /Holder: Verifier/);
  assert.match(markdown, /Publish to Main/);
  assert.match(html, /Relay Baton/);
  assert.match(html, /Handoff Packet/);
});

test("writeArtifacts persists markdown, html, and summary files", async () => {
  const report = analyzeManifest(movingManifest);
  const outDir = await mkdtemp(path.join(tmpdir(), "relay-baton-"));

  await writeArtifacts(report, outDir);

  const markdown = await readFile(path.join(outDir, "handoff.md"), "utf8");
  const summary = JSON.parse(await readFile(path.join(outDir, "summary.json"), "utf8"));

  assert.match(markdown, /Route Map/);
  assert.equal(summary.holder, "Verifier");
  assert.equal(summary.pendingApprovals, 2);
});

test("loadManifest reads local fixtures", async () => {
  const manifest = await loadManifest(new URL("../sample/studio-weave.baton.json", import.meta.url));
  const report = analyzeManifest(manifest);

  assert.equal(manifest.project.name, "Studio Weave");
  assert.equal(report.summary.stageCount, 4);
  assert.equal(report.summary.activeStage.label, "Verify Artifacts");
});

test("summarizeBaton keeps portable handoff fields", () => {
  const report = analyzeManifest(movingManifest);

  assert.deepEqual(summarizeBaton(report), {
    project: "Studio Weave",
    batonStatus: "moving",
    holder: "Verifier",
    next: "Publisher",
    activeStage: "Verify Artifacts",
    stageCount: 4,
    blockedCount: 0,
    pendingApprovals: 2,
    failingChecks: 0,
    watchChecks: 1,
    readyToShip: false,
    hotspotLabels: ["Publish to Main", "Verify Artifacts"],
  });
});
