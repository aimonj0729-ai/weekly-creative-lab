import { analyzeSource, loadSource, writeArtifacts } from "../src/browser-ritual.mjs";

const [, , target, outDir = "dist"] = process.argv;

if (!target) {
  console.error("Usage: node scripts/run-browser-ritual.mjs <url-or-html-file> [out-dir]");
  process.exitCode = 1;
} else {
  const source = await loadSource(target);
  const report = analyzeSource(source);
  await writeArtifacts(report, outDir);
  console.log(`Browser Ritual Receipt written to ${outDir}`);
}
