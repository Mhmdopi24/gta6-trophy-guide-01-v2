// Filtering and the spoiler rule for the Leonida Platinum Atlas.
//
// A trophy carries the kinds its official description supports (story,
// missable, collectibles, activities, online). The official list for this
// game contains no online trophies, so that filter is honestly empty.

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export function trophyMatches(trophy, filters, progress, isEarnedFn) {
  if (filters.kind !== 'all' && !trophy.kinds.includes(filters.kind)) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.hideEarned && isEarnedFn(progress, trophy)) return false;
  if (filters.search) {
    const haystack = [
      trophy.name,
      trophy.description,
      trophy.guide,
      trophy.earliest,
      ...trophy.kinds,
      ...(trophy.steps ?? []),
    ].join(' ').toLowerCase();
    const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) if (!haystack.includes(term)) return false;
  }
  return true;
}

// The spoiler rule: with the shield on, an unearned trophy whose kinds
// include "story" is masked — its name and description are hidden until it
// is earned. Hidden-on-PSN trophies are NOT masked by this setting; their
// names and descriptions are published on the official list.
export function isMasked(trophy, progress, isEarnedFn) {
  return progress.spoilerShield === true
    && trophy.kinds.includes('story')
    && !isEarnedFn(progress, trophy);
}

export function maskedName(trophy) {
  return '▒▒▒▒▒▒▒▒▒▒▒▒';
}

export function maskedDescription() {
  return 'Story trophy — name and description hidden by the spoiler shield until earned.';
}

// Roadmap order: stage first, then the trophy's place in the official list.
export function byRoadmapOrder(a, b) {
  return (a.stage - b.stage) || (a.id - b.id);
}

// The stage the reader has reached: the earliest stage that still holds an
// unearned, non-platinum trophy. Missables in or before it are "at risk".
export function currentStage(trophies, progress, isEarnedFn) {
  let stage = 10;
  for (const trophy of trophies) {
    if (trophy.grade === 'platinum') continue;
    if (!isEarnedFn(progress, trophy) && trophy.stage < stage) stage = trophy.stage;
  }
  return stage;
}
