import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const LANE_ORDER = ["capture", "build", "verify", "ship"];
const STATUS_WEIGHT = {
  done: 0,
  queued: 2,
  active: 4,
  blocked: 6,
};
const RISK_WEIGHT = {
  low: 1,
  medium: 2,
  high: 4,
};
const APPROVAL_WEIGHT = {
  none: 0,
  review: 1,
  required: 2,
};
const APPROVAL_COPY = {
  none: "No gate",
  review: "Review gate",
  required: "Approval required",
};
const STATUS_COPY = {
  done: "Done",
  queued: "Queued",
  active: "Active",
  blocked: "Blocked",
};
const CHECK_COPY = {
  pass: "Pass",
  watch: "Watch",
  fail: "Fail",
};
const BLOCKER_COPY = {
  watch: "Watch",
  hot: "Hot",
};

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeList(items) {
  return Array.isArray(items) ? uniq(items.map((item) => normalizeString(String(item))).filter(Boolean)) : [];
}

function normalizeLane(value) {
  const lane = normalizeString(value, "other").toLowerCase();
  return LANE_ORDER.includes(lane) ? lane : "other";
}

function normalizeStatus(value) {
  const status = normalizeString(value, "queued").toLowerCase();
  return STATUS_WEIGHT[status] === undefined ? "queued" : status;
}

function normalizeApproval(value) {
  const approval = normalizeString(value, "none").toLowerCase();
  return APPROVAL_WEIGHT[approval] === undefined ? "none" : approval;
}

function normalizeRisk(value) {
  const risk = normalizeString(value, "medium").toLowerCase();
  return RISK_WEIGHT[risk] === undefined ? "medium" : risk;
}

function normalizeCheckStatus(value) {
  const status = normalizeString(value, "watch").toLowerCase();
  return CHECK_COPY[status] ? status : "watch";
}

function normalizeSeverity(value) {
  const severity = normalizeString(value, "watch").toLowerCase();
  return BLOCKER_COPY[severity] ? severity : "watch";
}

function titleCase(value) {
  return value.replace(/(^|[-\s])([a-z])/g, (_, boundary, char) => `${boundary}${char.toUpperCase()}`);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Manifest must be an object.");
  }
  if (!manifest.project || normalizeString(manifest.project.name) === "") {
    throw new Error("Manifest must include project.name.");
  }
  if (!manifest.baton || normalizeString(manifest.baton.holder) === "") {
    throw new Error("Manifest must include baton.holder.");
  }
  if (!Array.isArray(manifest.stages) || manifest.stages.length === 0) {
    throw new Error("Manifest must include at least one stage.");
  }
}

export async function loadManifest(target) {
  const normalizedTarget = target instanceof URL ? fileURLToPath(target) : target;
  const source = await readFile(normalizedTarget, "utf8");
  return JSON.parse(source);
}

function scoreStage(stage) {
  const label = normalizeString(stage.label || stage.name, "Unnamed stage");
  const lane = normalizeLane(stage.lane);
  const status = normalizeStatus(stage.status);
  const approval = normalizeApproval(stage.approval);
  const risk = normalizeRisk(stage.risk);
  const tools = normalizeList(stage.tools);
  const output = normalizeString(stage.output, "No output described.");
  const goal = normalizeString(stage.goal, "No goal described.");
  const owner = normalizeString(stage.owner, "Unassigned");
  const note = normalizeString(stage.note);
  const input = normalizeString(stage.input);

  const pressure =
    status === "done" ? 0 : STATUS_WEIGHT[status] + RISK_WEIGHT[risk] + APPROVAL_WEIGHT[approval] + (lane === "ship" ? 1 : 0);

  return {
    ...stage,
    label,
    lane,
    status,
    approval,
    risk,
    tools,
    output,
    goal,
    owner,
    note,
    input,
    pressure,
  };
}

function scoreCheck(check) {
  return {
    label: normalizeString(check.label, "Unnamed check"),
    status: normalizeCheckStatus(check.status),
    note: normalizeString(check.note),
  };
}

