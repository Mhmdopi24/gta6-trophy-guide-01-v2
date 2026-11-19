// Rendering for the Leonida Platinum Atlas: the checklist, the detail pane,
// the roadmap, the missables page and the Next up planner.
//
// Every view is built from text nodes and elements created in code — no
// trophy text is ever injected as markup — so the official names and
// descriptions render exactly as published, punctuation and all.

import { KIND_LABELS, isMasked, maskedName, maskedDescription, byRoadmapOrder, currentStage } from './filters.js';
import { isEarned, getCount, getNote } from './store.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeTag(trophy) {
  return el('span', `tag tag-grade tag-grade-${trophy.grade}`, trophy.grade);
}

function kindTags(trophy) {
  const wrap = el('span', 'trophy-tags');
  wrap.append(gradeTag(trophy));
  for (const kind of trophy.kinds) {
    const isMissableKind = kind === 'missable';
    wrap.append(el('span', `tag${isMissableKind ? ' tag-missable' : ''}`, KIND_LABELS[kind] ?? kind));
  }
  if (trophy.missable && !trophy.kinds.includes('missable')) {
    wrap.append(el('span', 'tag tag-missable', 'Missable'));
  }
  if (trophy.hidden) wrap.append(el('span', 'tag tag-hidden', 'Hidden on PSN'));
  if (trophy.count) {
    wrap.append(el('span', 'tag tag-count', `PSN count ${trophy.count.toLocaleString('en-US')}`));
  }
  return wrap;
}

function sourceLabel(data, key) {
  return data.sources[key] ?? key;
}

export function renderHeader(ctx) {
  const { data, progress } = ctx;
  const earned = data.trophies.filter((t) => isEarned(progress, t));
  document.getElementById('earned-count').textContent = String(earned.length);
  document.getElementById('earned-percent').textContent = `${Math.round((earned.length / data.trophies.length) * 100)}%`;
  const meter = document.getElementById('overall-meter');
  meter.setAttribute('aria-valuenow', String(earned.length));
  document.getElementById('overall-fill').style.width = `${(earned.length / data.trophies.length) * 100}%`;
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = data.trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => isEarned(progress, t));
    document.getElementById(`tally-${grade}`).textContent = `${got.length}/${all.length}`;
  }
  const missablesLeft = data.trophies.filter((t) => t.missable && !isEarned(progress, t)).length;
  document.getElementById('missable-badge').textContent = String(missablesLeft);
}

export function renderChecklist(ctx) {
  const { data, progress, visible, selectedName, onSelect, onToggleEarned } = ctx;
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  const earnedVisible = visible.filter((t) => isEarned(progress, t)).length;
  document.getElementById('list-summary').textContent =
    `Showing ${visible.length} of ${data.trophies.length} trophies · ${earnedVisible} earned in this view. Click a trophy to open its guide.`;
  for (const trophy of visible) {
    const earned = isEarned(progress, trophy);
    const masked = isMasked(trophy, progress, isEarned);
    const row = el('div', `trophy-row${earned ? ' is-earned' : ''}${trophy.name === selectedName ? ' is-selected' : ''}`);
    row.setAttribute('role', 'button');
    row.tabIndex = 0;

    const checkWrap = el('label', 'trophy-check');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggleEarned(trophy, box.checked));
    checkWrap.append(box);

    const main = el('div', 'trophy-main');
    const name = el('div', 'trophy-name', masked ? maskedName(trophy) : trophy.name);
    if (masked) name.classList.add('masked');
    const desc = el('div', 'trophy-desc', masked ? maskedDescription() : trophy.description);
    main.append(name, desc, kindTags(trophy));
    if (trophy.count) {
      const count = getCount(progress, trophy);
      if (count > 0 && !earned) {
        const progressLine = el('div', 'trophy-desc', `Progress: ${count.toLocaleString('en-US')} / ${trophy.count.toLocaleString('en-US')} ${trophy.countUnit ?? ''}`);
        main.append(progressLine);
      }
    }

    row.append(checkWrap, main);
    row.addEventListener('click', () => onSelect(trophy));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(trophy); }
    });
    list.append(row);
  }
  if (visible.length === 0) {
    list.append(el('p', 'detail-empty', 'No trophies match these filters. Loosen the search or reset a filter to see the full list of 55.'));
  }
}

