// Leonida Platinum Atlas — boot and wiring.
//
// Loads the official trophy data from data/trophies.json (a file of this app,
// fetched from the same static server — the app works offline once served),
// restores the reader's progress from localStorage, and wires the checklist,
// filters, spoiler shield, export / import / reset, and the four views.

import {
  loadProgress, saveProgress, isEarned, setEarned, setCount, setNote,
  exportProgress, parseImportedProgress,
} from './js/store.js';
import { trophyMatches } from './js/filters.js';
import { renderHeader, renderChecklist, renderDetail, renderRoadmap, renderMissables, renderNext } from './js/views.js';

const data = await (await fetch('data/trophies.json')).json();
const progress = loadProgress();

const state = {
  view: 'checklist',
  selectedName: null,
  filters: { kind: 'all', grade: 'all', search: '', hideEarned: false },
};

const byName = new Map(data.trophies.map((t) => [t.name, t]));
if (!byName.has(state.selectedName)) {
  const missable = data.trophies.find((t) => t.name === 'Actions Speak Louder');
  state.selectedName = missable ? missable.name : data.trophies[0].name;
}

function selectedTrophy() {
  return byName.get(state.selectedName) ?? null;
}

function persistAndRender() {
  saveProgress(progress);
  renderAll();
}

function renderAll() {
  renderHeader({ data, progress });
  const visible = data.trophies.filter((t) => trophyMatches(t, state.filters, progress, isEarned));
  renderChecklist({
    data, progress, visible,
    selectedName: state.selectedName,
    onSelect: (trophy) => selectTrophy(trophy),
    onToggleEarned: (trophy, on) => { setEarned(progress, trophy, on); persistAndRender(); },
  });
  renderDetail({
    data, progress,
    trophy: selectedTrophy(),
    onToggleEarned: (trophy, on) => { setEarned(progress, trophy, on); persistAndRender(); },
    onCountChange: (trophy, value) => { setCount(progress, trophy, value); persistAndRender(); },
    onNoteChange: (trophy, text) => { setNote(progress, trophy, text); saveProgress(progress); },
  });
  renderRoadmap({ data, progress, onSelect: (trophy, view) => selectTrophy(trophy, view) });
  renderMissables({ data, progress, onSelect: (trophy, view) => selectTrophy(trophy, view) });
  renderNext({ data, progress, onSelect: (trophy, view) => selectTrophy(trophy, view) });
  document.getElementById('spoiler-note').hidden = !progress.spoilerShield;
  document.getElementById('online-note').hidden = state.filters.kind !== 'online';
}

function selectTrophy(trophy, view) {
  state.selectedName = trophy.name;
  if (view) showView(view);
  // Arriving from the roadmap, missables or planner: if the current filters
  // would hide this trophy in the checklist, clear them so the reader lands
  // on the row they just picked, with its guide open beside it.
  if (view === 'checklist' && !trophyMatches(trophy, state.filters, progress, isEarned)) {
    state.filters = { kind: 'all', grade: 'all', search: '', hideEarned: false };
    document.getElementById('search').value = '';
    document.getElementById('kind-filter').value = 'all';
    document.getElementById('grade-filter').value = 'all';
    document.getElementById('hide-earned').checked = false;
  }
  renderAll();
  document.getElementById('detail-pane').scrollTop = 0;
}

function showView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => { showView(tab.dataset.view); renderAll(); });
}

document.getElementById('search').addEventListener('input', (event) => {
  state.filters.search = event.target.value;
  renderAll();
});
document.getElementById('kind-filter').addEventListener('change', (event) => {
  state.filters.kind = event.target.value;
  renderAll();
});
document.getElementById('grade-filter').addEventListener('change', (event) => {
  state.filters.grade = event.target.value;
  renderAll();
});
document.getElementById('hide-earned').addEventListener('change', (event) => {
  state.filters.hideEarned = event.target.checked;
  renderAll();
});

const spoilerToggle = document.getElementById('spoiler-toggle');
spoilerToggle.checked = progress.spoilerShield;
spoilerToggle.addEventListener('change', () => {
  progress.spoilerShield = spoilerToggle.checked;
  persistAndRender();
});

document.getElementById('export-btn').addEventListener('click', () => exportProgress(progress));

document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = parseImportedProgress(await file.text());
    progress.earned = imported.earned;
    progress.counts = imported.counts;
    progress.notes = imported.notes;
    progress.spoilerShield = imported.spoilerShield;
    spoilerToggle.checked = progress.spoilerShield;
    persistAndRender();
  } catch {
    alert('That file could not be read as an atlas progress export. Nothing was changed.');
  }
  event.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset all progress? Earned ticks, counters, notes and the spoiler setting will be cleared.')) return;
  progress.earned = {};
  progress.counts = {};
  progress.notes = {};
  progress.spoilerShield = false;
  spoilerToggle.checked = false;
  persistAndRender();
});

renderAll();