function scoreBlocker(blocker) {
  return {
    label: normalizeString(blocker.label, "Unnamed blocker"),
    severity: normalizeSeverity(blocker.severity),
    owner: normalizeString(blocker.owner, "Unassigned"),
    note: normalizeString(blocker.note),
  };
}

function buildRoute(stages) {
  const laneMap = new Map();

  for (const lane of LANE_ORDER) {
    laneMap.set(lane, []);
  }

  for (const stage of stages) {
    const items = laneMap.get(stage.lane) ?? [];
    items.push(stage);
    laneMap.set(stage.lane, items);
  }

  return [...laneMap.entries()].map(([lane, items]) => ({
    lane,
    items,
    openCount: items.filter((item) => item.status !== "done").length,
  }));
}

function pickActiveStage(stages) {
  return (
    stages.find((stage) => stage.status === "active") ??
    stages.find((stage) => stage.status === "blocked") ??
    stages.find((stage) => stage.status === "queued") ??
    stages.at(-1) ??
    null
  );
}

function buildMomentum({ batonStatus, blockedCount, failingChecks, pendingApprovals }) {
  if (batonStatus === "blocked" || blockedCount > 0 || failingChecks > 0) {
    return "Blocked";
  }
  if (batonStatus === "waiting") {
    return "Waiting";
  }
  if (pendingApprovals === 0) {
    return "Ready to pass";
  }
  return "In motion";
}

function summarizeProject(project, baton, stages, checks, blockers, hotspots) {
  const activeStage = pickActiveStage(stages);
  const blockedCount = stages.filter((stage) => stage.status === "blocked").length;
  const pendingApprovals = stages.filter((stage) => stage.status !== "done" && stage.approval !== "none").length;
  const failingChecks = checks.filter((check) => check.status === "fail").length;
  const watchChecks = checks.filter((check) => check.status === "watch").length;
  const batonStatus = normalizeString(baton.status, "moving").toLowerCase();
  const momentum = buildMomentum({
    batonStatus,
    blockedCount,
    failingChecks,
    pendingApprovals,
  });
  const readyToShip = blockedCount === 0 && failingChecks === 0 && pendingApprovals === 0;

  return {
    activeStage,
    blockedCount,
    failingChecks,
    momentum,
    pendingApprovals,
    project: normalizeString(project.name),
    readyToShip,
    stageCount: stages.length,
    watchChecks,
    blockerCount: blockers.length,
    batonStatus,
    highestPressure: hotspots[0] ?? null,
  };
}

export function analyzeManifest(manifest) {
  validateManifest(manifest);

  const project = {
    name: normalizeString(manifest.project.name),
    tagline: normalizeString(manifest.project.tagline),
    operator: normalizeString(manifest.project.operator),
    objective: normalizeString(manifest.project.objective),
  };
  const baton = {
    status: normalizeString(manifest.baton.status, "moving").toLowerCase(),
    holder: normalizeString(manifest.baton.holder),
    next: normalizeString(manifest.baton.next, "Unassigned"),
    handoffWindow: normalizeString(manifest.baton.handoffWindow),
    promise: normalizeString(manifest.baton.promise),
  };
  const signals = Array.isArray(manifest.signals)
    ? manifest.signals.map((signal) => ({
        label: normalizeString(signal.label, "Untitled signal"),
        url: normalizeString(signal.url),
        note: normalizeString(signal.note),
      }))
    : [];
  const stages = manifest.stages.map(scoreStage);
  const checks = Array.isArray(manifest.checks) ? manifest.checks.map(scoreCheck) : [];
  const blockers = Array.isArray(manifest.blockers) ? manifest.blockers.map(scoreBlocker) : [];
  const handoff = {
    from: normalizeString(manifest.handoff?.from, baton.holder),
    to: normalizeString(manifest.handoff?.to, baton.next),
    ask: normalizeString(manifest.handoff?.ask),
    packet: normalizeList(manifest.handoff?.packet),
    nextMessage: normalizeString(manifest.handoff?.nextMessage),
  };
  const route = buildRoute(stages);
  const hotspots = [...stages]
    .filter((stage) => stage.status !== "done")
    .sort((left, right) => right.pressure - left.pressure)
    .slice(0, 3);
  const summary = summarizeProject(project, baton, stages, checks, blockers, hotspots);

  return {
    project,
    baton,
    signals,
    stages,
    route,
    checks,
    blockers,
    hotspots,
    handoff,
    summary,
  };
}

