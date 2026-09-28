/* Independent BQ repair trace demo. Job On suggests context; the operator confirms it. */
(() => {
  if(document.body.dataset.betaPage!=='boquilhas')return;
  const $=selector=>document.querySelector(selector);
  const key='betaBqRepairTraces';
  const DEMO_BQ_TRACE_IDS=['BQ-TRACE-001','BQ-TRACE-002','BQ-TRACE-003','BQ-TRACE-004','BQ-TRACE-005','BQ-TRACE-006','BQ-TRACE-007','BQ-TRACE-008'];
  function nextTraceId(){
    const traces=read();
    const used=new Set(traces.map(t=>t.id));
    for(const id of DEMO_BQ_TRACE_IDS)if(!used.has(id))return id;
    return traces[0]?.id||DEMO_BQ_TRACE_IDS[0];
  }
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]')}catch{return []}};
  const save=items=>sessionStorage.setItem(key,JSON.stringify(items));
  const events=()=>{try{return JSON.parse(sessionStorage.getItem('betaBqProductionChanges')||'[]')}catch{return []}};
  const jobons=()=>{
    let list=[];
    try{list=JSON.parse(sessionStorage.getItem('betaJobOnProductions')||'[]')}catch{return []}
    return list.map(prod=>({
      jobonId:prod.jobonId,
      jobon:prod.jobonId,
      reference:prod.referencia,
      production:prod.producao,
      machine:prod.maquina,
      contexts:{
        CM:prod.contextos?.cm||{},
        MF:prod.contextos?.mf||{},
        BQ:{
          id:prod.contextos?.bq?.id||'',
          tool:{
            toolId:prod.contextos?.bq?.toolId||'',
            reference:prod.contextos?.bq?.ref||'',
            lot:prod.contextos?.bq?.lote||''
          }
        }
      }
    }));
  };
  const repairerDefaults={B1:'Externo A',B2:'Externo B',B3:'',C1:'Externo A',C2:'Externo B',C3:'Externo A'};
  function repairerFor(machine){
    let saved;
    try{saved=JSON.parse(sessionStorage.getItem('betaRepairers')||'{}')}catch{saved={}}
    return {...repairerDefaults,...saved}[machine]||'';
  }
  const catalog=()=>{
    const tools=[{toolId:'DEMO-TOOL-BQ-001',type:'BQ',reference:'T173',lot:'04'},
      {toolId:'DEMO-TOOL-BQ-002',type:'BQ',reference:'T188',lot:'08'},
      {toolId:'DEMO-TOOL-BQ-003',type:'BQ',reference:'T194',lot:'12'}];
    try{for(const tool of JSON.parse(sessionStorage.getItem('betaDemoTools')||'[]'))if(tool.type==='BQ')tools.push(tool)}catch{}
    for(const jobon of jobons()){const tool=jobon.contexts?.BQ?.tool;if(tool?.toolId&&!tools.some(item=>item.toolId===tool.toolId))tools.push(tool)}
    return tools;
  };
  let selectedTool=null,activeTrace=null;
  $('#movementForm input[type="date"]').value=new Date().toISOString().slice(0,10);
  $('#recordResults').style.display='none';
  $('#recordEmpty').textContent='Pesquise uma BQ, abra um registo existente ou inicie um novo registo.';
  $('#recordDetail').querySelectorAll(':scope > .card').forEach(card=>card.hidden=true);
  $('#recordDetail .record-bar #closeLot')?.remove();
  $('#recordDetail .record-bar .btn:not([data-movement]):not(#closeLot)')?.remove();
  const register=$('#registo');
  const associationNotices=document.createElement('div');
  associationNotices.id='bqAssociationNotices';
  register.querySelector('.register-search').closest('.card').insertAdjacentElement('afterend',associationNotices);

  function renderAssociationNotices(){
    associationNotices.replaceChildren();
    const traces=read().filter(t=>!t.bqId);
    for(const trace of traces){
      for(const prod of jobons().filter(j=>j.contexts?.BQ?.tool?.toolId===trace.toolId)){
        const notice=document.createElement('div');
        notice.className='beta-bq-notice';
        notice.innerHTML=`<p><strong>${prod.jobonId} · ${prod.reference} · linha ${prod.machine}</strong> — candidata a associar ao registo BQ ${trace.tool.reference}</p><div class="beta-bq-actions"><button type="button" class="btn primary" data-associate>Associar</button><button type="button" class="btn" data-dismiss>Manter pendente</button></div>`;
        notice.querySelector('[data-associate]').onclick=()=>{
          const traces=read();
          const updated=traces.find(item=>item.id===trace.id);
          if(!updated)return;
          updated.bqId=prod.contexts.BQ.id;
          save(traces);
          renderAssociationNotices();
          drawTraces();
          drawHistory();
          if(activeTrace?.id===trace.id)showTrace(updated);
          toast('Produção associada ao registo BQ.');
        };
        notice.querySelector('[data-dismiss]').onclick=()=>notice.remove();
        associationNotices.append(notice);
      }
    }
  }

  const panel=document.createElement('section');panel.className='beta-bq-workflow card';panel.hidden=true;
  panel.innerHTML='<h3>Criar registo de Boquilhas</h3><p>Selecione a BQ exata. Se existir uma produção correspondente, pode selecioná-la agora ou continuar com a associação pendente.</p><div class="beta-bq-matches" id="bqToolMatches"></div><div class="beta-bq-association"><label for="bqJobonCandidate">Produção associada</label><select id="bqJobonCandidate"><option value="">Sem produção associada</option></select><small id="bqAssociationHelp">Selecione primeiro uma boquilha.</small></div><div class="beta-bq-actions"><button type="button" class="btn" id="cancelBqTrace">Cancelar</button><button type="button" class="btn primary" id="saveBqTrace" disabled>Iniciar registo</button></div>';
  register.querySelector('.register-search').closest('.card').insertAdjacentElement('afterend',panel);
  const traceList=document.createElement('section');traceList.className='beta-bq-workflow card';traceList.innerHTML='<h3>Registos de Boquilhas</h3><div id="bqTraceList"></div>';
  panel.insertAdjacentElement('afterend',traceList);
  const context=document.createElement('div');context.className='beta-bq-trace-context';context.hidden=true;$('#recordDetail').prepend(context);
  const search=$('#recordSearch');
  function candidates(tool){return jobons().filter(item=>item.contexts?.BQ?.tool?.toolId===tool.toolId).map(item=>({id:item.contexts.BQ.id,jobon:item.jobonId||item.jobon,reference:item.reference,production:item.production,line:item.machine}));}
  function drawCandidates(){const select=$('#bqJobonCandidate');select.replaceChildren(new Option('Sem produção associada',''));if(!selectedTool)return;for(const item of candidates(selectedTool)){const option=new Option(`${item.reference} · ${item.production} · ${item.line}`,item.id);option.dataset.jobon=item.jobon;select.add(option)}$('#bqAssociationHelp').textContent=select.length>1?'Escolha explicitamente a produção correta. A mais recente não é atribuída automaticamente.':'Produção por associar — pode iniciar os movimentos e associar mais tarde.'}
  function drawTools(){const root=$('#bqToolMatches');root.replaceChildren();const q=search.value.trim().toLowerCase();const matching=catalog().filter(tool=>!q||`${tool.reference} ${tool.lot}`.toLowerCase().includes(q));for(const tool of matching){const button=document.createElement('button');button.type='button';button.textContent=`BQ ${tool.reference} · Lote ${tool.lot}`;button.className=selectedTool?.toolId===tool.toolId?'active':'';button.onclick=()=>{selectedTool=tool;drawTools();drawCandidates();$('#saveBqTrace').disabled=false};root.append(button)}if(!matching.length){const message=document.createElement('p');message.textContent='Nenhuma BQ registada com estes dados. A pesquisa não cria ferramentas.';root.append(message)}}
  function close(){panel.hidden=true;selectedTool=null;$('#saveBqTrace').disabled=true}
  function begin(){panel.hidden=false;drawTools();drawCandidates();panel.scrollIntoView({block:'nearest'})}
  $('#newLot').textContent='Criar registo';$('#newLot').onclick=begin;
  $('#newLotBatches').textContent='Criar registo';$('#newLotBatches').onclick=()=>{$('[data-view="registo"]').click();begin()};
  $('#cancelBqTrace').onclick=close;
  function showTrace(trace){activeTrace=trace;search.value=trace.tool.reference;$('#recordEmpty').classList.add('hidden');$('#recordDetail').classList.remove('hidden');context.hidden=false;const associated=jobons().find(item=>item.contexts?.BQ?.id===trace.bqId);context.replaceChildren();const title=document.createElement('strong');title.textContent=`BQ ${trace.tool.reference} · Lote ${trace.tool.lot}`;const info=document.createElement('span');info.textContent=associated?`${associated.reference} · Produção ${associated.production} · ${associated.machine}`:'Produção por associar — o registo e os movimentos continuam disponíveis.';context.append(title,info);const movementCount=document.createElement('small');movementCount.textContent=`${trace.movements.length} movimento(s) neste registo`;context.append(movementCount);$('.movement-subtitle').textContent=`BQ ${trace.tool.reference} · Lote ${trace.tool.lot}`;const modal=$('#movementModal .context');const facts=modal?.querySelectorAll('strong');if(facts?.length>=3){facts[0].textContent=trace.tool.reference;facts[1].textContent=trace.tool.lot;facts[2].textContent=associated?.machine||'Por associar'}const summary=$('#recordDetail .summary-line');if(summary)summary.textContent=`${title.textContent} · ${info.textContent}`;$('#recordDetail').scrollIntoView({block:'nearest'})}
  function drawTraces(){const root=$('#bqTraceList');root.replaceChildren();const q=search.value.trim().toLowerCase();const matching=read().filter(trace=>!q||`${trace.tool.reference} ${trace.tool.lot}`.toLowerCase().includes(q));for(const trace of matching){const line=document.createElement('div');line.className='beta-bq-trace-row';const label=document.createElement('span');const associated=jobons().find(item=>item.contexts?.BQ?.id===trace.bqId);label.textContent=`BQ ${trace.tool.reference} · Lote ${trace.tool.lot} · ${associated?`${associated.production} · ${associated.machine}`:'Produção por associar'}`;const open=document.createElement('button');open.type='button';open.className='btn';open.textContent='Abrir registo';open.onclick=()=>showTrace(trace);line.append(label,open);if(!associated){const matches=candidates(trace.tool);if(matches.length){const select=document.createElement('select');select.setAttribute('aria-label',`Associar produção a ${trace.tool.reference}`);select.add(new Option('Escolher produção',''));for(const item of matches)select.add(new Option(`${item.reference} · ${item.production} · ${item.line}`,item.id));const attach=document.createElement('button');attach.type='button';attach.className='btn';attach.textContent='Associar';attach.onclick=()=>{if(!select.value)return;const traces=read();const updated=traces.find(item=>item.id===trace.id);if(!updated)return;updated.bqId=select.value;save(traces);drawTraces();renderAssociationNotices();if(activeTrace?.id===trace.id)showTrace(updated)};line.append(select,attach)}}root.append(line)}if(!matching.length){const empty=document.createElement('p');empty.textContent='Nenhum registo encontrado. Pode iniciar um registo pela BQ mesmo sem Job On.';root.append(empty)}}
  function drawHistory(){
    const root=$('#movements');root.querySelectorAll('.movement[data-type]').forEach(row=>row.remove());
    for(const trace of read()){
      let pending=[];
      for(const movement of trace.movements){
        const type=movement.type==='Saída'?'out':movement.type==='Entrada'?'in':'no-repair';
        const qty=Number(movement.quantity);
        let discrepancy=null;
        if(type==='out')pending.push(qty);
        if(type==='in'){
          const outgoing=pending.length?pending.shift():0;
          discrepancy=outgoing-qty;
          if(discrepancy>0)pending.unshift(discrepancy);
        }
        const row=document.createElement('button');row.type='button';row.className='movement wide';
        row.dataset.type=type;row.dataset.text=`${trace.tool.reference} ${trace.tool.lot}`.toLowerCase();
        row.dataset.repairer='';row.dataset.state='current';row.dataset.date=movement.date||'';
        const associated=jobons().find(item=>item.contexts?.BQ?.id===trace.bqId);
        const values=[trace.tool.reference,trace.tool.lot,movement.type,qty,discrepancy===null||discrepancy===0?'—':String(discrepancy).replace('-', '−'),movement.repairer||repairerFor(associated?.machine)||'—',associated?.machine||'—',movement.date||'—',window.betaDemoSession?.get()?.name||'Operador'];
        values.forEach((value,index)=>{const cell=document.createElement(index===0?'strong':'span');cell.textContent=value;if(index===2)cell.className=`type ${type}`;row.append(cell)});
        row.onclick=()=>{root.querySelectorAll('.movement').forEach(item=>item.classList.toggle('selected',item===row));$('#editMovement').disabled=$('#deleteMovement').disabled=false};
        row.ondblclick=()=>{$('[data-view="registo"]').click();showTrace(trace)};
        root.append(row);
      }
    }
    window.betaBqHistoryRefresh?.();
  }
  $('#saveBqTrace').onclick=()=>{if(!selectedTool)return;const option=$('#bqJobonCandidate').selectedOptions[0];const trace={id:nextTraceId(),toolId:selectedTool.toolId,tool:{...selectedTool},bqId:option?.value||null,status:'Aberto',movements:[]};save([trace,...read()]);close();drawTraces();showTrace(trace);renderAssociationNotices();};
  $('#movementForm').addEventListener('submit',()=>{if(!activeTrace)return;const traces=read(),trace=traces.find(item=>item.id===activeTrace.id);if(!trace)return;const form=$('#movementForm');if(!form.reportValidity())return;const associatedOnSave=jobons().find(item=>item.contexts?.BQ?.id===trace.bqId);
trace.movements.push({type:$('#movementTitle').textContent,quantity:Number(form.querySelector('input[type="number"]').value),date:form.querySelector('input[type="date"]').value,reason:$('#movementReason').value,repairer:repairerFor(associatedOnSave?.machine)});save(traces);activeTrace=trace;drawHistory();showTrace(trace)},true);
  search.addEventListener('input',()=>{if(!panel.hidden){selectedTool=null;$('#saveBqTrace').disabled=true;drawTools();drawCandidates()}drawTraces()});
  const notice=document.createElement('p');notice.className='beta-bq-notice';const latest=events()[0];notice.textContent=latest?`Job On atualizado: ${latest.reference} · ${latest.production} · ${latest.line}. A produção fica disponível para associar ao registo da BQ.`:'Selecione a BQ para iniciar o registo; as produções disponíveis surgem no registo quando existirem.';traceList.prepend(notice);
  renderAssociationNotices();
  drawTraces();drawHistory();
})();
