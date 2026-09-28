(() => {
  const lines=['B1','B2','B3','C1','C2','C3'];
  const defaults={B1:'Externo A',B2:'Externo B',B3:'',C1:'Externo A',C2:'Externo B',C3:'Externo A'};
  const defaultRepairers=['Externo A','Externo B'];
  const repairerListKey='betaBqRepairerList';
  const mapKey='betaRepairers';

  function getRepairers(){
    try{
      const raw=sessionStorage.getItem(repairerListKey);
      if(raw){
        const parsed=JSON.parse(raw);
        if(Array.isArray(parsed)&&parsed.length)return parsed;
      }
    }catch{}
    return defaultRepairers.slice();
  }

  function saveRepairers(list){
    try{sessionStorage.setItem(repairerListKey,JSON.stringify(list));}catch{}
  }

  function getMap(){
    let saved;
    try{saved=JSON.parse(sessionStorage.getItem(mapKey)||'{}')}catch{saved={}}
    return {...defaults,...saved};
  }

  function saveMap(state){
    try{sessionStorage.setItem(mapKey,JSON.stringify(state));}catch{}
  }

  function populateSelect(select,list){
    const current=select.value;
    select.replaceChildren();
    const empty=document.createElement('option');
    empty.value='';empty.textContent='Sem associação';
    select.appendChild(empty);
    list.forEach(name=>{
      const opt=document.createElement('option');
      opt.value=name;opt.textContent=name;
      select.appendChild(opt);
    });
    if([...select.options].some(o=>o.value===current))select.value=current;
    else select.value='';
  }

  // --- machine-repairer map ---
  const list=document.querySelector('#repairerLines');
  const form=document.querySelector('#repairerForm');
  if(list&&form){
    const state=getMap();
    let selected='';
    const select=form.querySelector('select');
    const button=form.querySelector('button');
    populateSelect(select,getRepairers());

    function renderLines(){
      list.replaceChildren();
      for(const line of lines){
        const row=document.createElement('button');
        row.type='button';
        row.className='beta-settings-line'+(selected===line?' selected':'');
        row.setAttribute('role','option');
        row.setAttribute('aria-selected',selected===line?'true':'false');
        const name=document.createElement('strong');
        name.textContent=line;
        const current=document.createElement('span');
        current.textContent=state[line]||'Sem associação';
        row.append(name,current);
        row.onclick=()=>{
          selected=line;
          select.value=state[line]||'';
          select.disabled=button.disabled=false;
          form.querySelector('h3').textContent='Linha '+line;
          form.querySelector('[role=status]').textContent='';
          renderLines();
        };
        list.append(row);
      }
    }

    form.onsubmit=e=>{
      e.preventDefault();
      if(!selected)return;
      state[selected]=select.value;
      saveMap(state);
      form.querySelector('[role=status]').textContent='Associação da linha '+selected+' guardada.';
      renderLines();
    };
    renderLines();
  }

  // --- repairer registry ---
  const registryTable=document.querySelector('#repairerRegistryTable tbody');
  const addForm=document.querySelector('#repairerAddForm');
  const addInput=document.querySelector('#newRepairerName');
  const addStatus=document.querySelector('#repairerAddStatus');

  function renderRegistry(){
    if(!registryTable)return;
    const repairers=getRepairers();
    registryTable.replaceChildren();
    repairers.forEach((name,index)=>{
      const tr=document.createElement('tr');
      const tdName=document.createElement('td');
      const span=document.createElement('span');
      span.textContent=name;
      tdName.appendChild(span);
      const tdActions=document.createElement('td');
      const editBtn=document.createElement('button');
      editBtn.type='button';editBtn.className='btn';editBtn.textContent='Editar';
      editBtn.onclick=()=>startEdit(tdName,index,name);
      const delBtn=document.createElement('button');
      delBtn.type='button';delBtn.className='btn danger';delBtn.textContent='Remover';
      delBtn.onclick=()=>removeRepairer(index);
      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdActions);
      registryTable.appendChild(tr);
    });
    const select=document.querySelector('#defaultRepairer');
    if(select)populateSelect(select,repairers);
  }

  function startEdit(cell,index,current){
    cell.replaceChildren();
    const wrapper=document.createElement('div');
    wrapper.className='field';
    const input=document.createElement('input');
    input.value=current;
    wrapper.appendChild(input);
    const actions=document.createElement('div');
    actions.className='dmo-mt-2';
    const save=document.createElement('button');
    save.type='button';save.className='btn primary';save.textContent='Guardar';
    const cancel=document.createElement('button');
    cancel.type='button';cancel.className='btn';cancel.textContent='Cancelar';
    actions.appendChild(save);
    actions.appendChild(cancel);
    cell.appendChild(wrapper);
    cell.appendChild(actions);

    save.onclick=()=>{
      const value=input.value.trim();
      if(!value){addStatus.textContent='Nome obrigatório.';return;}
      const list=getRepairers();
      if(list.includes(value)&&value!==current){addStatus.textContent='Reparador já existe.';return;}
      const map=getMap();
      lines.forEach(line=>{if(map[line]===current)map[line]=value;});
      saveMap(map);
      list[index]=value;
      saveRepairers(list);
      addStatus.textContent='Reparador atualizado.';
      renderRegistry();
    };
    cancel.onclick=()=>renderRegistry();
  }

  function removeRepairer(index){
    const list=getRepairers();
    const removed=list[index];
    list.splice(index,1);
    saveRepairers(list);
    const map=getMap();
    lines.forEach(line=>{if(map[line]===removed)map[line]='';});
    saveMap(map);
    addStatus.textContent='Reparador removido.';
    renderRegistry();
    if(list&&form)form.querySelector('[role=status]').textContent='Mapa atualizado após remoção.';
  }

  if(addForm){
    addForm.onsubmit=e=>{
      e.preventDefault();
      const value=addInput.value.trim();
      if(!value){addStatus.textContent='Nome obrigatório.';return;}
      const list=getRepairers();
      if(list.includes(value)){addStatus.textContent='Reparador já existe.';return;}
      list.push(value);
      saveRepairers(list);
      addInput.value='';
      addStatus.textContent='Reparador adicionado.';
      renderRegistry();
    };
  }

  renderRegistry();
})();
