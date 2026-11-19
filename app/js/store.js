// Progress store for the Leonida Platinum Atlas.
//
// Everything the tracker remembers lives in one localStorage record:
// earned flags per trophy, progress counters for trophies that carry a PSN
// count, personal notes, and the spoiler-shield setting. Nothing ever leaves
// the browser except when the reader explicitly exports it to a file.

export const STORAGE_KEY = 'leonida-platinum-atlas-v1';

export function emptyProgress() {
  return { earned: {}, counts: {}, notes: {}, spoilerShield: false };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoilerShield: parsed.spoilerShield === true,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: the tracker keeps working for this session.
  }
}

export function isEarned(progress, trophy) {
  return progress.earned[trophy.name] === true;
}

export function setEarned(progress, trophy, on) {
  if (on) progress.earned[trophy.name] = true;
  else delete progress.earned[trophy.name];
  // Reaching a PSN count in full is the trophy: keep the two in step.
  if (on && trophy.count) progress.counts[trophy.name] = trophy.count;
  if (!on && trophy.count && progress.counts[trophy.name] === trophy.count) {
    delete progress.counts[trophy.name];
  }
}

export function getCount(progress, trophy) {
  const value = progress.counts[trophy.name];
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function setCount(progress, trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.count ?? 0, Math.floor(value)));
  if (clamped === 0) delete progress.counts[trophy.name];
  else progress.counts[trophy.name] = clamped;
  if (trophy.count && clamped >= trophy.count) progress.earned[trophy.name] = true;
  else if (trophy.count && isEarned(progress, trophy)) delete progress.earned[trophy.name];
}

export function getNote(progress, trophy) {
  const value = progress.notes[trophy.name];
  return typeof value === 'string' ? value : '';
}

export function setNote(progress, trophy, text) {
  if (text.trim() === '') delete progress.notes[trophy.name];
  else progress.notes[trophy.name] = text;
}

export function exportProgress(progress) {
  const payload = {
    app: 'leonida-platinum-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: progress.earned,
    counts: progress.counts,
    notes: progress.notes,
    spoilerShield: progress.spoilerShield,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-platinum-atlas-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function parseImportedProgress(text) {
  const parsed = JSON.parse(text);
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  // Accept both this atlas's export shape and a bare { earned, counts, notes } object.
  return {
    earned: source.earned && typeof source.earned === 'object' ? source.earned : {},
    counts: source.counts && typeof source.counts === 'object' ? source.counts : {},
    notes: source.notes && typeof source.notes === 'object' ? source.notes : {},
    spoilerShield: source.spoilerShield === true,
  };
}
