import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  analyzeSource,
  buildHtmlReceipt,
  buildMarkdownReceipt,
  loadSource,
  summarizeReport,
  writeArtifacts,
} from "../src/browser-ritual.mjs";

const polishedHtml = `
<!doctype html>
<html>
  <head>
    <title>Velvet Arcade</title>
    <meta name="description" content="Launch cinematic microsites fast." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="Velvet Arcade" />
    <meta property="og:description" content="A polished launch layer." />
    <meta property="og:image" content="https://example.com/cover.png" />
    <link rel="canonical" href="https://example.com" />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <nav><a href="/pricing">Pricing</a></nav>
    <main>
      <h1>Launch cinematic microsites with cleaner proof.</h1>
      <a href="/start">Start free</a>
      <button>Book walkthrough</button>
    </main>
    <footer>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/docs">Docs</a>
    </footer>
  </body>
</html>`;

const sparseHtml = `
<!doctype html>
<html>
  <head>
    <title>Plain page</title>
  </head>
  <body>
    <main>
      <h1>Notes</h1>
      <p>No extra metadata here.</p>
    </main>
  </body>
</html>`;

test("analyzeSource extracts launch signals from a polished page", () => {
  const report = analyzeSource({
    label: "Velvet Arcade",
    source: "https://example.com",
    finalUrl: "https://example.com",
    status: 200,
    fetchedAt: "2026-06-08T09:00:00.000Z",
    html: polishedHtml,
  });

  assert.equal(report.signals.title, "Velvet Arcade");
  assert.equal(report.signals.h1, "Launch cinematic microsites with cleaner proof.");
  assert.deepEqual(report.signals.ctas, ["Start free", "Book walkthrough"]);
  assert.ok(report.scores.overall >= 85);
  assert.match(report.findings.at(-1), /Strong launch surface/);
});

test("analyzeSource flags missing launch hygiene and trust rails", () => {
  const report = analyzeSource({
    label: "Plain page",
    source: "fixture.html",
    status: 200,
    fetchedAt: "2026-06-08T09:00:00.000Z",
    html: sparseHtml,
  });

  assert.equal(report.signals.metaDescription, "");
  assert.ok(report.findings.some((item) => item.includes("meta description")));
  assert.ok(report.findings.some((item) => item.includes("og:image")));
  assert.ok(report.scores.overall < 70);
});

test("receipt renderers include key scoring and signal content", () => {
  const report = analyzeSource({
    label: "Velvet Arcade",
    source: "https://example.com",
    finalUrl: "https://example.com",
    status: 200,
    fetchedAt: "2026-06-08T09:00:00.000Z",
    html: polishedHtml,
  });

  const markdown = buildMarkdownReceipt(report);
  const html = buildHtmlReceipt(report);

  assert.match(markdown, /Grade: A/);
  assert.match(markdown, /CTA cues: Start free \| Book walkthrough/);
  assert.match(html, /Browser Ritual Receipt/);
  assert.match(html, /CTA Surface/);
});

test("writeArtifacts persists markdown, html, and summary files", async () => {
  const report = analyzeSource({
    label: "Velvet Arcade",
    source: "https://example.com",
    finalUrl: "https://example.com",
    status: 200,
    fetchedAt: "2026-06-08T09:00:00.000Z",
    html: polishedHtml,
  });
  const outDir = await mkdtemp(path.join(tmpdir(), "browser-ritual-"));

  await writeArtifacts(report, outDir);

  const markdown = await readFile(path.join(outDir, "receipt.md"), "utf8");
  const summary = JSON.parse(await readFile(path.join(outDir, "summary.json"), "utf8"));

  assert.match(markdown, /Signal Board/);
  assert.equal(summary.grade, "A");
  assert.deepEqual(summary.ctas, ["Start free", "Book walkthrough"]);
});

test("loadSource reads local html fixtures", async () => {
  const fixturePath = new URL("../sample/velvet-arcade.html", import.meta.url);
  const source = await loadSource(fixturePath);
  const report = analyzeSource(source);

  assert.equal(source.label, "velvet-arcade");
  assert.equal(report.signals.title, "Velvet Arcade | Launch cinematic microsites fast");
});

test("summarizeReport keeps the portable publication fields", () => {
  const report = analyzeSource({
    label: "Velvet Arcade",
    source: "https://example.com",
    finalUrl: "https://example.com",
    status: 200,
    fetchedAt: "2026-06-08T09:00:00.000Z",
    html: polishedHtml,
  });

  assert.deepEqual(summarizeReport(report), {
    label: "Velvet Arcade",
    source: "https://example.com",
    overall: report.scores.overall,
    grade: "A",
    ctas: ["Start free", "Book walkthrough"],
    trustLinks: ["Pricing", "Privacy", "Terms", "Docs"],
    findings: report.findings,
  });
});