export function summarizeBaton(report) {
  return {
    project: report.project.name,
    batonStatus: report.summary.batonStatus,
    holder: report.baton.holder,
    next: report.baton.next,
    activeStage: report.summary.activeStage?.label ?? "None",
    stageCount: report.summary.stageCount,
    blockedCount: report.summary.blockedCount,
    pendingApprovals: report.summary.pendingApprovals,
    failingChecks: report.summary.failingChecks,
    watchChecks: report.summary.watchChecks,
    readyToShip: report.summary.readyToShip,
    hotspotLabels: report.hotspots.map((stage) => stage.label),
  };
}

export function buildMarkdownBaton(report) {
  const routeSections = report.route
    .map((lane) => {
      const body = lane.items.length
        ? lane.items
            .map(
              (item) =>
                `- **${item.label}** · ${STATUS_COPY[item.status]} · ${APPROVAL_COPY[item.approval]} · owner: ${item.owner} · risk: ${titleCase(
                  item.risk,
                )}`,
            )
            .join("\n")
        : "- No stages mapped here.";
      return `### ${titleCase(lane.lane)}\n\n${body}`;
    })
    .join("\n\n");

  const checkLines = report.checks.length
    ? report.checks.map((check) => `- **${check.label}** · ${CHECK_COPY[check.status]} · ${check.note || "No note."}`).join("\n")
    : "- No checks attached.";

  const blockerLines = report.blockers.length
    ? report.blockers
        .map((blocker) => `- **${blocker.label}** · ${BLOCKER_COPY[blocker.severity]} · owner: ${blocker.owner} · ${blocker.note || "No note."}`)
        .join("\n")
    : "- No blockers attached.";

  const hotspotLines = report.hotspots.length
    ? report.hotspots
        .map((stage) => `- **${stage.label}** · ${STATUS_COPY[stage.status]} · ${APPROVAL_COPY[stage.approval]} · pressure ${stage.pressure}`)
        .join("\n")
    : "- No open hotspots.";

  const packetLines = report.handoff.packet.length ? report.handoff.packet.map((item) => `- ${item}`).join("\n") : "- No packet listed.";
  const signalLines = report.signals.length
    ? report.signals.map((signal) => `- [${signal.label}](${signal.url}) — ${signal.note || "No note."}`).join("\n")
    : "- No external signals attached.";

  return `# Relay Baton

## Snapshot

- Project: ${report.project.name}
- Momentum: ${report.summary.momentum}
- Holder: ${report.baton.holder}
- Next: ${report.baton.next}
- Active stage: ${report.summary.activeStage?.label ?? "None"}
- Pending approvals: ${report.summary.pendingApprovals}
- Failing checks: ${report.summary.failingChecks}
- Ready to ship: ${report.summary.readyToShip ? "yes" : "no"}

## Why it exists

${report.project.tagline || "Keep the handoff clean when more than one operator touches a small launch."}

## Route Map

${routeSections}

## Checks

${checkLines}

## Blockers

${blockerLines}

## Hotspots

${hotspotLines}

## Handoff Packet

${packetLines}

## Next Message

${report.handoff.nextMessage || report.handoff.ask || "No handoff note attached."}

## Signal Board

${signalLines}
`;
}

