(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const toast = message => {
    const el = $('#sheetToast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.sheetToastTimer);
    window.sheetToastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  };

  // DEMO ONLY — fixed tool pool; no backend, no generated IDs.
  const TOOLS_DEMO = [
    { id: 'CM-001', type: 'CM', reference: 'ST100', lot: '12', machines: 'B1 · B3', process: 'NNPB' },
    { id: 'CM-002', type: 'CM', reference: 'ST21', lot: '07', machines: 'B2', process: 'PS' },
    { id: 'CM-003', type: 'CM', reference: 'ST45', lot: '03', machines: 'B3', process: 'NNPB' },
    { id: 'CM-004', type: 'CM', reference: 'ST72', lot: '09', machines: 'C1', process: 'PB' },
    { id: 'MF-001', type: 'MF', reference: '5447', lot: '08', machines: 'B3', process: 'NNPB' },
    { id: 'MF-002', type: 'MF', reference: '9389', lot: '11', machines: 'B1', process: 'PB' },
    { id: 'MF-003', type: 'MF', reference: '5774', lot: '05', machines: 'B2', process: 'PS' },
    { id: 'BQ-001', type: 'BQ', reference: 'T173', lot: '04', machines: 'B3', process: '—' },
    { id: 'BQ-002', type: 'BQ', reference: 'T188', lot: '08', machines: 'B2', process: '—' },
    { id: 'BQ-003', type: 'BQ', reference: 'T132', lot: '11', machines: 'B1', process: '—' }
  ];

  // DEMO ONLY — fixed IDs for the next tools created in the session.
  const NEXT_TOOL_IDS = { CM: 'CM-007', MF: 'MF-005', BQ: 'BQ-004' };

  // DEMO ONLY — fixed demo sheets.
  const JOBS_DEMO = [
    { id: 'JOBON-001', reference: '5774T173', production: '202603', machine: 'B1', process: 'NNPB', start: '2026-09-20', end: '2026-09-22', cm: 'CM-001', mf: 'MF-001', bq: 'BQ-001', notes: 'Setup CM ST100 confirmado.', readonly: true },
    { id: 'JOBON-002', reference: '5810T188', production: '202602', machine: 'B2', process: 'PS', start: '2026-09-15', end: '2026-09-17', cm: 'CM-002', mf: 'MF-002', bq: 'BQ-002', notes: '', readonly: true },
    { id: 'JOBON-003', reference: '5447T173', production: '202602', machine: 'B3', process: 'NNPB', start: '2026-09-18', end: '2026-09-20', cm: 'CM-003', mf: 'MF-001', bq: 'BQ-001', notes: 'Revisão 2.', readonly: true },
    { id: 'JOBON-004', reference: '9121T173', production: '202601', machine: 'C1', process: 'NNPB', start: '2026-09-10', end: '2026-09-12', cm: 'CM-001', mf: 'MF-001', bq: 'BQ-003', notes: '', readonly: true },
    { id: 'JOBON-005', reference: '7080C002', production: '202602', machine: 'C3', process: 'NNPB', start: '2026-09-16', end: '2026-09-18', cm: 'CM-003', mf: 'MF-002', bq: 'BQ-001', notes: 'Produção C3.', readonly: true }
  ];

  // DEMO ONLY — fixed IDs for new sheets saved in this session.
  const NEXT_JOB_IDS = ['JOBON-006', 'JOBON-007', 'JOBON-008', 'JOBON-009', 'JOBON-010'];

  const overview = window.betaProductionOverview;
  let sheet = makeEmptySheet();
  let activeToolType = null;

  function makeEmptySheet() {
    return { id: '', reference: '', production: '', machine: 'B1', process: 'NNPB', start: '', end: '', cm: '', mf: '', bq: '', notes: '', readonly: false };
  }

  function allTools() {
    const list = [...TOOLS_DEMO];
    try {
      const created = JSON.parse(sessionStorage.getItem('betaDemoTools') || '[]');
      if (Array.isArray(created)) list.push(...created.filter(t => t.id && t.type));
    } catch (_) {}
    return list;
  }

  function findTool(id) {
    return allTools().find(t => t.id === id);
  }

  function loadSessionSheets() {
    try {
      return JSON.parse(sessionStorage.getItem('jobOnSavedSheets') || '[]');
    } catch (_) { return []; }
  }

  function saveSessionSheets(list) {
    sessionStorage.setItem('jobOnSavedSheets', JSON.stringify(list));
  }

  function getJobOnProductions() {
    try { return JSON.parse(sessionStorage.getItem('betaJobOnProductions') || '[]'); }
    catch (_) { return []; }
  }

  function saveJobOnProductions(list) {
    sessionStorage.setItem('betaJobOnProductions', JSON.stringify(list));
  }

  function contextFor(type) {
    const id = sheet[type.toLowerCase()];
    const t = id ? findTool(id) : null;
    return {
      id: `${sheet.id}-${type}`,
      toolId: t ? t.id : (id || ''),
      ref: t ? t.reference : '',
      lote: t ? t.lot : ''
    };
  }

  function syncJobOnProduction() {
    const list = getJobOnProductions();
    const index = list.findIndex(p => p.jobonId === sheet.id);
    const production = {
      jobonId: sheet.id,
      referencia: sheet.reference,
      producao: sheet.production,
      maquina: sheet.machine,
      dataProducao: sheet.start || sheet.end || '',
      contextos: {
        cm: contextFor('CM'),
        mf: contextFor('MF'),
        bq: contextFor('BQ')
      },
      estado: index >= 0 ? list[index].estado : 'com data'
    };
    if (index >= 0) list[index] = production;
    else list.push(production);
    saveJobOnProductions(list);
  }

  function findSheet(id) {
    return JOBS_DEMO.find(j => j.id === id) || loadSessionSheets().find(j => j.id === id);
  }

  function loadDraft() {
    try {
      return JSON.parse(sessionStorage.getItem('jobOnSheetDraft') || 'null');
    } catch (_) { return null; }
  }

  function saveDraft() {
    sessionStorage.setItem('jobOnSheetDraft', JSON.stringify(sheet));
  }

  function clearDraft() {
    sessionStorage.removeItem('jobOnSheetDraft');
  }

  function setField(id, value, readonly) {
    const el = $(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.value = value;
      if (!value) el.selectedIndex = 0;
    } else {
      el.value = value;
    }
    if (readonly !== undefined) {
      el.disabled = readonly;
      el.readOnly = readonly;
    }
  }

  function renderToolSummary(type) {
    const id = sheet[type.toLowerCase()];
    const display = $(`#${type.toLowerCase()}Display`);
    const summary = $(`#${type.toLowerCase()}Summary`);
    if (!display || !summary) return;
    if (!id) {
      display.value = '';
      summary.hidden = true;
      summary.replaceChildren();
      return;
    }
    const tool = findTool(id);
    if (!tool) {
      display.value = id;
      summary.hidden = true;
      return;
    }
    display.value = `${tool.reference} · Lote ${tool.lot}`;
    summary.hidden = false;
    summary.replaceChildren();
    const title = document.createElement('button');
    title.type = 'button';
    title.textContent = `${tool.id} · ${tool.reference} · Lote ${tool.lot}`;
    const detail = document.createElement('small');
    detail.textContent = `${tool.machines} · ${tool.process}`;
    summary.append(title, detail);
  }

  function renderSheet() {
    $('#sheetTitle').textContent = sheet.id ? `${sheet.id}` : 'Novo Job On';
    $('#sheetSubtitle').textContent = sheet.readonly ? 'Visualização apenas de leitura.' : 'Crie ou edite a associação de ferramentas à produção.';
    $('#sheetStatus').textContent = sheet.id ? 'Guardado' : 'Rascunho';
    $('#sheetStatus').className = sheet.id ? 'dmo-pill active' : 'dmo-pill pending';

    setField('#jReference', sheet.reference, sheet.readonly);
    setField('#jProduction', sheet.production, sheet.readonly);
    setField('#jMachine', sheet.machine, sheet.readonly);
    setField('#jProcess', sheet.process, sheet.readonly);
    setField('#jStart', sheet.start, sheet.readonly);
    setField('#jEnd', sheet.end, sheet.readonly);
    setField('#jNotes', sheet.notes, sheet.readonly);

    renderToolSummary('CM');
    renderToolSummary('MF');
    renderToolSummary('BQ');

    $$('#toolsSection .dmo-button').forEach(btn => btn.disabled = sheet.readonly);
    $('#sheetSave').disabled = sheet.readonly;
    $('#sheetSave').hidden = sheet.readonly;
    $('#sheetDuplicate').disabled = !sheet.id && !sheet.reference && !sheet.production;
    renderSummaryButton();
  }

  function renderSummaryButton() {
    const actions = $('.beta-light-actions');
    let btn = $('#sheetOpenSummary');
    if (sheet.readonly && sheet.id) {
      if (!btn) {
        btn = document.createElement('a');
        btn.id = 'sheetOpenSummary';
        btn.className = 'dmo-button success';
        btn.href = 'resumo.html';
        btn.textContent = 'Abrir Resumo no Controlo';
        actions.append(btn);
      }
      btn.hidden = false;
    } else if (btn) {
      btn.hidden = true;
    }
  }

  function readSheetFromForm() {
    if (sheet.readonly) return;
    sheet.reference = $('#jReference').value.trim();
    sheet.production = $('#jProduction').value.trim();
    sheet.machine = $('#jMachine').value;
    sheet.process = $('#jProcess').value;
    sheet.start = $('#jStart').value;
    sheet.end = $('#jEnd').value;
    sheet.notes = $('#jNotes').value.trim();
  }

  function openPicker(type) {
    activeToolType = type;
    $('#pickerTitle').textContent = `Selecionar ferramenta ${type}`;
    $('#pickerSearch').value = '';
    $('#toolPicker').hidden = false;
    renderPicker();
  }

  function closePicker() {
    $('#toolPicker').hidden = true;
    activeToolType = null;
  }

  function renderPicker() {
    const q = $('#pickerSearch').value.trim().toLowerCase();
    const list = allTools().filter(t => t.type === activeToolType);
    const matches = q ? list.filter(t => `${t.id} ${t.reference} ${t.lot} ${t.type}`.toLowerCase().includes(q)) : list;

    const tbody = $('#pickerBody');
    tbody.replaceChildren();
    for (const tool of matches) {
      const tr = document.createElement('tr');
      tr.dataset.toolId = tool.id;
      tr.innerHTML = `<td>${tool.type}</td><td>${tool.id} · ${tool.reference}</td><td>${tool.lot}</td><td>${tool.machines}</td><td>${tool.process}</td>`;
      tr.addEventListener('click', () => selectTool(tool.id));
      tbody.append(tr);
    }
    $('#pickerEmpty').hidden = matches.length > 0;
  }

  function selectTool(id) {
    if (!activeToolType) return;
    sheet[activeToolType.toLowerCase()] = id;
    closePicker();
    renderSheet();
    saveDraft();
    toast(`${activeToolType} selecionado.`);
  }

  function openCreateToolModal() {
    $('#toolPicker').hidden = true;
    $('#createToolModal').hidden = false;
    $('#ctType').value = activeToolType || 'CM';
    $('#ctReference').value = '';
    $('#ctLot').value = '';
    $('#ctProcess').value = '';
    $$('#ctMachines input').forEach(input => input.checked = false);
    $('#ctReference').focus();
  }

  function closeCreateToolModal() {
    $('#createToolModal').hidden = true;
  }

  function saveCreatedTool() {
    const type = $('#ctType').value;
    const reference = $('#ctReference').value.trim();
    const lot = $('#ctLot').value.trim();
    if (!reference || !lot) {
      toast('Preencha referência e lote.');
      return;
    }
    const id = NEXT_TOOL_IDS[type];
    if (!id) {
      toast('Pool fixo esgotado para este tipo.');
      return;
    }
    const existing = allTools().find(t => t.id === id);
    if (existing) {
      toast(`Ferramenta ${id} já foi criada nesta sessão.`);
      return;
    }
    const machines = [...$$('#ctMachines input:checked')].map(input => input.value).join(' · ') || '—';
    const tool = { id, type, reference, lot, machines, process: $('#ctProcess').value || '—' };

    let created = [];
    try { created = JSON.parse(sessionStorage.getItem('betaDemoTools') || '[]'); } catch (_) {}
    if (!Array.isArray(created)) created = [];
    created.push(tool);
    sessionStorage.setItem('betaDemoTools', JSON.stringify(created));

    closeCreateToolModal();
    openPicker(type);
    setTimeout(() => {
      $('#pickerSearch').value = reference;
      renderPicker();
    }, 0);
    toast(`Ferramenta ${id} criada.`);
  }

  function openDuplicateModal() {
    const sources = [...JOBS_DEMO, ...loadSessionSheets()].sort((a, b) => b.id.localeCompare(a.id));
    const select = $('#duplicateSource');
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.textContent = 'Selecione uma fonte';
    empty.value = '';
    select.append(empty);
    for (const job of sources) {
      const option = document.createElement('option');
      option.value = job.id;
      option.textContent = `${job.id} · ${job.reference} · ${job.production} · ${job.machine}`;
      select.append(option);
    }
    $('#duplicatePreview').hidden = true;
    $('#duplicateModal').hidden = false;
  }

  function renderDuplicatePreview() {
    const id = $('#duplicateSource').value;
    const preview = $('#duplicatePreview');
    if (!id) { preview.hidden = true; preview.replaceChildren(); return; }
    const job = findSheet(id);
    if (!job) { preview.hidden = true; return; }
    preview.hidden = false;
    preview.replaceChildren();
    const cm = findTool(job.cm);
    const mf = findTool(job.mf);
    const bq = findTool(job.bq);
    preview.innerHTML = `<p><strong>${job.id}</strong> · ${job.reference} · ${job.production} · ${job.machine}</p><p>CM: ${cm ? cm.reference + ' · Lote ' + cm.lot : '—'}<br>MF: ${mf ? mf.reference + ' · Lote ' + mf.lot : '—'}<br>BQ: ${bq ? bq.reference + ' · Lote ' + bq.lot : '—'}</p>`;
  }

  function confirmDuplicate() {
    const id = $('#duplicateSource').value;
    if (!id) { toast('Selecione uma fonte.'); return; }
    const job = findSheet(id);
    if (!job) return;
    sheet = makeEmptySheet();
    sheet.reference = '';
    sheet.production = '';
    sheet.machine = job.machine;
    sheet.process = job.process;
    sheet.start = '';
    sheet.end = '';
    sheet.cm = job.cm;
    sheet.mf = job.mf;
    sheet.bq = job.bq;
    sheet.notes = `Duplicado de ${job.id}.${job.notes ? ' ' + job.notes : ''}`;
    sheet.readonly = false;
    $('#duplicateModal').hidden = true;
    renderSheet();
    saveDraft();
    toast(`Rascunho criado a partir de ${job.id}.`);
  }

  function saveSheet() {
    if (sheet.readonly) return;
    readSheetFromForm();
    if (!sheet.reference || !sheet.production) {
      toast('Preencha referência e produção.');
      return;
    }
    const saved = loadSessionSheets();
    if (sheet.id) {
      const index = saved.findIndex(j => j.id === sheet.id);
      if (index >= 0) saved[index] = { ...sheet }; else saved.push({ ...sheet });
    } else {
      const nextId = NEXT_JOB_IDS.find(id => !JOBS_DEMO.find(j => j.id === id) && !saved.find(j => j.id === id));
      if (!nextId) { toast('Pool fixo de Job Ons esgotado.'); return; }
      sheet.id = nextId;
      saved.push({ ...sheet });
    }
    sheet.readonly = true;
    saveSessionSheets(saved);
    syncJobOnProduction();
    clearDraft();
    renderSheet();
    toast('Job On guardado.');
  }

  function newSheet() {
    sheet = makeEmptySheet();
    clearDraft();
    renderSheet();
    toast('Novo rascunho.');
  }

  function loadFromUrl() {
    const params = new URLSearchParams(location.search);
    const jobon = params.get('jobon');
    if (jobon && jobon !== 'NEW') {
      const job = findSheet(jobon);
      if (job) {
        sheet = { ...job };
      } else {
        toast('Job On não encontrado.');
        sheet = makeEmptySheet();
      }
    } else {
      const draft = loadDraft();
      if (draft) {
        sheet = { ...makeEmptySheet(), ...draft };
      } else {
        sheet = makeEmptySheet();
      }
    }
  }

  function init() {
    overview.renderRail($('#lightLines'), {
      onSelect: (line, row) => {
        if (!sheet.readonly && row && row.line) {
          $('#jMachine').value = row.line;
          readSheetFromForm();
          saveDraft();
        }
      },
      onOpen: (line, row) => {
        if (row && row.line) console.log('Rail abrir:', line, row);
      }
    });

    loadFromUrl();
    renderSheet();
  }

  // Events
  $('#cmPick').onclick = () => openPicker('CM');
  $('#mfPick').onclick = () => openPicker('MF');
  $('#bqPick').onclick = () => openPicker('BQ');

  $('#pickerClose').onclick = closePicker;
  $('#pickerSearch').oninput = renderPicker;
  $('#pickerCreate').onclick = openCreateToolModal;

  $('#createToolClose').onclick = () => { closeCreateToolModal(); $('#toolPicker').hidden = false; };
  $('#createToolCancel').onclick = () => { closeCreateToolModal(); $('#toolPicker').hidden = false; };
  $('#createToolSave').onclick = saveCreatedTool;

  $('#sheetNew').onclick = newSheet;
  $('#sheetSave').onclick = saveSheet;
  $('#sheetDuplicate').onclick = openDuplicateModal;

  $('#duplicateClose').onclick = () => $('#duplicateModal').hidden = true;
  $('#duplicateCancel').onclick = () => $('#duplicateModal').hidden = true;
  $('#duplicateSource').onchange = renderDuplicatePreview;
  $('#duplicateConfirm').onclick = confirmDuplicate;

  $$('#identityFields input, #identityFields select, #jNotes').forEach(el => {
    el.addEventListener('input', () => { readSheetFromForm(); saveDraft(); });
    el.addEventListener('change', () => { readSheetFromForm(); saveDraft(); });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
