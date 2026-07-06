import { analyzeManifest, loadManifest, writeArtifacts } from "../src/approval-atlas.mjs";

const [, , target, outDir = "dist"] = process.argv;

if (!target) {
  console.error("Usage: node scripts/run-approval-atlas.mjs <manifest.json> [out-dir]");
  process.exitCode = 1;
} else {
  const manifest = await loadManifest(target);
  const atlas = analyzeManifest(manifest);
  await writeArtifacts(atlas, outDir);
  console.log(`Approval Atlas written to ${outDir}`);
}