export function renderDetail(ctx) {
  const { data, progress, trophy, onToggleEarned, onCountChange, onNoteChange } = ctx;
  const pane = document.getElementById('detail-pane');
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'detail-empty', 'Select a trophy from the list to read its guide here — official description, earliest point, steps, missable warnings, sources, your notes and its progress counter.'));
    return;
  }
  const earned = isEarned(progress, trophy);
  const masked = isMasked(trophy, progress, isEarned);

  const gradeLine = el('div', 'detail-grade-line');
  gradeLine.append(kindTags(trophy));
  pane.append(gradeLine);

  pane.append(el('h2', '', masked ? maskedName(trophy) : trophy.name));
  const official = el('p', 'detail-official', masked ? maskedDescription() : `"${trophy.description}"`);
  pane.append(official);
  pane.append(el('p', 'detail-meta', `Official description, grade (${trophy.grade})${trophy.hidden ? ', hidden on PlayStation until earned' : ''} — as published on the official list.`));

  const kindsLine = el('p', 'detail-meta');
  const kindsStrong = el('strong', '', 'Kind: ');
  kindsLine.append(kindsStrong, document.createTextNode(trophy.kinds.map((k) => KIND_LABELS[k] ?? k).join(', ')));
  pane.append(kindsLine);

  const earliest = el('p', 'detail-meta');
  earliest.append(el('strong', '', 'Earliest point: '), document.createTextNode(trophy.earliest));
  pane.append(earliest);

  const stageLine = el('p', 'detail-meta');
  const stage = data.stages.find((s) => s.n === trophy.stage);
  stageLine.append(el('strong', '', 'Roadmap stage: '), document.createTextNode(stage ? `${stage.n} — ${stage.title}` : String(trophy.stage)));
  pane.append(stageLine);

  if (trophy.missable) {
    const box = el('div', 'missable-box');
    box.append(el('strong', '', '⚠ Missable. '), document.createTextNode(trophy.missableNote ?? ''));
    if (trophy.pointOfNoReturn) {
      box.append(document.createElement('br'));
      box.append(el('strong', '', 'Point of no return: '), document.createTextNode(trophy.pointOfNoReturn));
    }
    pane.append(box);
  }

  pane.append(el('h3', '', 'Guide'));
  pane.append(el('p', 'detail-guide', trophy.guide));

  pane.append(el('h3', '', 'Steps'));
  const steps = el('ol', 'detail-steps');
  for (const step of trophy.steps ?? []) steps.append(el('li', '', step));
  pane.append(steps);

  if (trophy.count) {
    pane.append(el('h3', '', `Progress — PSN count ${trophy.count.toLocaleString('en-US')}`));
    const count = getCount(progress, trophy);
    const box = el('div', 'counter-box');
    const stepSize = trophy.countStep ?? 1;
    const minus = el('button', 'counter-btn', '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', 'Decrease progress');
    minus.addEventListener('click', () => onCountChange(trophy, count - stepSize));
    const value = el('span', 'counter-value', `${count.toLocaleString('en-US')} / ${trophy.count.toLocaleString('en-US')}`);
    const plus = el('button', 'counter-btn', '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', 'Increase progress');
    plus.addEventListener('click', () => onCountChange(trophy, count + stepSize));
    const bar = el('div', 'meter counter-bar');
    const fill = el('span', '');
    fill.style.width = `${Math.min(100, (count / trophy.count) * 100)}%`;
    bar.append(fill);
    box.append(minus, value, plus, bar);
    pane.append(box);
    pane.append(el('p', 'detail-meta', `Counter steps by ${stepSize.toLocaleString('en-US')} (${trophy.countUnit ?? 'units'}). Reaching the full count marks the trophy earned.`));
  }

  pane.append(el('h3', '', 'Your notes'));
  const notes = document.createElement('textarea');
  notes.className = 'notes-area';
  notes.placeholder = 'Your own notes for this trophy — saved in this browser.';
  notes.value = getNote(progress, trophy);
  notes.addEventListener('change', () => onNoteChange(trophy, notes.value));
  pane.append(notes);

  pane.append(el('h3', '', 'Sources'));
  const sources = el('ul', 'sources-list');
  for (const key of trophy.sources ?? []) sources.append(el('li', '', sourceLabel(data, key)));
  pane.append(sources);

  const earnedRow = el('label', 'detail-earned-row');
  const boxInput = document.createElement('input');
  boxInput.type = 'checkbox';
  boxInput.checked = earned;
  boxInput.addEventListener('change', () => onToggleEarned(trophy, boxInput.checked));
  earnedRow.append(boxInput, document.createTextNode(earned ? 'Earned — nice work.' : 'Mark as earned'));
  pane.append(earnedRow);
}

