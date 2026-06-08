const REQUIRED_STRINGS = [
  "name",
  "slug",
  "tagline",
  "summary",
  "audience",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertStringField(manifest, key) {
  if (typeof manifest[key] !== "string" || manifest[key].trim() === "") {
    throw new Error(`Missing required string field: ${key}`);
  }
}

function assertStringArray(manifest, key) {
  if (!Array.isArray(manifest[key]) || manifest[key].length === 0) {
    throw new Error(`Expected a non-empty array for: ${key}`);
  }

  for (const value of manifest[key]) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Expected ${key} to contain only non-empty strings.`);
    }
  }
}

function assertSections(manifest) {
  if (!Array.isArray(manifest.sections) || manifest.sections.length === 0) {
    throw new Error("Expected a non-empty array for: sections");
  }

  for (const section of manifest.sections) {
    if (typeof section !== "object" || section === null) {
      throw new Error("Each section must be an object.");
    }

    if (typeof section.title !== "string" || section.title.trim() === "") {
      throw new Error("Each section must include a non-empty title.");
    }

    if (typeof section.body !== "string" || section.body.trim() === "") {
      throw new Error("Each section must include a non-empty body.");
    }
  }
}

function withDefaultPalette(palette = {}) {
  return {
    ink: palette.ink || "#151110",
    accent: palette.accent || "#c75d24",
    mist: palette.mist || "#f4ecdf",
    pulse: palette.pulse || "#0e7c76",
  };
}

export function validateManifest(manifest) {
  if (typeof manifest !== "object" || manifest === null) {
    throw new Error("Expected manifest to be an object.");
  }

  for (const key of REQUIRED_STRINGS) {
    assertStringField(manifest, key);
  }

  if (typeof manifest.signal !== "object" || manifest.signal === null) {
    throw new Error("Expected signal to be an object.");
  }

  if (typeof manifest.signal.trend !== "string" || manifest.signal.trend.trim() === "") {
    throw new Error("Expected signal.trend to be a non-empty string.");
  }

  if (!Array.isArray(manifest.signal.sources) || manifest.signal.sources.length === 0) {
    throw new Error("Expected signal.sources to be a non-empty array.");
  }

  assertStringArray(manifest, "artifacts");
  assertStringArray(manifest, "commands");
  assertSections(manifest);
}

export function summarizeManifest(manifest) {
  validateManifest(manifest);

  return {
    name: manifest.name,
    slug: manifest.slug,
    artifactCount: manifest.artifacts.length,
    commandCount: manifest.commands.length,
    sectionCount: manifest.sections.length,
  };
}

export function buildMarkdownHero(manifest) {
  validateManifest(manifest);

  const badges = [
    `![Skillloom](https://img.shields.io/badge/skillloom-${encodeURIComponent(manifest.slug)}-191919?style=flat-square)`,
    `![Audience](https://img.shields.io/badge/audience-${encodeURIComponent(manifest.audience.slice(0, 22))}-c75d24?style=flat-square)`,
    `![Artifacts](https://img.shields.io/badge/artifacts-${manifest.artifacts.length}-0e7c76?style=flat-square)`,
  ].join("\n");

  const artifacts = manifest.artifacts.map((item) => `- ${item}`).join("\n");
  const commands = manifest.commands.map((command) => `\`${command}\``).join("\n\n");

  return `# ${manifest.name}

<div align="center">

**${manifest.tagline}**

${badges}

</div>

> ${manifest.summary}

## Audience

${manifest.audience}

## Ships With

${artifacts}

## Commands

${commands}
`;
}

function renderList(title, items) {
  const list = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<section class="panel"><p class="eyebrow">${escapeHtml(title)}</p><ul>${list}</ul></section>`;
}

function renderSections(sections) {
  return sections
    .map(
      (section) => `<article class="story-card">
  <h3>${escapeHtml(section.title)}</h3>
  <p>${escapeHtml(section.body)}</p>
</article>`,
    )
    .join("");
}

export function buildHtmlDocument(manifest) {
  validateManifest(manifest);
  const palette = withDefaultPalette(manifest.palette);
  const sourceChips = manifest.signal.sources
    .map((source) => `<span>${escapeHtml(source)}</span>`)
    .join("");
  const commands = manifest.commands
    .map((command) => `<code>${escapeHtml(command)}</code>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(manifest.name)}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%23d56a33'/%3E%3Cpath d='M24 24h14l10 28 10-28h14L56 72H40L24 24z' fill='%23f7efe5'/%3E%3C/svg%3E">
    <style>
      :root {
        --ink: ${palette.ink};
        --accent: ${palette.accent};
        --mist: ${palette.mist};
        --pulse: ${palette.pulse};
        --panel: rgba(255, 255, 255, 0.66);
        --edge: rgba(22, 19, 18, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(218, 107, 47, 0.22), transparent 32%),
          radial-gradient(circle at bottom right, rgba(13, 139, 130, 0.24), transparent 28%),
          linear-gradient(145deg, #fbf4eb 0%, #f2e6d9 52%, #f7f0e7 100%);
      }

      .shell {
        width: min(1080px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 48px 0 72px;
      }

      .hero {
        position: relative;
        overflow: hidden;
        padding: 36px;
        border: 1px solid var(--edge);
        border-radius: 32px;
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.5));
        box-shadow: 0 24px 80px rgba(41, 24, 18, 0.12);
        backdrop-filter: blur(18px);
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: auto -40px -80px auto;
        width: 220px;
        height: 220px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(218, 107, 47, 0.28), transparent 70%);
      }

      .eyebrow {
        margin: 0 0 12px;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-size: 12px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--pulse);
      }

      h1 {
        margin: 0;
        max-width: 12ch;
        font-size: clamp(3rem, 8vw, 5.4rem);
        line-height: 0.92;
      }

      .tagline {
        margin: 20px 0 0;
        max-width: 26ch;
        font-size: clamp(1.15rem, 2.8vw, 1.6rem);
      }

      .lede {
        margin: 28px 0 0;
        max-width: 60ch;
        font-size: 1.04rem;
        line-height: 1.7;
      }

      .signal {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }

      .signal span {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(22, 19, 18, 0.08);
        background: rgba(255, 255, 255, 0.75);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        font-size: 0.92rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 18px;
        margin-top: 20px;
      }

      .panel,
      .story-card,
      .command-bar {
        border-radius: 24px;
        border: 1px solid var(--edge);
        background: var(--panel);
        box-shadow: 0 14px 36px rgba(41, 24, 18, 0.08);
      }

      .panel {
        grid-column: span 6;
        padding: 24px;
      }

      .panel ul {
        margin: 0;
        padding-left: 18px;
        line-height: 1.7;
      }

      .story {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px;
      }

      .story-card {
        padding: 22px;
      }

      .story-card h3 {
        margin: 0 0 10px;
        font-size: 1.15rem;
      }

      .story-card p {
        margin: 0;
        line-height: 1.7;
      }

      .command-bar {
        grid-column: 1 / -1;
        padding: 22px;
      }

      .command-bar code {
        display: block;
        padding: 12px 14px;
        border-radius: 16px;
        overflow-x: auto;
        background: rgba(17, 17, 17, 0.92);
        color: #f8f4ed;
        font-family: "SFMono-Regular", "Menlo", monospace;
      }

      .command-bar code + code {
        margin-top: 12px;
      }

      @media (max-width: 720px) {
        .hero {
          padding: 28px 22px;
          border-radius: 28px;
        }

        .panel {
          grid-column: 1 / -1;
        }

        .shell {
          width: min(100vw - 20px, 1080px);
          padding-top: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Skillloom card</p>
        <h1>${escapeHtml(manifest.name)}</h1>
        <p class="tagline">${escapeHtml(manifest.tagline)}</p>
        <p class="lede">${escapeHtml(manifest.summary)}</p>
        <div class="signal">
          <span>${escapeHtml(manifest.signal.trend)}</span>
          ${sourceChips}
        </div>
      </section>

      <section class="grid">
        ${renderList("Audience", [manifest.audience])}
        ${renderList("Artifacts", manifest.artifacts)}
        <div class="story">${renderSections(manifest.sections)}</div>
        <section class="command-bar">
          <p class="eyebrow">Commands</p>
          ${commands}
        </section>
      </section>
    </main>
  </body>
</html>`;
}
