import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const STAGE_ORDER = ["discover", "compose", "ship", "cleanup"];
const PERMISSION_WEIGHTS = {
  read: 1,
  network: 2,
  write: 4,
  exec: 5,
  secrets: 4,
};

const TOUCH_WEIGHTS = {
  "public-web": 0,
  workspace: 1,
  filesystem: 2,
  github: 2,
  "prod-data": 4,
  billing: 4,
};

const APPROVAL_COPY = {
  none: "No gate",
  review: "Human review",
  required: "Approval required",
};

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeStage(stage) {
  return typeof stage === "string" && stage.trim() ? stage.trim() : "other";
}

function normalizeList(items) {
  return Array.isArray(items) ? uniq(items.map((item) => String(item).trim().toLowerCase())) : [];
}

function labelForSurface(surface) {
  return surface.label ?? surface.name ?? "Unnamed surface";
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Manifest must be an object.");
  }
  if (!manifest.product || typeof manifest.product.name !== "string" || manifest.product.name.trim() === "") {
    throw new Error("Manifest must include product.name.");
  }
  if (!Array.isArray(manifest.surfaces) || manifest.surfaces.length === 0) {
    throw new Error("Manifest must include at least one surface.");
  }
}

export async function loadManifest(target) {
  const normalizedTarget = target instanceof URL ? fileURLToPath(target) : target;
  const source = await readFile(normalizedTarget, "utf8");
  return JSON.parse(source);
}

function scoreSurface(surface) {
  const permissions = normalizeList(surface.permissions);
  const touches = normalizeList(surface.touches);
  const approval = typeof surface.approval === "string" ? surface.approval.trim().toLowerCase() : "none";
  const destructive = Boolean(surface.destructive);

  let risk = permissions.reduce((total, permission) => total + (PERMISSION_WEIGHTS[permission] ?? 1), 0);
  risk += touches.reduce((total, touch) => total + (TOUCH_WEIGHTS[touch] ?? 1), 0);
  if (destructive) risk += 4;
  if (approval === "none" && permissions.some((item) => item === "write" || item === "exec" || item === "secrets")) {
    risk += 4;
  }

  const highRisk = risk >= 8;
  const gated = approval !== "none";
  const reasons = [];

  if (permissions.includes("exec")) reasons.push("exec");
  if (permissions.includes("write")) reasons.push("write");
  if (permissions.includes("secrets")) reasons.push("secrets");
  if (destructive) reasons.push("destructive");
  if (!gated && highRisk) reasons.push("ungated");

  return {
    ...surface,
    label: labelForSurface(surface),
    stage: normalizeStage(surface.stage),
    permissions,
    touches,
    approval,
    destructive,
    risk,
    highRisk,
    gated,
    reason: reasons.join(", ") || "low-risk read path",
  };
}

function summarizePosture(scoredSurfaces) {
  const highRiskSurfaces = scoredSurfaces.filter((surface) => surface.highRisk);
  const unguardedHighRiskCount = highRiskSurfaces.filter((surface) => !surface.gated).length;

  if (unguardedHighRiskCount > 0) {
    return {
      posture: "Hot",
      unguardedHighRiskCount,
    };
  }

  if (highRiskSurfaces.length > 0) {
    return {
      posture: "Guarded",
      unguardedHighRiskCount: 0,
    };
  }

  return {
    posture: "Light",
    unguardedHighRiskCount: 0,
  };
}

function buildLanes(scoredSurfaces) {
  const stageMap = new Map();

  for (const stage of STAGE_ORDER) {
    stageMap.set(stage, []);
  }

  for (const surface of scoredSurfaces) {
    const laneItems = stageMap.get(surface.stage) ?? [];
    laneItems.push(surface);
    stageMap.set(surface.stage, laneItems);
  }

  return [...stageMap.entries()].map(([stage, items]) => ({
    stage,
    items: [...items].sort((left, right) => right.risk - left.risk),
    totalRisk: items.reduce((sum, item) => sum + item.risk, 0),
  }));
}

function buildHotspots(scoredSurfaces) {
  return [...scoredSurfaces]
    .sort((left, right) => right.risk - left.risk)
    .slice(0, 3)
    .map((surface) => ({
      label: surface.label,
      risk: surface.risk,
      reason: surface.reason,
      stage: surface.stage,
      approval: surface.approval,
    }));
}