export function buildHtmlBaton(report) {
  const routeCards = report.route
    .map((lane) => {
      const items = lane.items.length
        ? lane.items
            .map(
              (item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(STATUS_COPY[item.status])}</span><em>${escapeHtml(
                APPROVAL_COPY[item.approval],
              )}</em></li>`,
            )
            .join("")
        : "<li><strong>No mapped stages</strong><span>Idle</span><em>No gate</em></li>";
      return `<article class="lane-card"><p class="eyebrow">${escapeHtml(titleCase(lane.lane))}</p><ul>${items}</ul></article>`;
    })
    .join("");

  const checkCards = report.checks.length
    ? report.checks
        .map(
          (check) =>
            `<li class="chip ${escapeHtml(check.status)}"><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(
              CHECK_COPY[check.status],
            )}</span></li>`,
        )
        .join("")
    : `<li class="chip watch"><strong>No checks</strong><span>Watch</span></li>`;

  const blockerCards = report.blockers.length
    ? report.blockers
        .map(
          (blocker) =>
            `<li><strong>${escapeHtml(blocker.label)}</strong><span>${escapeHtml(BLOCKER_COPY[blocker.severity])}</span><p>${escapeHtml(
              blocker.note || "No note.",
            )}</p></li>`,
        )
        .join("")
    : `<li><strong>No blockers</strong><span>Clear</span><p>The baton is currently clean.</p></li>`;

  const hotspotCards = report.hotspots.length
    ? report.hotspots
        .map(
          (stage) =>
            `<li><strong>${escapeHtml(stage.label)}</strong><span>pressure ${stage.pressure}</span><p>${escapeHtml(
              STATUS_COPY[stage.status],
            )} · ${escapeHtml(APPROVAL_COPY[stage.approval])}</p></li>`,
        )
        .join("")
    : `<li><strong>No hotspots</strong><span>clear</span><p>No open pressure points.</p></li>`;

  const packetList = report.handoff.packet.length
    ? report.handoff.packet.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No packet listed.</li>";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relay Baton</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23111818'/%3E%3Cpath d='M18 38c0-7 5-12 12-12h16v6H30c-4 0-6 2-6 6s2 6 6 6h16v6H30c-7 0-12-5-12-12Z' fill='%23d97a43'/%3E%3Ccircle cx='46' cy='32' r='6' fill='%2379d0c3'/%3E%3C/svg%3E" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1112;
        --panel: rgba(18, 28, 30, 0.82);
        --line: rgba(121, 208, 195, 0.22);
        --text: #f5f1e8;
        --muted: #b7b2a9;
        --accent: #d97a43;
        --mint: #79d0c3;
        --hot: #f39c6b;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(217, 122, 67, 0.18), transparent 32%),
          radial-gradient(circle at top right, rgba(121, 208, 195, 0.15), transparent 28%),
          linear-gradient(160deg, #071012 0%, #0d1718 44%, #12181a 100%);
      }

      main {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      .hero,
      .panel {
        border: 1px solid var(--line);
        background: var(--panel);
        backdrop-filter: blur(20px);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      }

      .hero {
        border-radius: 28px;
        padding: 28px;
        overflow: hidden;
        position: relative;
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: auto -8% -40% 54%;
        height: 240px;
        background: radial-gradient(circle, rgba(121, 208, 195, 0.24), transparent 58%);
        pointer-events: none;
      }

      .eyebrow {
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--mint);
        font-size: 12px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(2.6rem, 5vw, 4.8rem);
        line-height: 0.92;
        max-width: 720px;
      }

      .lede {
        margin-top: 18px;
        max-width: 720px;
        font-size: 1rem;
        line-height: 1.7;
        color: var(--muted);
      }

      .baton-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 28px;
      }

      .metric {
        border-radius: 18px;
        border: 1px solid rgba(245, 241, 232, 0.08);
        background: rgba(245, 241, 232, 0.04);
        padding: 14px 16px;
      }

      .metric span {
        display: block;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .metric strong {
        display: block;
        margin-top: 8px;
        font-size: 1.15rem;
      }

      .grid {
        display: grid;
        grid-template-columns: 1.3fr 0.9fr;
        gap: 18px;
        margin-top: 18px;
      }

      .panel {
        border-radius: 24px;
        padding: 22px;
      }

      .lane-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      .lane-card,
      .spotlist li,
      .blockers li {
        border-radius: 20px;
        border: 1px solid rgba(245, 241, 232, 0.08);
        background: rgba(245, 241, 232, 0.03);
        padding: 16px;
      }

      .lane-card ul,
      .spotlist,
      .blockers,
      .packet,
      .chips {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .lane-card li,
      .spotlist li,
      .blockers li {
        display: grid;
        gap: 6px;
      }

      .lane-card li + li,
      .spotlist li + li,
      .blockers li + li {
        margin-top: 12px;
      }

      .lane-card span,
      .lane-card em,
      .spotlist span,
      .blockers span,
      .chip span {
        color: var(--muted);
        font-style: normal;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .chip {
        min-width: 148px;
        border-radius: 999px;
        padding: 12px 14px;
        border: 1px solid rgba(245, 241, 232, 0.08);
        background: rgba(245, 241, 232, 0.03);
      }

      .chip.pass {
        border-color: rgba(121, 208, 195, 0.38);
      }

      .chip.watch {
        border-color: rgba(217, 122, 67, 0.38);
      }

      .chip.fail {
        border-color: rgba(243, 156, 107, 0.52);
      }

      .packet {
        margin-top: 16px;
        display: grid;
        gap: 10px;
      }

      .packet li {
        border-left: 2px solid var(--mint);
        padding-left: 12px;
        color: var(--muted);
      }

      .note {
        margin-top: 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(121, 208, 195, 0.08);
        border: 1px solid rgba(121, 208, 195, 0.18);
        color: var(--text);
        line-height: 1.7;
      }

      @media (max-width: 860px) {
        .grid,
        .lane-grid,
        .baton-strip {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">Relay Baton</p>
        <h1>${escapeHtml(report.project.name)}</h1>
        <p class="lede">${escapeHtml(
          report.project.tagline || "A one-page handoff pack for agent or human workflows that need cleaner baton passing.",
        )}</p>
        <div class="baton-strip">
          <div class="metric"><span>Momentum</span><strong>${escapeHtml(report.summary.momentum)}</strong></div>
          <div class="metric"><span>Holder</span><strong>${escapeHtml(report.baton.holder)}</strong></div>
          <div class="metric"><span>Next</span><strong>${escapeHtml(report.baton.next)}</strong></div>
          <div class="metric"><span>Active Stage</span><strong>${escapeHtml(report.summary.activeStage?.label ?? "None")}</strong></div>
        </div>
      </section>

      <section class="grid">
        <article class="panel">
          <p class="eyebrow">Route Map</p>
          <div class="lane-grid">${routeCards}</div>
        </article>

        <article class="panel">
          <p class="eyebrow">Checks</p>
          <ul class="chips">${checkCards}</ul>
          <p class="eyebrow" style="margin-top: 22px;">Handoff Packet</p>
          <ul class="packet">${packetList}</ul>
          <div class="note">${escapeHtml(report.handoff.nextMessage || report.handoff.ask || "No handoff note attached.")}</div>
        </article>
      </section>

      <section class="grid">
        <article class="panel">
          <p class="eyebrow">Pressure Points</p>
          <ul class="spotlist">${hotspotCards}</ul>
        </article>

        <article class="panel">
          <p class="eyebrow">Blockers</p>
          <ul class="blockers">${blockerCards}</ul>
        </article>
      </section>
    </main>
  </body>
</html>
`;
}

export async function writeArtifacts(report, outDir) {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(`${outDir}/handoff.md`, buildMarkdownBaton(report), "utf8"),
    writeFile(`${outDir}/index.html`, buildHtmlBaton(report), "utf8"),
    writeFile(`${outDir}/summary.json`, `${JSON.stringify(summarizeBaton(report), null, 2)}\n`, "utf8"),
  ]);
}
