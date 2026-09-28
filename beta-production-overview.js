/* Shared production dates and current line status for Job On and Boquilhas. */
(() => {
  const fixtures = [
    {date:'2026-09-21',line:'B1',reference:'5774T173',production:'202603',bq:'T173 · Lote 04'},
    {date:'2026-09-21',line:'B2',reference:'5810T188',production:'202602',bq:'T188 · Lote 08'},
    {date:'2026-09-21',line:'B3',reference:'5447T173',production:'202602',bq:'T173 · Lote 04'},
    {date:'2026-09-21',line:'C1',reference:'9121T173',production:'202601',bq:'T173 · Lote 11'},
    {date:'2026-09-18',line:'C3',reference:'7080C002',production:'202602',bq:'C002 · Lote 18'}
  ];
  const lines=['B1','B2','B3','C1','C2','C3'];
  function records(){
    const result=fixtures.map(row=>({...row}));
    try{
      const detached=JSON.parse(sessionStorage.getItem('betaJobOnCalendarDetached')||'[]');
      for(const row of result)if(detached.includes(`${row.line}|${row.reference}|${row.production}`))row.date='';
    }catch(_){/* Ignore unavailable demo session. */}
    try{
      const created=JSON.parse(sessionStorage.getItem('betaJobOnProductions')||'[]');
      if(Array.isArray(created))for(const prod of created){
        if(prod.estado==='sem data'||!prod.dataProducao)continue;
        if(!prod.referencia||!prod.producao||!prod.maquina)continue;
        const bqText=prod.contextos?.bq?.ref?`${prod.contextos.bq.ref} · Lote ${prod.contextos.bq.lote}`:'—';
        const row={date:prod.dataProducao,line:prod.maquina,reference:prod.referencia,production:prod.producao,bq:bqText,jobonId:prod.jobonId,summary:prod};
        const index=result.findIndex(item=>item.reference===row.reference&&item.production===row.production&&item.line===row.line);
        if(index<0)result.push(row);else result[index]=row;
      }
    }catch(_){/* Keep the fixtures if demo storage is unavailable. */}
    return result;
  }
  function renderRail(host,{onSelect,onOpen}={}){
    if(!host)return;
    host.classList.add('beta-production-rail');
    host.replaceChildren();
    const heading=document.createElement('div');heading.className='beta-production-rail-head';heading.innerHTML='<strong>Linhas de produção</strong><span>Estado atual em máquina</span>';host.append(heading);
    const list=document.createElement('div');list.className='beta-production-lines';host.append(list);
    const current=records();
    for(const line of lines){
      const row=current.filter(item=>item.line===line).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
      const button=document.createElement('button');button.type='button';button.dataset.line=line;
      if(line==='B1')button.classList.add('active');
      const label=document.createElement('strong');label.textContent=line;
      const detail=document.createElement('span');detail.textContent=row?`${row.reference} · ${row.production}`:'Sem produção';
      button.append(label,detail);button.onclick=()=>{list.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));onSelect?.(line,row)};
      button.ondblclick=()=>{if(row)onOpen?.(line,row)};
      list.append(button);
    }
  }
  window.betaProductionOverview={records,lines,renderRail};
})();
