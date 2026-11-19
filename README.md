# Leonida Platinum Atlas

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Mhmdopi24/gta6-trophy-guide-01-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Mhmdopi24/gta6-trophy-guide-01-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI PlayStation 5 trophies, built for the [make.fun](https://make.fun) bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

Open `app/index.html` from any static file server (or run `node serve.ts` and visit http://localhost:8080) — the app loads only its own files and works with the network off.

## What it does

- **Checklist & guides.** Every one of the 55 official trophies with its official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation until earned), a checkbox per trophy, a big earned count and percentage in the header, and per-grade tallies.
- **Detail pane.** Click any trophy to open its guide beside the list: the official description, grade, kinds, earliest point, roadmap stage, a step list, a full guide in our own words, a personal-notes field, a progress counter with a progress bar for the 20 trophies that carry a PSN count (250 stunts, 42 Shooting Range challenges, 500 choices, $250,000 laundered, and the rest), a missable warning where flagged, and the trophy's sources.
- **Filters.** By kind (story, missable, collectibles, activities, online — the official list contains no online trophies, and the app says so), by grade, by free-text search, plus a hide-earned toggle.
- **Spoiler shield.** When switched on, unearned story trophies show masked names and descriptions until they are earned.
- **Roadmap.** Ten stages in the order the official descriptions imply — the chapters and missions they name first, missables flagged inline at the stage where they are lost, then collectibles by their counts, activities, and cleanup to 100% and the platinum — each stage listing its trophies with earned state and a per-stage progress bar, with an estimated hours range and a difficulty note in the header, honestly framed as derived from the official descriptions and the cited guides.
- **Missables.** All seven flagged trophies with why and when each can be missed and its point of no return, derived from the official descriptions and labelled as inference where it is inference.
- **Next up.** A planner view: the next unearned trophies in roadmap order, with missable-at-risk trophies first.

## How progress is stored

Progress lives only in the browser's `localStorage` (one record: earned flags, counters, notes, and the spoiler setting). Nothing is sent anywhere. The **Export progress** button downloads it as a JSON file; **Import progress** reads such a file back; **Reset** clears it after a confirmation.

## Data sources

Trophy names, descriptions, grades and hidden flags follow the official list as published by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi) — the two agree on every name, description and grade, and PSNProfiles also lists the counts PlayStation tracks. Guide methods are cross-checked against PowerPyx, PlayStationTrophies.org, the PSNProfiles guide and TrueTrophies, always retold in our own words and cited per trophy in the app; where a step is our own inference from the official description, the guide says so instead of inventing a specific. The look is our own — no Rockstar logos or artwork.

## Handing it in

`main.ts` (Node 22+, standard library only) copies `app/` and `screenshots/` into the output directory (`/output` in the grader, `$MAKEFUN_OUTPUT_DIR` outside it) and writes `dossier.json` there with the kit's vendored `buildDossier` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Entered in the [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) competition on [make.fun](https://make.fun).