export function renderRoadmap(ctx) {
  const { data, progress, onSelect } = ctx;
  const wrap = document.getElementById('roadmap-stages');
  wrap.replaceChildren();
  const ordered = [...data.trophies].sort(byRoadmapOrder);
  for (const stage of data.stages) {
    const trophies = ordered.filter((t) => t.stage === stage.n);
    const earnedCount = trophies.filter((t) => isEarned(progress, t)).length;
    const section = el('section', 'stage');
    const head = el('div', 'stage-head');
    const title = el('h3', '');
    title.append(el('span', 'stage-n', `Stage ${stage.n}`), document.createTextNode(stage.title));
    head.append(title, el('span', 'stage-count', `${earnedCount} / ${trophies.length} earned`));
    section.append(head);
    section.append(el('p', 'stage-detail', stage.detail));
    const meter = el('div', 'meter');
    const fill = el('span', '');
    fill.style.width = `${trophies.length ? (earnedCount / trophies.length) * 100 : 0}%`;
    meter.append(fill);
    section.append(meter);
    const chips = el('ul', 'stage-trophies');
    for (const trophy of trophies) {
      const earned = isEarned(progress, trophy);
      const chip = el('button', `stage-chip${earned ? ' is-earned' : ''}`, '');
      chip.type = 'button';
      if (earned) chip.append(el('span', 'chip-state', '✓'));
      chip.append(document.createTextNode(trophy.name));
      if (trophy.missable && !earned) chip.append(el('span', 'chip-flag', 'Missable'));
      chip.addEventListener('click', () => onSelect(trophy, 'checklist'));
      chips.append(chip);
    }
    section.append(chips);
    wrap.append(section);
  }
}

export function renderMissables(ctx) {
  const { data, progress, onSelect } = ctx;
  const wrap = document.getElementById('missable-list');
  wrap.replaceChildren();
  const missables = data.trophies.filter((t) => t.missable).sort(byRoadmapOrder);
  for (const trophy of missables) {
    const earned = isEarned(progress, trophy);
    const card = el('article', 'missable-card');
    const title = el('h3', '', trophy.name);
    card.append(title);
    card.append(el('p', 'detail-meta', `Roadmap stage ${trophy.stage} · ${trophy.grade}${earned ? ' · Earned ✓' : ' · Not yet earned'}`));
    card.append(el('p', 'detail-official', `"${trophy.description}"`));
    const why = el('p', '');
    why.append(el('strong', '', 'Why it can be missed: '), document.createTextNode(trophy.missableNote ?? ''));
    card.append(why);
    if (trophy.pointOfNoReturn) {
      const ponr = el('p', 'ponr', '');
      ponr.append(el('strong', '', 'Point of no return: '), document.createTextNode(trophy.pointOfNoReturn));
      card.append(ponr);
    }
    const earliest = el('p', '');
    earliest.append(el('strong', '', 'Earliest point: '), document.createTextNode(trophy.earliest));
    card.append(earliest);
    const open = el('button', 'tool-btn', 'Open the full guide');
    open.type = 'button';
    open.addEventListener('click', () => onSelect(trophy, 'checklist'));
    card.append(open);
    wrap.append(card);
  }
}

export function renderNext(ctx) {
  const { data, progress, onSelect } = ctx;
  const list = document.getElementById('next-list');
  list.replaceChildren();
  const stageNow = currentStage(data.trophies, progress, isEarned);
  const remaining = data.trophies
    .filter((t) => !isEarned(progress, t))
    .sort((a, b) => {
      const riskA = a.missable && a.stage <= stageNow ? 0 : 1;
      const riskB = b.missable && b.stage <= stageNow ? 0 : 1;
      if (riskA !== riskB) return riskA - riskB;
      return byRoadmapOrder(a, b);
    })
    .slice(0, 12);
  if (remaining.length === 0) {
    list.append(el('p', 'detail-empty', 'Nothing left — every trophy is earned. Leonida Legend status: achieved.'));
    return;
  }
  for (const trophy of remaining) {
    const atRisk = trophy.missable && trophy.stage <= stageNow;
    const item = el('button', `next-item${atRisk ? ' is-risk' : ''}`, '');
    item.type = 'button';
    item.append(el('span', 'trophy-name', trophy.name));
    const whyText = atRisk
      ? `Missable — at risk now (stage ${trophy.stage})`
      : trophy.missable
        ? `Missable later — stage ${trophy.stage}`
        : `Stage ${trophy.stage} · ${trophy.grade}`;
    item.append(el('span', 'next-why', whyText));
    item.addEventListener('click', () => onSelect(trophy, 'checklist'));
    list.append(item);
  }
}