export function analyzeManifest(manifest) {
  validateManifest(manifest);
  const scoredSurfaces = manifest.surfaces.map(scoreSurface);
  const postureSummary = summarizePosture(scoredSurfaces);
  const lanes = buildLanes(scoredSurfaces);
  const hotspots = buildHotspots(scoredSurfaces);
  const highestRisk = hotspots[0] ?? null;
  const product = {
    name: manifest.product.name.trim(),
    tagline: manifest.product.tagline?.trim() ?? "",
    operator: manifest.product.operator?.trim() ?? "",
  };

  return {
    product,
    signals: Array.isArray(manifest.signals) ? manifest.signals : [],
    surfaces: scoredSurfaces,
    lanes,
    hotspots,
    summary: {
      surfaceCount: scoredSurfaces.length,
      gatedCount: scoredSurfaces.filter((surface) => surface.gated).length,
      destructiveCount: scoredSurfaces.filter((surface) => surface.destructive).length,
      posture: postureSummary.posture,
      unguardedHighRiskCount: postureSummary.unguardedHighRiskCount,
      highestRisk,
    },
  };
}

function titleCase(value) {
  return value.replace(/(^|[-\s])([a-z])/g, (_, boundary, char) => `${boundary}${char.toUpperCase()}`);
}

export function buildMarkdownAtlas(atlas) {
  const signalLines = atlas.signals.length
    ? atlas.signals.map((signal) => `- [${signal.label}](${signal.url}) — ${signal.note ?? ""}`).join("\n")
    : "- No external signals attached.";

  const laneSections = atlas.lanes
    .map((lane) => {
      const body = lane.items.length
        ? lane.items
            .map(
              (item) =>
                `- **${item.label}** · ${APPROVAL_COPY[item.approval] ?? titleCase(item.approval)} · permissions: ${item.permissions.join(", ")} · risk ${item.risk}`,
            )
            .join("\n")
        : "- No surfaces mapped here.";
      return `### ${titleCase(lane.stage)}\n\n${body}`;
    })
    .join("\n\n");

  const hotspotLines = atlas.hotspots
    .map((item) => `- **${item.label}** — ${item.reason} · ${APPROVAL_COPY[item.approval] ?? titleCase(item.approval)} · risk ${item.risk}`)
    .join("\n");

  return `# Approval Atlas

## Snapshot

- Product: ${atlas.product.name}
- Posture: ${atlas.summary.posture}
- Surfaces: ${atlas.summary.surfaceCount}
- Gated surfaces: ${atlas.summary.gatedCount}
- Destructive surfaces: ${atlas.summary.destructiveCount}
- Unguarded high-risk surfaces: ${atlas.summary.unguardedHighRiskCount}
- Highest risk surface: ${atlas.summary.highestRisk?.label ?? "none"}

## Why it exists

${atlas.product.tagline || "Map the agent surface before it ships."}

## Lane Map

${laneSections}

## Risk Hotspots

${hotspotLines}

## Signal Board

${signalLines}
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildHtmlAtlas(atlas) {
  const laneCards = atlas.lanes
    .map((lane) => {
      const items = lane.items.length
        ? lane.items
            .map(
              (item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(APPROVAL_COPY[item.approval] ?? titleCase(item.approval))}</span><em>risk ${item.risk}</em></li>`,
            )
            .join("")
        : "<li><strong>No mapped surfaces</strong><span>quiet lane</span><em>risk 0</em></li>";

      return `<section class="lane"><h3>${escapeHtml(titleCase(lane.stage))}</h3><ul>${items}</ul></section>`;
    })
    .join("");

  const hotspots = atlas.hotspots
    .map(
      (item) =>
        `<article class="hotspot"><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.reason)}</p><span>${escapeHtml(APPROVAL_COPY[item.approval] ?? titleCase(item.approval))} · risk ${item.risk}</span></article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Approval Atlas</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%23141210'/%3E%3Cpath d='M24 64L48 28l24 36H24z' fill='%23f4a261'/%3E%3C/svg%3E" />
    <style>
      :root {
        color-scheme: light;
        --ink: #171412;
        --sand: #f6efe6;
        --clay: #d97745;
        --sage: #5c7b73;
        --panel: rgba(255, 255, 255, 0.74);
        --line: rgba(23, 20, 18, 0.1);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(244, 162, 97, 0.28), transparent 34%),
          radial-gradient(circle at top right, rgba(92, 123, 115, 0.24), transparent 38%),
          linear-gradient(180deg, #f8f1e8 0%, #efe7db 100%);
      }
      main {
        width: min(1080px, calc(100% - 32px));
        margin: 0 auto;
        padding: 56px 0 72px;
      }
      .hero, .grid, .lane, .hotspot {
        backdrop-filter: blur(18px);
        background: var(--panel);
        border: 1px solid var(--line);
        box-shadow: 0 20px 60px rgba(23, 20, 18, 0.08);
      }
      .hero {
        border-radius: 28px;
        padding: 28px;
      }
      .eyebrow {
        display: inline-block;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(217, 119, 69, 0.12);
        color: var(--clay);
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: clamp(40px, 6vw, 72px);
        line-height: 0.96;
      }
      .lede {
        max-width: 760px;
        font-size: 18px;
        line-height: 1.6;
      }
      .stats, .lanes, .hotspots {
        display: grid;
        gap: 16px;
        margin-top: 24px;
      }
      .stats {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }
      .grid {
        border-radius: 22px;
        padding: 18px;
      }
      .grid strong {
        display: block;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sage);
      }
      .grid span {
        display: block;
        margin-top: 10px;
        font-size: 30px;
        font-weight: 700;
      }
      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 12px;
        margin-top: 38px;
      }
      .lanes {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .lane, .hotspot {
        border-radius: 24px;
        padding: 20px;
      }
      .lane h3, .hotspot h4 {
        margin: 0 0 14px;
      }
      .lane ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
      }
      .lane li {
        display: grid;
        gap: 4px;
        padding: 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.76);
      }
      .lane li span, .hotspot span {
        color: #6f645d;
        font-size: 14px;
      }
      .lane li em {
        font-style: normal;
        color: var(--clay);
      }
      .hotspots {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .footer {
        margin-top: 28px;
        color: #5b524c;
        font-size: 14px;
      }
      @media (max-width: 640px) {
        main { width: min(100% - 20px, 100%); padding-top: 20px; }
        .hero { border-radius: 22px; padding: 22px; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <span class="eyebrow">Approval Atlas</span>
        <h1>${escapeHtml(atlas.product.name)}</h1>
        <p class="lede">${escapeHtml(atlas.product.tagline || "Map where agent power is safe, where it needs a gate, and where it should stay visible.")}</p>
        <div class="stats">
          <div class="grid"><strong>Posture</strong><span>${escapeHtml(atlas.summary.posture)}</span></div>
          <div class="grid"><strong>Surfaces</strong><span>${atlas.summary.surfaceCount}</span></div>
          <div class="grid"><strong>Gated</strong><span>${atlas.summary.gatedCount}</span></div>
          <div class="grid"><strong>Hot Risk</strong><span>${atlas.summary.unguardedHighRiskCount}</span></div>
        </div>
      </section>

      <div class="section-head">
        <h2>Lane Map</h2>
        <p>${escapeHtml(atlas.product.operator || "solo builder")} · staged by workflow moment</p>
      </div>
      <section class="lanes">${laneCards}</section>

      <div class="section-head">
        <h2>Risk Hotspots</h2>
        <p>Highest-friction surfaces worth reviewing before shipping</p>
      </div>
      <section class="hotspots">${hotspots}</section>

      <p class="footer">Built from a small surface manifest to make approvals, trust boundaries, and destructive moments reviewable in one glance.</p>
    </main>
  </body>
</html>`;
}

export function summarizeAtlas(atlas) {
  return {
    product: atlas.product.name,
    posture: atlas.summary.posture,
    surfaceCount: atlas.summary.surfaceCount,
    gatedCount: atlas.summary.gatedCount,
    destructiveCount: atlas.summary.destructiveCount,
    unguardedHighRiskCount: atlas.summary.unguardedHighRiskCount,
    highestRisk: atlas.summary.highestRisk?.label ?? "none",
    hotspotLabels: atlas.hotspots.slice(0, 2).map((item) => item.label),
  };
}

export async function writeArtifacts(atlas, outDir) {
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "atlas.md"), buildMarkdownAtlas(atlas), "utf8");
  await writeFile(path.join(outDir, "index.html"), buildHtmlAtlas(atlas), "utf8");
  await writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(summarizeAtlas(atlas), null, 2)}\n`, "utf8");
}
