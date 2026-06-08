import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHtmlDocument,
  buildMarkdownHero,
  summarizeManifest,
  validateManifest,
} from "../src/skillloom.mjs";

const manifest = {
  name: "Browser Ritual Receipt",
  slug: "browser-ritual-receipt",
  tagline: "Turn a browser QA pass into a polished launch card.",
  summary:
    "Skillloom turns plain JSON manifests into README heroes and glossy one-page HTML drops for agent skills and workflow packs.",
  audience: "Indie builders shipping microsites, tools, and agent workflows.",
  signal: {
    trend: "Web agents, generative UI, and skill packaging are all rising.",
    sources: ["awesome-web-agents", "OpenGenerativeUI", "openpencil"],
  },
  palette: {
    ink: "#161312",
    accent: "#da6b2f",
    mist: "#f6efe6",
    pulse: "#0d8b82",
  },
  artifacts: [
    "README hero block",
    "Launch-ready HTML one-pager",
    "Copyable install and usage section",
  ],
  commands: [
    "node scripts/render-skillloom.mjs sample/browser-ritual.json dist",
    "open dist/index.html",
  ],
  sections: [
    {
      title: "Why this exists",
      body: "The project gives small tools a front door before they need a full website.",
    },
    {
      title: "What ships",
      body: "A manifest becomes a hero, badges, product framing, and a clean usage area.",
    },
  ],
};

test("validateManifest accepts a complete manifest", () => {
  assert.doesNotThrow(() => validateManifest(manifest));
});

test("validateManifest rejects missing core fields", () => {
  assert.throws(
    () => validateManifest({ ...manifest, tagline: "" }),
    /Missing required string field: tagline/,
  );
});

test("buildMarkdownHero includes title, tagline, and commands", () => {
  const markdown = buildMarkdownHero(manifest);

  assert.match(markdown, /# Browser Ritual Receipt/);
  assert.match(markdown, /Turn a browser QA pass into a polished launch card\./);
  assert.match(markdown, /node scripts\/render-skillloom\.mjs/);
});

test("buildHtmlDocument renders decorative sections and palette variables", () => {
  const html = buildHtmlDocument(manifest);

  assert.match(html, /--accent: #da6b2f;/);
  assert.match(html, /Why this exists/);
  assert.match(html, /README hero block/);
});

test("summarizeManifest exposes compact metadata", () => {
  assert.deepEqual(summarizeManifest(manifest), {
    name: "Browser Ritual Receipt",
    slug: "browser-ritual-receipt",
    artifactCount: 3,
    commandCount: 2,
    sectionCount: 2,
  });
});
