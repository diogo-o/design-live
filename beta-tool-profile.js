(() => {
  const root=document.querySelector('#toolProfile');if(!root||root.hidden)return;
  const params=new URLSearchParams(location.search);
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]')}catch{return []}};
  const type=params.get('type')||'BQ',reference=(params.get('reference')||'').toUpperCase(),lot=params.get('lot')||'';
  const saved=read('betaDemoTools');
  const tool=saved.find(x=>x.toolId===params.get('toolId'))||saved.find(x=>x.type===type&&x.reference===reference&&x.lot===lot)||{toolId:params.get('toolId')||'',type,reference,lot,quantity:params.get('quantity')?params.get('quantity')+' peças':'',machines:params.get('line')||'',usage:params.get('usage')||'',process:''};
  root.querySelector('h2').textContent=`${tool.type} ${tool.reference||'—'} · Lote ${tool.lot||'—'}`;
  const facts=[['Tipo',tool.type],['Referência',tool.reference],['Lote',tool.lot],['Processo',tool.process],['Quantidade',tool.quantity],['Utilização',tool.usage===''||tool.usage==null?'':String(tool.usage)+'%'],['Máquinas / linhas',tool.machines],['Observações',tool.notes]];
  const factRoot=root.querySelector('#toolFacts');for(const [label,value] of facts){const box=document.createElement('div');const caption=document.createElement('span');caption.textContent=label;const content=document.createElement('strong');content.textContent=value||'—';box.append(caption,content);factRoot.append(box)}
  const jobons=read('betaJobOnSummaries').filter(row=>{const selected=row.contexts?.[type]?.tool;return selected&&(tool.toolId?selected.toolId===tool.toolId:selected.reference===reference&&selected.lot===lot)});
  function list(host,items,render,empty){host.replaceChildren();if(!items.length){const p=document.createElement('p');p.textContent=empty;host.append(p);return}for(const item of items)host.append(render(item))}
  const makeLink=(href,title,description)=>{const a=document.createElement('a');a.href=href;const strong=document.createElement('strong');strong.textContent=title;const span=document.createElement('span');span.textContent=description;a.append(strong,span);return a};
  root.querySelector('#jobonCount').textContent=jobons.length?`(${jobons.length})`:'';
  list(root.querySelector('#toolJobons'),jobons,row=>makeLink(`20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html?reference=${encodeURIComponent(row.reference)}&production=${encodeURIComponent(row.production)}`,`${row.reference} · Produção ${row.production}`,`${row.machine} · ${row.date||'Data não registada'}`),'Não há Job Ons associados a esta ferramenta na sessão atual.');
  const traces=read('betaBqRepairTraces').filter(trace=>tool.type==='BQ'&&(tool.toolId?trace.toolId===tool.toolId:trace.tool?.reference===reference&&trace.tool?.lot===lot));
  const movements=traces.flatMap(trace=>trace.movements.map(m=>({trace,m})));
  root.querySelector('#repairCount').textContent=movements.length?`(${movements.length})`:'';
  list(root.querySelector('#toolRepairs'),movements,({trace,m})=>makeLink('31_BOQUILHAS_01_VISUAL_AUTHORITY_boquilhas.html',`${m.type||'Movimento'} · ${m.quantity||'—'} BQ`,`${m.date||'Data não registada'} · BQ ${trace.tool.reference} · Lote ${trace.tool.lot}`),tool.type==='BQ'?'Não há movimentos de reparação registados nesta sessão.':'A consulta de reparações desta ferramenta ficará disponível quando os registos forem ligados ao catálogo.');
})();
