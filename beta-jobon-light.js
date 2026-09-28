(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const toast = message => {
    const el = $('#lightToast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.lightToastTimer);
    window.lightToastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  };

  const overview = window.betaProductionOverview;
  let year = 2026, month = 8, day = 21;
  let selected = null;

  function getSavedProductions() {
    try { return JSON.parse(sessionStorage.getItem('betaJobOnProductions') || '[]'); }
    catch (_) { return []; }
  }

  function rebuildRows() {
    const tbody = $('#lightProductionList');
    const fixtureRows = $$('#lightProductionList tr[data-row]');
    fixtureRows.forEach(row => row.dataset.fixture = '1');
    const saved = getSavedProductions().filter(p => p.jobonId && !fixtureRows.some(r => r.dataset.jobonId === p.jobonId));
    for (const prod of saved) {
      const tr = document.createElement('tr');
      tr.dataset.row = '';
      tr.dataset.jobonId = prod.jobonId;
      tr.dataset.date = prod.estado === 'sem data' ? '' : (prod.dataProducao || '');
      tr.dataset.reference = prod.referencia;
      tr.dataset.production = prod.producao;
      tr.dataset.line = prod.maquina;
      tr.innerHTML = `<td>${prod.referencia}</td><td>${prod.producao}</td><td>${prod.maquina}</td>`;
      tbody.append(tr);
    }
  }

  const selectedDate = () => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const monthLabel = () => new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long' });

  function renderDays() {
    const root = $('#lightDays');
    root.replaceChildren();
    $('#lightMonthTitle').textContent = monthLabel();
    $('#lightMonthTitle').setAttribute('aria-label', new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }));

    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const pad = document.createElement('span');
      pad.className = 'dmo-calendar__day';
      pad.disabled = true;
      root.append(pad);
    }

    const records = overview.records();
    const total = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= total; d++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dmo-calendar__day';
      button.textContent = d;
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      button.dataset.date = date;
      button.setAttribute('aria-label', new Date(year, month, d).toLocaleDateString('pt-PT', { dateStyle: 'long' }));
      if (records.some(r => r.date === date)) button.classList.add('has-record');
      if (d === day) button.classList.add('selected');
      button.onclick = () => {
        day = d;
        selected = null;
        renderDays();
        renderList();
      };
      root.append(button);
    }
  }

  function renderList() {
    const rows = $$('#lightProductionList tr[data-row]');
    const q = $('#lightSearch').value.trim().toLowerCase();
    const date = selectedDate();
    let visible = 0;

    $('#lightDayTitle').textContent = `Produções de ${day} de ${monthLabel()}`;

    rows.forEach(row => {
      const rowDate = row.dataset.date;
      const text = `${row.dataset.reference} ${row.dataset.production} ${row.dataset.line}`.toLowerCase();
      const match = rowDate === date && (!q || text.includes(q));
      row.hidden = !match;
      row.classList.toggle('is-selected', row === selected);
      if (match) visible++;
    });

    $('#lightNoResults').hidden = visible > 0;
    $('#lightRemoveDate').disabled = !selected || selected.dataset.date !== date;
  }

  function selectRow(row) {
    selected = row;
    renderList();
  }

  function openRow(row) {
    const id = row.dataset.jobonId || 'NEW';
    location.href = `20_JOB_ON_02_VISUAL_AUTHORITY_job-on-folha.html?jobon=${encodeURIComponent(id)}`;
  }

  function renderHistory() {
    const root = $('#lightHistory');
    const detached = $$('#lightProductionList tr[data-row][data-date=""]');
    $('#lightHistoryEmpty').hidden = detached.length === 0;

    root.querySelectorAll('[data-history-item]').forEach(el => el.remove());
    detached.forEach(row => {
      const entry = document.createElement('div');
      entry.dataset.historyItem = '';
      entry.tabIndex = 0;
      const title = document.createElement('strong');
      title.textContent = `${row.dataset.reference} · ${row.dataset.production} · ${row.dataset.line}`;
      const detail = document.createElement('span');
      detail.textContent = 'Sem dia associado · Duplo clique para abrir o Job On';
      entry.append(title, detail);
      entry.ondblclick = () => {
        $('.beta-light-tabs [data-light-view="jobon"]').click();
        openRow(row);
      };
      entry.onkeydown = event => {
        if (event.key === 'Enter') entry.ondblclick();
      };
      root.append(entry);
    });
  }

  function changeMonth(delta) {
    const date = new Date(year, month + delta, 1);
    year = date.getFullYear();
    month = date.getMonth();
    day = 1;
    selected = null;
    renderDays();
    renderList();
  }

  $('#lightPreviousMonth').onclick = () => changeMonth(-1);
  $('#lightNextMonth').onclick = () => changeMonth(1);
  $('#lightSearch').oninput = renderList;

  $('#lightProductionList').addEventListener('click', event => {
    const row = event.target.closest('tr[data-row]');
    if (!row || row.hidden) return;
    selectRow(row);
  });

  $('#lightProductionList').addEventListener('dblclick', event => {
    const row = event.target.closest('tr[data-row]');
    if (!row || row.hidden) return;
    openRow(row);
  });

  $('#lightRemoveDate').onclick = () => {
    if (!selected || selected.dataset.date !== selectedDate()) return;
    const row = selected;
    if (row.dataset.fixture === '1') {
      const identity = `${row.dataset.line}|${row.dataset.reference}|${row.dataset.production}`;
      const key = 'betaJobOnCalendarDetached';
      try {
        const list = JSON.parse(sessionStorage.getItem(key) || '[]');
        if (!list.includes(identity)) {
          list.push(identity);
          sessionStorage.setItem(key, JSON.stringify(list));
        }
      } catch (_) {}
    } else {
      const jobonId = row.dataset.jobonId;
      try {
        const list = JSON.parse(sessionStorage.getItem('betaJobOnProductions') || '[]');
        const prod = list.find(p => p.jobonId === jobonId);
        if (prod) {
          prod.estado = 'sem data';
          prod.dataProducao = '';
          sessionStorage.setItem('betaJobOnProductions', JSON.stringify(list));
        }
      } catch (_) {}
    }
    row.dataset.date = '';
    selected = null;
    renderDays();
    renderList();
    renderHistory();
    toast('Associação ao dia retirada; Job On preservado.');
  };

  $$('.beta-light-tabs [data-light-view]').forEach(button => {
    button.onclick = () => {
      $$('.beta-light-tabs button').forEach(x => x.classList.toggle('active', x === button));
      $$('[data-light-panel]').forEach(x => x.classList.toggle('active', x.dataset.lightPanel === button.dataset.lightView));
    };
  });

  function init() {
    overview.renderRail($('#lightLines'), {
      onSelect: (line, row) => {
        if (row && row.date) {
          const date = new Date(`${row.date}T12:00:00`);
          year = date.getFullYear();
          month = date.getMonth();
          day = date.getDate();
          selected = null;
          renderDays();
          renderList();
        }
      },
      onOpen: (line, row) => {
        console.log('Rail abrir:', line, row);
      }
    });
    rebuildRows();
    renderDays();
    renderList();
    renderHistory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
