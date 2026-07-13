import { analyzeManifest, loadManifest, writeArtifacts } from "../src/relay-baton.mjs";

const [, , target, outDir = "dist"] = process.argv;

if (!target) {
  console.error("Usage: node scripts/run-relay-baton.mjs <manifest.json> [out-dir]");
  process.exitCode = 1;
} else {
  const manifest = await loadManifest(target);
  const report = analyzeManifest(manifest);
  await writeArtifacts(report, outDir);
  console.log(`Relay Baton written to ${outDir}`);
}
