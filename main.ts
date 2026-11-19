// Leonida Platinum Atlas — the handover program for gta6-trophy-guide-01.
//
// The guide itself is the static web app in app/ (index.html, its stylesheet,
// its ES modules and app/data/trophies.json: all 55 official GTA VI trophies
// with a cited guide to each). This program hands the entry in: it copies
// app/ and screenshots/ into the output directory and writes dossier.json
// there with buildDossier from vendor/makefun-frontend.ts — the kit's
// library, left byte-identical, because the scorer rebuilds the dossier with
// its own copy and requires the two to match byte for byte.
//
// Output directory: /output inside the grader; outside it, the
// MAKEFUN_OUTPUT_DIR environment variable names the stand-in. The output
// directory itself is never removed — in the grader it is a mount, and
// removing it would crash the run — so only its contents are cleared.
//
// Node 22+, standard library only, no network. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this competition, passed to buildDossier so this
// program refuses exactly what the scorer would refuse: the dossier text
// cap shapes the bytes; the rest are guards (at most 4 screenshots, each at
// most 256 KiB; app/ at most 993 files and directories and 48 MiB).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function clearDirectoryContents(dir: string): void {
  // Delete every entry inside dir, never dir itself: the grader mounts the
  // output directory, and a removed mount point crashes the run.
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function handIn(): void {
  // Fail early with a readable message rather than the dossier library's
  // refusal if the app was never built beside this program.
  if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
    throw new Error('app/index.html is missing: build the guide in app/ before handing it in.');
  }

  mkdirSync(outputDir, { recursive: true });
  clearDirectoryContents(outputDir);

  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const screenshotsHere = join(repoRoot, 'screenshots');
  if (existsSync(screenshotsHere)) {
    cpSync(screenshotsHere, join(outputDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
