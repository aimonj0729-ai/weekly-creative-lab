import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildHtmlDocument,
  buildMarkdownHero,
  summarizeManifest,
  validateManifest,
} from "../src/skillloom.mjs";

async function loadManifest(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main(argv) {
  const inputPath = argv[2] || "sample/browser-ritual.json";
  const outputDir = argv[3] || "dist";
  const manifest = await loadManifest(inputPath);

  validateManifest(manifest);

  await mkdir(outputDir, { recursive: true });

  await Promise.all([
    writeFile(path.join(outputDir, "index.html"), buildHtmlDocument(manifest), "utf8"),
    writeFile(path.join(outputDir, "README-hero.md"), buildMarkdownHero(manifest), "utf8"),
    writeFile(
      path.join(outputDir, "summary.json"),
      `${JSON.stringify(summarizeManifest(manifest), null, 2)}\n`,
      "utf8",
    ),
  ]);

  process.stdout.write(`Rendered Skillloom card to ${outputDir}\n`);
}

main(process.argv).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
