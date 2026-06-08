import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const CTA_PATTERNS = [
  /start/i,
  /sign up/i,
  /join/i,
  /watch demo/i,
  /demo/i,
  /try/i,
  /download/i,
  /install/i,
  /book/i,
  /contact/i,
];

const TRUST_PATTERNS = [/privacy/i, /terms/i, /docs/i, /contact/i, /pricing/i];

export function validateTarget(target) {
  if (
    !(typeof target === "string" && target.trim().length > 0) &&
    !(target instanceof URL)
  ) {
    throw new Error("Target must be a non-empty string.");
  }
}

export function isHttpTarget(target) {
  return /^https?:\/\//i.test(target);
}

export async function loadSource(target) {
  validateTarget(target);
  const normalizedTarget =
    target instanceof URL ? fileURLToPath(target) : target;

  if (isHttpTarget(normalizedTarget)) {
    const response = await fetch(normalizedTarget, {
      headers: {
        "user-agent": "browser-ritual-receipt/0.1 (+https://github.com/aimonj0729-ai/weekly-creative-lab)",
      },
      redirect: "follow",
    });

    return {
      label: new URL(normalizedTarget).hostname,
      source: normalizedTarget,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      fetchedAt: new Date().toISOString(),
      html: await response.text(),
    };
  }

  return {
    label: path.basename(normalizedTarget, path.extname(normalizedTarget)),
    source: normalizedTarget,
    finalUrl: null,
    status: 200,
    contentType: "text/html; charset=utf-8",
    fetchedAt: new Date().toISOString(),
    html: await readFile(normalizedTarget, "utf8"),
  };
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function matchTagContent(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

function matchMetaContent(html, key, value) {
  const pattern = new RegExp(
    `<meta[^>]*${key}=["']${value}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const direct = html.match(pattern);
  if (direct) {
    return decodeEntities(direct[1]).trim();
  }

  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${key}=["']${value}["'][^>]*>`,
    "i",
  );
  const reverse = html.match(reversePattern);
  return reverse ? decodeEntities(reverse[1]).trim() : "";
}

function matchLinkHref(html, relValue) {
  const pattern = new RegExp(
    `<link[^>]*rel=["'][^"']*${relValue}[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const direct = html.match(pattern);
  if (direct) {
    return direct[1].trim();
  }

  const reversePattern = new RegExp(
    `<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*${relValue}[^"']*["'][^>]*>`,
    "i",
  );
  const reverse = html.match(reversePattern);
  return reverse ? reverse[1].trim() : "";
}

function collectInteractiveTexts(html) {
  const matches = html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi);
  return Array.from(matches, (match) => stripTags(match[2])).filter(Boolean);
}

function collectMatches(items, patterns) {
  return items.filter((item) => patterns.some((pattern) => pattern.test(item)));
}

function compact(items) {
  return [...new Set(items.filter(Boolean))];
}

function scoreChecklist(signals) {
  let access = 0;
  let clarity = 0;
  let hygiene = 0;
  let trust = 0;

  if (signals.status >= 200 && signals.status < 400) access += 10;
  if (signals.title) access += 7;
  if (signals.h1) access += 8;

  if (signals.metaDescription) clarity += 8;
  if (signals.ctas.length >= 1) clarity += 9;
  if (signals.ctas.length >= 2) clarity += 4;
  if (signals.navPresent) clarity += 4;

  if (signals.viewport) hygiene += 5;
  if (signals.ogTitle) hygiene += 5;
  if (signals.ogDescription) hygiene += 5;
  if (signals.ogImage) hygiene += 5;
  if (signals.canonical) hygiene += 3;
  if (signals.favicon) hygiene += 2;

  if (signals.footerPresent) trust += 8;
  if (signals.trustLinks.length >= 2) trust += 9;
  if (signals.trustLinks.length >= 4) trust += 4;
  if (signals.finalUrl || signals.source) trust += 4;

  return {
    access,
    clarity,
    hygiene,
    trust,
    overall: access + clarity + hygiene + trust,
  };
}

function buildFindings(signals, scores) {
  const findings = [];

  if (!signals.metaDescription) {
    findings.push("Add a meta description so the pitch travels better outside the homepage.");
  }
  if (!signals.ogImage) {
    findings.push("Missing og:image. The launch page has no visual receipt when shared.");
  }
  if (!signals.viewport) {
    findings.push("No viewport meta tag found. Mobile launch quality is unproven.");
  }
  if (signals.ctas.length === 0) {
    findings.push("No clear CTA detected. The page looks presentational more than actionable.");
  }
  if (signals.trustLinks.length < 2) {
    findings.push("Trust rails are thin. Add docs, privacy, pricing, or contact destinations.");
  }
  if (scores.overall >= 85) {
    findings.push("Strong launch surface. The page already reads like something that can be shown publicly.");
  }

  return findings;
}

function gradeScore(overall) {
  if (overall >= 90) return "A";
  if (overall >= 80) return "A-";
  if (overall >= 70) return "B";
  if (overall >= 60) return "C";
  return "Needs polish";
}

export function analyzeSource(input) {
  if (!input || typeof input.html !== "string") {
    throw new Error("Input must include html.");
  }

  const interactiveTexts = compact(collectInteractiveTexts(input.html));
  const ctas = compact(collectMatches(interactiveTexts, CTA_PATTERNS));
  const trustLinks = compact(collectMatches(interactiveTexts, TRUST_PATTERNS));

  const signals = {
    label: input.label ?? "Untitled target",
    source: input.source ?? "",
    finalUrl: input.finalUrl ?? "",
    status: input.status ?? 0,
    contentType: input.contentType ?? "",
    fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    title: matchTagContent(input.html, "title"),
    h1: matchTagContent(input.html, "h1"),
    metaDescription: matchMetaContent(input.html, "name", "description"),
    viewport: matchMetaContent(input.html, "name", "viewport"),
    ogTitle: matchMetaContent(input.html, "property", "og:title"),
    ogDescription: matchMetaContent(input.html, "property", "og:description"),
    ogImage: matchMetaContent(input.html, "property", "og:image"),
    canonical: matchLinkHref(input.html, "canonical"),
    favicon: matchLinkHref(input.html, "icon"),
    navPresent: /<nav\b/i.test(input.html),
    footerPresent: /<footer\b/i.test(input.html),
    ctas,
    trustLinks,
  };

  const scores = scoreChecklist(signals);
  const findings = buildFindings(signals, scores);

  return {
    signals,
    scores: {
      ...scores,
      grade: gradeScore(scores.overall),
    },
    findings,
  };
}

export function buildMarkdownReceipt(report) {
  const { signals, scores, findings } = report;

  const ctaList = signals.ctas.length ? signals.ctas.join(" | ") : "none detected";
  const trustList = signals.trustLinks.length ? signals.trustLinks.join(" | ") : "none detected";

  return `# Browser Ritual Receipt

## Snapshot

- Target: ${signals.label}
- Source: ${signals.finalUrl || signals.source}
- Status: ${signals.status}
- Fetched: ${signals.fetchedAt}
- Grade: ${scores.grade} (${scores.overall}/100)

## Signal Board

| Dimension | Score |
| --- | ---: |
| Access | ${scores.access}/25 |
| Clarity | ${scores.clarity}/25 |
| Launch Hygiene | ${scores.hygiene}/25 |
| Trust Surface | ${scores.trust}/25 |

## Readout

- Title: ${signals.title || "missing"}
- H1: ${signals.h1 || "missing"}
- CTA cues: ${ctaList}
- Trust cues: ${trustList}

## Findings

${findings.map((item) => `- ${item}`).join("\n")}
`;
}

export function buildHtmlReceipt(report) {
  const { signals, scores, findings } = report;
  const cards = [
    ["Access", scores.access, "Can the page load and state its job quickly?"],
    ["Clarity", scores.clarity, "Do message, CTA, and page structure point in one direction?"],
    ["Launch Hygiene", scores.hygiene, "Are share card and mobile surface details present?"],
    ["Trust Surface", scores.trust, "Are there enough rails to reduce buyer hesitation?"],
  ];

  const ctaMarkup = signals.ctas.length
    ? signals.ctas.map((item) => `<span>${item}</span>`).join("")
    : "<span>none detected</span>";
  const findingMarkup = findings.map((item) => `<li>${item}</li>`).join("");
  const cardMarkup = cards
    .map(
      ([label, score, copy]) => `
        <article class="score-card">
          <p class="eyebrow">${label}</p>
          <strong>${score}<small>/25</small></strong>
          <p>${copy}</p>
        </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Browser Ritual Receipt</title>
    <style>
      :root {
        --ink: #171312;
        --paper: #f3eadf;
        --accent: #d46a2e;
        --pulse: #0f8479;
        --line: rgba(23, 19, 18, 0.14);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Georgia", "Times New Roman", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(212, 106, 46, 0.18), transparent 30%),
          radial-gradient(circle at right 20%, rgba(15, 132, 121, 0.16), transparent 26%),
          linear-gradient(180deg, #fbf6ee 0%, var(--paper) 100%);
      }

      main {
        width: min(1080px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 72px;
      }

      .hero,
      .panel {
        border: 1px solid var(--line);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.62);
        backdrop-filter: blur(14px);
        box-shadow: 0 20px 80px rgba(23, 19, 18, 0.08);
      }

      .hero {
        padding: 32px;
      }

      .badge-row,
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .badge-row span,
      .chip-row span {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        font-size: 13px;
        background: rgba(255, 255, 255, 0.72);
      }

      h1 {
        margin: 18px 0 10px;
        max-width: 12ch;
        font-size: clamp(48px, 8vw, 92px);
        line-height: 0.94;
        letter-spacing: -0.05em;
      }

      .lede {
        max-width: 62ch;
        font-size: 18px;
        line-height: 1.6;
      }

      .score-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 16px;
        margin-top: 28px;
      }

      .score-card {
        padding: 20px;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid var(--line);
      }

      .score-card strong {
        display: block;
        margin-top: 10px;
        font-size: 40px;
        letter-spacing: -0.06em;
      }

      .score-card small {
        margin-left: 6px;
        font-size: 16px;
      }

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 11px;
        color: rgba(23, 19, 18, 0.64);
      }

      .panel {
        margin-top: 20px;
        padding: 24px;
      }

      .panel h2 {
        margin-top: 0;
        font-size: 26px;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      li + li {
        margin-top: 10px;
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }

      .meta p {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid var(--line);
      }

      a {
        color: inherit;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="badge-row">
          <span>Browser Ritual Receipt</span>
          <span>Grade ${scores.grade}</span>
          <span>${scores.overall}/100</span>
        </div>
        <h1>${escapeHtml(signals.label)}</h1>
        <p class="lede">
          A launch-surface receipt for ${escapeHtml(signals.finalUrl || signals.source || signals.label)}.
          It captures whether the page explains itself, asks for action, and leaves enough trust rails in public.
        </p>
        <div class="score-grid">${cardMarkup}</div>
      </section>

      <section class="panel">
        <p class="eyebrow">CTA Surface</p>
        <h2>Calls to action found</h2>
        <div class="chip-row">${ctaMarkup}</div>
      </section>

      <section class="panel">
        <p class="eyebrow">Signal Summary</p>
        <h2>What the page is already saying</h2>
        <div class="meta">
          <p><strong>Title</strong><br />${escapeHtml(signals.title || "missing")}</p>
          <p><strong>H1</strong><br />${escapeHtml(signals.h1 || "missing")}</p>
          <p><strong>Status</strong><br />${signals.status}</p>
          <p><strong>Fetched</strong><br />${escapeHtml(signals.fetchedAt)}</p>
        </div>
      </section>

      <section class="panel">
        <p class="eyebrow">Next Fixes</p>
        <h2>Recommended polish</h2>
        <ul>${findingMarkup}</ul>
      </section>
    </main>
  </body>
</html>`;
}

export function summarizeReport(report) {
  return {
    label: report.signals.label,
    source: report.signals.finalUrl || report.signals.source,
    overall: report.scores.overall,
    grade: report.scores.grade,
    ctas: report.signals.ctas,
    trustLinks: report.signals.trustLinks,
    findings: report.findings,
  };
}

export async function writeArtifacts(report, outDir) {
  await mkdir(outDir, { recursive: true });

  await writeFile(path.join(outDir, "receipt.md"), buildMarkdownReceipt(report));
  await writeFile(path.join(outDir, "index.html"), buildHtmlReceipt(report));
  await writeFile(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(summarizeReport(report), null, 2)}\n`,
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
