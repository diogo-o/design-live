/* Visual fixtures for navigating published control summaries. */
(() => {
  const records = [
    {reference:'5447T173',production:'202602',machine:'B3',process:'NNPB',date:'23/09/2026',jobon:'JO-202602-B3',status:'A aguardar aprovação',cm:'5447 · Lote 04',weight:'254,20 g',capacity:'330,00 ml',temperature:'20,4 °C',bq:'T173 · Lote 04',mf:'5447 · Lote 26',observation:'CM 03 próximo do limite superior. A decisão cabe ao responsável.',rows:[['01','252,41 g','582,66 g','330,25 ml','Conforme'],['02','254,08 g','584,19 g','330,11 ml','Conforme'],['03','255,12 g','585,35 g','330,23 ml','Verificar']]},
    {reference:'5447T173',production:'202601',machine:'B3',process:'NNPB',date:'18/08/2026',jobon:'JO-202601-B3',status:'Aprovado',cm:'5447 · Lote 03',weight:'253,90 g',capacity:'329,85 ml',temperature:'20,1 °C',bq:'T173 · Lote 03',mf:'5447 · Lote 25',observation:'Sem observações registadas.',rows:[['01','253,12 g','583,00 g','329,88 ml','Conforme'],['02','254,01 g','583,84 g','329,83 ml','Conforme']]},
    {reference:'7080C002',production:'202602',machine:'C3',process:'NNPB',date:'18/08/2026',jobon:'JO-202602-C3',status:'Aprovado',cm:'7080 · Lote 01',weight:'230,97 g',capacity:'330,10 ml',temperature:'20,2 °C',bq:'C002 · Lote 18',mf:'7080 · Lote 01',observation:'Sem observações registadas.',rows:[['01','230,70 g','560,81 g','330,11 ml','Conforme'],['02','231,24 g','561,33 g','330,09 ml','Conforme']]}
  ];
  try { const created=JSON.parse(sessionStorage.getItem('betaJobOnSummaries')||'[]'); if(Array.isArray(created))created.forEach(item=>{if(item.reference&&item.production){const index=records.findIndex(record=>record.reference===item.reference&&record.production===item.production);if(index>=0)records.splice(index,1);records.unshift(item)}}) } catch (_) {}
  const search=document.querySelector('#summaryReferenceSearch');
  const select=document.querySelector('#summaryProduction');
  const results=document.querySelector('#summarySearchResults');
  const sheet=document.querySelector('#summarySheet');
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const grants=window.betaDemoSession?.get()?.modules||[];
  const canCreate=grants.includes('controlo-criar');
  const canApprove=grants.includes('controlo-aprovar');
  const approvalView=canApprove&&(!canCreate||new URLSearchParams(location.search).get('mode')==='approve');
  const historyView=approvalView&&new URLSearchParams(location.search).get('view')==='history';
  const visibleRecords=historyView?records.filter(item=>item.status==='Aprovado'||item.status==='Não aprovado'):records;
  const newestFor=reference=>visibleRecords.filter(item=>item.reference===reference).sort((a,b)=>b.production.localeCompare(a.production)||String(b.date||'').localeCompare(String(a.date||'')))[0];
  if(approvalView){
    const secondary=document.querySelector('.dmo-secondary-nav');
    secondary?.replaceChildren();
    const summaries=document.createElement('a');
    summaries.href='resumo.html?mode=approve';
    summaries.textContent='Resumo';
    const approvals=document.createElement('a');
    approvals.href='23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html';
    approvals.textContent='Aprovações';
    const history=document.createElement('a');
    history.href='resumo.html?mode=approve&view=history';
    history.textContent='Histórico';
    const active=historyView?history:summaries;
    active.className='active';
    active.setAttribute('aria-current','page');
    secondary?.append(summaries,approvals,history);
    if(historyView){document.querySelector('.beta-summary-search label').textContent='Procurar registos concluídos por referência';document.querySelector('.beta-summary-production label').textContent='Produções concluídas desta referência'}
    document.querySelector('.beta-back').href='23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html';
    document.querySelector('.beta-back').textContent='← Voltar às aprovações';
    const controlNav=[...document.querySelectorAll('.dmo-primary-nav a')].find(link=>link.textContent.trim()==='Controlo');
    if(controlNav)controlNav.href='23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html';
  }
  let active;
  const render=record=>{
    active=record;
    search.value=record.reference;
    const siblings=visibleRecords.filter(item=>item.reference===record.reference).sort((a,b)=>b.production.localeCompare(a.production));
    select.replaceChildren(...siblings.map(item=>new Option(item.production,item.production,item===record,item===record)));
    const urlFor=filename=>`${filename}?ref=${encodeURIComponent(record.reference)}&production=${encodeURIComponent(record.production)}`;
    const tools=record.tools||{CM:record.cm||'Por selecionar',MF:record.mf||'Por selecionar',BQ:record.bq||'Por selecionar'};
    sheet.innerHTML=`<header class="beta-summary-head"><div><h2>Resumo do controlo — ${esc(record.reference)} / ${esc(record.production)}</h2><p>Estado consolidado desta produção.</p></div><span class="dmo-pill ${record.status==='Aprovado'?'active':'pending'}">${esc(record.status)}</span></header>
      <section class="beta-context"><div><span>Referência</span><strong>${esc(record.reference)}</strong></div><div><span>Produção</span><strong>${esc(record.production)}</strong></div><div><span>Máquina</span><strong>${esc(record.machine)}</strong></div><div><span>Processo</span><strong>${esc(record.process)}</strong></div><div><span>Data</span><strong>${esc(record.date)}</strong></div><div><span>Job On</span><strong>${esc(record.jobon)}</strong></div></section>
      <section class="beta-summary-section"><h3>Estado da produção</h3><div class="beta-summary-state"><article><span>Peso</span><strong>${esc(record.weightStatus||'Registado')}</strong>${approvalView?'':`<a class="dmo-button" href="${urlFor('22_PESO_OPERADOR_01_VISUAL_AUTHORITY_peso-operador.html')}">${record.weightStatus==='Em falta'?'Criar Peso':'Abrir Peso'}</a>`}</article><article><span>Pegamentos</span><strong>${esc(record.gluingStatus||'Registado')}</strong>${approvalView?'':`<a class="dmo-button" href="${urlFor('24_PEGAMENTOS_01_VISUAL_AUTHORITY_pegamentos.html')}">${record.gluingStatus==='Em falta'?'Criar Pegamentos':'Abrir Pegamentos'}</a>`}</article></div></section>
      <section class="beta-summary-section"><h3>Ferramentas associadas no Job On</h3><div class="beta-summary-grid beta-summary-tools">${['CM','MF','BQ'].map(type=>{const tool=record.contexts?.[type]?.tool;return `<div><span>${type}</span><strong>${esc(tools[type]||'Por selecionar')}</strong>${tool?`<small>${esc(tool.machines)} · ${esc(tool.process)} · ${esc(tool.quantity)}</small>`:''}</div>`}).join('')}</div></section>
      <section class="beta-summary-section"><h3>Peso e capacidade</h3>${record.rows?.length?`<div class="beta-summary-grid"><div><span>CM</span><strong>${esc(record.cm)}</strong></div><div><span>Peso publicado</span><strong>${esc(record.weight)}</strong></div><div><span>Capacidade publicada</span><strong>${esc(record.capacity)}</strong></div><div><span>Temperatura da água</span><strong>${esc(record.temperature)}</strong></div></div><div class="dmo-table-wrap" style="margin-top:12px"><table class="dmo-table"><thead><tr><th>CM</th><th>Peso vazio</th><th>Peso com água</th><th>Capacidade</th><th>Estado</th></tr></thead><tbody>${record.rows.map(row=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td><td>${esc(row[2])}</td><td>${esc(row[3])}</td><td><span class="dmo-pill ${row[4]==='Conforme'?'active':'pending'}">${esc(row[4])}</span></td></tr>`).join('')}</tbody></table></div>`:'<p>Ainda não foi registado Peso nesta produção.</p>'}</section>
      <section class="beta-summary-section"><h3>Pegamentos — conjunto usado nesta produção</h3><div class="beta-relation"><article><span>CM</span><strong>${esc(tools.CM)}</strong></article><b>→</b><article><span>BQ</span><strong>${esc(tools.BQ)}</strong></article><b>→</b><article><span>MF</span><strong>${esc(tools.MF)}</strong></article></div>${record.gluingStatus==='Em falta'?'<p>Pegamentos ainda não registados.</p>':''}</section>
      <section class="beta-summary-section"><h3>Observações</h3><p>${esc(record.observation)}</p></section><footer class="beta-summary-actions">${approvalView&&(record.status==='A aguardar aprovação'||record.weightStatus==='A aguardar aprovação')?'<button class="dmo-button ghost" type="button" id="rejectSummary">Não aprovar</button><button class="dmo-button" type="button" id="approveSummary">Aprovar</button>':''}<button class="dmo-button ghost" type="button" id="printWeight">PDF do Peso</button><button class="dmo-button ghost" type="button" id="printSummary">PDF do Resumo</button></footer>`;
    sheet.querySelector('#printSummary').onclick=()=>window.print();
    sheet.querySelector('#printWeight').onclick=()=>{
      const source=Array.isArray(record.rows)?record.rows:[];
      if(!source.length){location.href=urlFor('22_PESO_OPERADOR_01_VISUAL_AUTHORITY_peso-operador.html');return}
      const prior=records.filter(item=>item.reference===record.reference&&item.production<record.production&&Array.isArray(item.rows)&&item.rows.length).sort((a,b)=>b.production.localeCompare(a.production))[0];
      const number=value=>{const parsed=Number(String(value||'').replace(/[^\d,.-]/g,'').replace(',','.'));return Number.isFinite(parsed)?parsed:null};
      const readings=source.map((row,index)=>({sequence:index+1,cm:row[0],priorCm:prior?.rows?.[index]?.[0]||'—',weight:number(row[1]),priorWeight:prior?.rows?.[index]?number(prior.rows[index][1]):null,volume:number(row[3]),priorVolume:prior?.rows?.[index]?number(prior.rows[index][3]):null}));
      sessionStorage.setItem('dmoPesoPrint',JSON.stringify({reference:record.reference,production:record.production,previousProduction:prior?.production||'',jobOnId:record.jobon||'',readings,createdAt:new Date().toISOString()}));
      location.href='22_PESO_OPERADOR_02_VISUAL_AUTHORITY_PRINT_peso.html';
    };
    if(approvalView){
      const decide=(status,weightStatus)=>{
        const saved=JSON.parse(sessionStorage.getItem('betaJobOnSummaries')||'[]');
        const index=saved.findIndex(item=>item.reference===record.reference&&item.production===record.production);
        const updated={...record,status,weightStatus};
        if(index>=0)saved[index]=updated;else saved.unshift(updated);
        sessionStorage.setItem('betaJobOnSummaries',JSON.stringify(saved));
        const localIndex=records.indexOf(record);records[localIndex]=updated;render(updated);
      };
      sheet.querySelector('#approveSummary')?.addEventListener('click',()=>decide('Aprovado','Aprovado'));
      sheet.querySelector('#rejectSummary')?.addEventListener('click',()=>decide('Não aprovado','Não aprovado'));
    }
    const url=new URL(location.href);url.searchParams.set('ref',record.reference);url.searchParams.set('production',record.production);history.replaceState(null,'',url);
  };
  const showMatches=()=>{
    const term=search.value.trim().toLocaleUpperCase('pt-PT');
    results.replaceChildren();results.hidden=!term;
    if(!term){active=null;select.replaceChildren(new Option('Selecione uma referência',''));sheet.textContent='Introduza uma referência para consultar os resumos das suas produções.';return}
    const references=[...new Set(visibleRecords.map(item=>item.reference))].filter(reference=>reference.includes(term));
    if(!references.length){active=null;select.replaceChildren(new Option('Nenhuma produção',''));sheet.textContent='Nenhum Resumo encontrado para esta referência.';results.textContent='Nenhuma referência encontrada.';return}
    const exact=references.find(reference=>reference.toLocaleUpperCase('pt-PT')===term);
    if(exact){render(newestFor(exact));results.hidden=true;return}
    active=null;select.replaceChildren(new Option('Selecione uma referência',''));
    sheet.textContent='Escolha uma referência para ver as produções disponíveis.';
    references.forEach(reference=>{const button=document.createElement('button');button.type='button';button.className='beta-summary-result';button.textContent=`${reference} · ${visibleRecords.filter(item=>item.reference===reference).length} Resumo(s)`;button.onclick=()=>{render(newestFor(reference));results.hidden=true};results.append(button)});
  };
  search.addEventListener('input',showMatches);
  select.addEventListener('change',()=>{const record=active&&visibleRecords.find(item=>item.reference===active.reference&&item.production===select.value);if(record)render(record)});
  window.addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);const record=visibleRecords.find(item=>item.reference===params.get('ref')&&item.production===params.get('production'));if(record)render(record)});
  const params=new URLSearchParams(location.search);
  const requested=visibleRecords.find(item=>item.reference===params.get('ref')&&item.production===params.get('production'))||newestFor(params.get('ref'));
  if(requested)render(requested);
  else{select.replaceChildren(new Option('Selecione uma referência',''));sheet.textContent=visibleRecords.length?'Introduza uma referência para consultar os resumos das suas produções.':'Ainda não existem registos concluídos no histórico.'}
})();
