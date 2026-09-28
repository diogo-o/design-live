/* Administration prototype: user identity, template membership and PDF directory. */
(() => {
  if (document.body.dataset.betaPage !== 'admin') return;
  const $ = selector => document.querySelector(selector);
  const nav = $('.admin-nav');
  nav.querySelectorAll('[data-view="apps"],[data-view="audit"]').forEach(node => node.remove());
  $('#apps')?.remove();
  $('#audit')?.remove();
  nav.insertAdjacentHTML('beforeend', '<button type="button" data-view="settings">Definições</button>');
  $('.admin-main').insertAdjacentHTML('beforeend', '<section class="admin-view" id="settings"></section>');
  nav.querySelector('[data-view="settings"]').onclick = () => {
    nav.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.view === 'settings'));
    document.querySelectorAll('.admin-view').forEach(view => view.classList.toggle('active', view.id === 'settings'));
  };

  const templateKey = 'betaAccessTemplates';
  const userKey = 'betaUsers';
  const defaults = [
    {name:'Responsável operacional',modules:['jobon','controlo-aprovar','boquilhas']},
    {name:'Operador',modules:['jobon','controlo-criar','boquilhas']}
  ];
  const sampleUsers = [
    {id:'u1',number:'1001',name:'João Silva',email:'joao.silva@empresa.pt',title:'Chefe',template:'Responsável operacional',state:'Ativo',last:'14/08/2026 · 10:42'},
    {id:'u2',number:'9000',name:'Admin DMO',email:'admin@empresa.pt',title:'Administração',template:null,isAdmin:true,state:'Ativo',last:'Nunca'},
    {id:'u3',number:'1003',name:'Rui Costa',email:'rui.costa@empresa.pt',title:'Operador',template:'Operador',state:'Ativo',last:'Nunca'}
  ];
  const read = (key, fallback) => {try {const value=JSON.parse(sessionStorage.getItem(key));return Array.isArray(value)?value:fallback} catch {return fallback}};
  let templates = read(templateKey, defaults);
  let users = read(userKey, sampleUsers);
  let selectedUserId = null;
  let selectedTemplate = templates[0]?.name || null;
  let selectedMemberId = null;
  let editingUserId = null;
  let editingTemplateName = null;
  const save = () => {sessionStorage.setItem(templateKey, JSON.stringify(templates));sessionStorage.setItem(userKey, JSON.stringify(users))};
  const toast = message => {const node=$('#toast');node.textContent=message;node.classList.add('show');setTimeout(()=>node.classList.remove('show'),2400)};
  const cell = (row, value) => {const td=document.createElement('td');td.textContent=value ?? '—';row.append(td)};
  const currentUser = () => users.find(user=>user.id===selectedUserId);
  const syncActions = () => {
    const user=currentUser();
    $('#selectedUserLabel').textContent=user?`${user.name} · Nº ${user.number}`:'Selecione um utilizador';
    $('#openSelectedUser').disabled=!user;
  };

  const table=$('#userRows');
  $('#users thead tr').innerHTML='<th>Nome</th><th>Nº funcionário</th><th>Email</th><th>Título / função</th><th>Template</th><th>Estado</th><th>Último acesso</th>';
  $('#users .table-card').insertAdjacentHTML('beforeend','<div class="beta-table-actions"><span id="selectedUserLabel">Selecione um utilizador</span><button type="button" class="dmo-button" id="openSelectedUser" disabled>Abrir ficha</button></div>');
  $('#users').insertAdjacentHTML('beforeend','<section id="userDetailPage" class="dmo-card beta-user-detail" hidden><div class="page-head"><div><h2 id="userDetailName">Utilizador</h2><p>Ficha do utilizador selecionado</p></div><button type="button" class="dmo-button ghost" id="backUsers">Voltar aos utilizadores</button></div><div id="userDetailFields" class="beta-user-fields"></div><div class="beta-table-actions beta-user-detail-actions"><button type="button" class="dmo-button" id="editUserFromDetail">Editar utilizador</button><button type="button" class="dmo-button" id="resetUserFromDetail">Reset password</button><button type="button" class="dmo-button danger" id="removeUserFromDetail">Remover utilizador</button></div></section>');
  const detail=$('#userDetailPage');
  const listParts=[$('#users > .page-head'),$('#users > .toolbar'),$('#users .table-card')];
  const closeDetail=()=>{detail.hidden=true;listParts.forEach(part=>part.hidden=false)};
  const showDetail=user=>{
    selectedUserId=user.id;syncActions();
    $('#userDetailName').textContent=user.name;
    const fields=$('#userDetailFields');fields.replaceChildren();
    [['Nome',user.name],['Número de funcionário',user.number],['Email',user.email],['Título / função',user.title],['Acesso',user.isAdmin?'Administrador':user.template||'Sem template'],['Estado',user.state],['Último acesso',user.last]].forEach(([label,value])=>{const box=document.createElement('div'),caption=document.createElement('span'),text=document.createElement('strong');caption.textContent=label;text.textContent=value;box.append(caption,text);fields.append(box)});
    listParts.forEach(part=>part.hidden=true);detail.hidden=false;
  };
  $('#backUsers').onclick=closeDetail;
  const renderUsers=()=>{
    const search=$('#userSearch').value.trim().toLocaleLowerCase('pt-PT'),state=$('#userState').value;
    table.replaceChildren();
    users.filter(user=>(state==='all'||user.state.toLowerCase()===(state==='active'?'ativo':'inativo'))&&(!search||[user.name,user.number,user.email,user.title,user.template].join(' ').toLocaleLowerCase('pt-PT').includes(search))).forEach(user=>{
      const row=document.createElement('tr');row.tabIndex=0;row.dataset.userId=user.id;row.classList.toggle('selected',user.id===selectedUserId);row.setAttribute('aria-selected',String(user.id===selectedUserId));
      [user.name,user.number,user.email,user.title,user.isAdmin?'Administrador':user.template||'Sem template',user.state,user.last].forEach(value=>cell(row,value));
      row.onclick=()=>{selectedUserId=user.id;table.querySelectorAll('tr').forEach(item=>{item.classList.toggle('selected',item===row);item.setAttribute('aria-selected',String(item===row))});syncActions()};row.ondblclick=()=>showDetail(user);
      row.onkeydown=event=>{if(event.key==='Enter')showDetail(user);if(event.key===' '){event.preventDefault();selectedUserId=user.id;row.click()}};
      table.append(row);
    });
    $('#users .table-title .dmo-pill').textContent=`${users.length} utilizadores`;
    syncActions();
  };
  $('#userSearch').oninput=renderUsers;$('#userState').onchange=renderUsers;
  const form=$('#userForm');
  const templateSelect=$('#editUserTemplate');
  const refreshTemplateSelect=()=>{
    const old=templateSelect.value;templateSelect.replaceChildren();
    const empty=new Option('Sem template','');templateSelect.add(empty);
    templates.forEach(template=>templateSelect.add(new Option(template.name,template.name)));
    templateSelect.value=templates.some(template=>template.name===old)?old:'';
  };
  const openUser=user=>{
    editingUserId=user?.id||null;form.reset();refreshTemplateSelect();
    $('#userModalTitle').textContent=user?'Editar utilizador':'Criar utilizador';
    $('#editName').value=user?.name||'';$('#editEmail').value=user?.email||'';
    $('#editEmployeeNumber').value=user?.number||'';$('#editLabel').value=user?.title||'';
    templateSelect.value=user?.template||'';templateSelect.disabled=!!user?.isAdmin;$('#editUserState').value=user?.state||'Ativo';
    $('#userModal').classList.add('open');
  };
  $('#newUser').onclick=()=>openUser(null);
  $('#openSelectedUser').onclick=()=>{const user=currentUser();if(user)showDetail(user)};
  $('#editUserFromDetail').onclick=()=>{const user=currentUser();if(user)openUser(user)};
  $('#resetUserFromDetail').onclick=()=>{const user=currentUser();if(user&&confirm(`Iniciar reset de password para ${user.name}?`))toast('Reset iniciado nesta demonstração')};
  $('#removeUserFromDetail').onclick=()=>{
    const user=currentUser();
    if(!user||!confirm(`Remover ${user.name} (Nº ${user.number}) desta demonstração?`))return;
    users=users.filter(item=>item.id!==user.id);
    selectedUserId=null;selectedMemberId=null;
    save();closeDetail();renderUsers();renderTemplates();toast('Utilizador removido nesta demonstração');
  };
  form.onsubmit=event=>{
    event.preventDefault();const number=$('#editEmployeeNumber').value.trim();const email=$('#editEmail').value.trim();
    if(users.some(user=>user.id!==editingUserId&&user.number===number)){toast('Este número de funcionário já está atribuído');return}
    if(users.some(user=>user.id!==editingUserId&&user.email.toLowerCase()===email.toLowerCase())){toast('Este email já está atribuído');return}
    const user=users.find(item=>item.id===editingUserId);
    const values={name:$('#editName').value.trim(),number,email,title:$('#editLabel').value.trim(),template:templateSelect.value||null,state:$('#editUserState').value};
    if(user)Object.assign(user,values);else users.push({id:(crypto.randomUUID?.()||String(Date.now())),...values,last:'Nunca'});
    $('#userModal').classList.remove('open');save();renderUsers();renderTemplates();if(!detail.hidden&&user)showDetail(user);toast('Utilizador guardado nesta demonstração');
  };

  const moduleChoices=[['jobon','Planeamento · Job On'],['controlo-criar','Controlo Criar'],['controlo-aprovar','Controlo Aprovar'],['boquilhas','Boquilhas']];
  const templateView=$('#templates');
  templateView.innerHTML='<div class="page-head"><div><h2>Templates de acesso</h2><p>Consulte os utilizadores e módulos de cada template.</p></div><button class="dmo-button" type="button" id="createAccessTemplate">Criar template</button></div><div class="beta-template-workspace"><div class="beta-template-list dmo-card" id="accessTemplateList"></div><section class="dmo-card beta-template-members" id="templateMembers"></section></div><form class="beta-template-editor dmo-card" id="accessTemplateEditor" hidden><div class="page-head"><div><h3 id="templateFormHeading">Template</h3><p>Escolha os módulos e a ordem de apresentação.</p></div><button class="dmo-button ghost" type="button" id="cancelAccessTemplate">Voltar</button></div><div class="dmo-field"><label for="accessTemplateName">Nome do template</label><input id="accessTemplateName" required maxlength="80"></div><fieldset class="beta-template-options"><legend>Módulos atribuídos e ordem dos separadores</legend></fieldset><div class="beta-template-actions"><button class="dmo-button" type="submit" id="saveAccessTemplate">Guardar template</button></div></form>';
  const templateList=$('#accessTemplateList'),members=$('#templateMembers'),editor=$('#accessTemplateEditor');
  const options=editor.querySelector('.beta-template-options');
  moduleChoices.forEach(([id,label],index)=>{
    const row=document.createElement('div');row.className='beta-template-option';row.dataset.module=id;row.style.order=index;
    const choice=document.createElement('label'),checkbox=document.createElement('input'),caption=document.createElement('strong');checkbox.type='checkbox';checkbox.value=id;caption.textContent=label;choice.append(checkbox,caption);
    const controls=document.createElement('div');controls.className='beta-order-controls';
    for(const [direction,symbol] of [['up','↑'],['down','↓']]){const button=document.createElement('button');button.type='button';button.textContent=symbol;button.setAttribute('aria-label',`${direction==='up'?'Subir':'Descer'} ${label}`);button.onclick=()=>{const rows=[...options.querySelectorAll('.beta-template-option')].sort((a,b)=>Number(a.style.order)-Number(b.style.order));const at=rows.indexOf(row),neighbor=rows[at+(direction==='up'?-1:1)];if(!neighbor)return;const current=row.style.order;row.style.order=neighbor.style.order;neighbor.style.order=current};controls.append(button)}
    row.append(choice,controls);options.append(row);
  });
  const showTemplate=name=>{selectedTemplate=name;selectedMemberId=null;renderTemplates()};
  const renderTemplates=()=>{
    templateList.replaceChildren();
    templates.forEach(template=>{const button=document.createElement('button');button.type='button';button.className='beta-template-item';button.classList.toggle('selected',template.name===selectedTemplate);const label=document.createElement('strong'),count=document.createElement('span');label.textContent=template.name;const n=users.filter(user=>user.template===template.name).length;count.textContent=`${n} ${n===1?'utilizador':'utilizadores'} · ${template.modules.length} módulos`;button.append(label,count);button.onclick=()=>showTemplate(template.name);templateList.append(button)});
    const template=templates.find(item=>item.name===selectedTemplate);
    members.replaceChildren();if(!template)return;
    const heading=document.createElement('div');heading.className='beta-members-heading';const title=document.createElement('div'),h3=document.createElement('h3'),desc=document.createElement('p');h3.textContent=template.name;desc.textContent=`Módulos: ${template.modules.map(id=>moduleChoices.find(choice=>choice[0]===id)?.[1]||id).join(' · ')}`;title.append(h3,desc);const edit=document.createElement('button');edit.type='button';edit.className='dmo-button';edit.textContent='Editar template';edit.onclick=()=>openTemplate(template);heading.append(title,edit);members.append(heading);
    const tableWrap=document.createElement('div');tableWrap.className='dmo-table-wrap';const table=document.createElement('table');table.className='dmo-table';table.innerHTML='<thead><tr><th>Utilizador</th><th>Nº funcionário</th><th>Estado</th></tr></thead><tbody></tbody>';
    users.filter(user=>user.template===template.name).forEach(user=>{const row=document.createElement('tr');row.tabIndex=0;row.classList.toggle('selected',selectedMemberId===user.id);[user.name,user.number,user.state].forEach(value=>cell(row,value));row.onclick=()=>{selectedMemberId=user.id;table.tBodies[0].querySelectorAll('tr').forEach(item=>item.classList.toggle('selected',item===row));remove.disabled=false};row.ondblclick=()=>{$('#users').classList.add('active');templateView.classList.remove('active');nav.querySelector('[data-view="users"]').classList.add('active');nav.querySelector('[data-view="templates"]').classList.remove('active');showDetail(user)};table.tBodies[0].append(row)});
    tableWrap.append(table);members.append(tableWrap);
    const actions=document.createElement('div');actions.className='beta-members-actions';const select=document.createElement('select');select.setAttribute('aria-label','Utilizador a adicionar');select.add(new Option('Selecionar utilizador',''));users.filter(user=>!user.isAdmin&&user.template!==template.name).forEach(user=>select.add(new Option(`${user.name} · Nº ${user.number}`,user.id)));
    const add=document.createElement('button');add.type='button';add.className='dmo-button';add.textContent='Adicionar utilizador';add.disabled=select.options.length<2;add.onclick=()=>{const user=users.find(item=>item.id===select.value);if(!user)return;user.template=template.name;save();renderUsers();renderTemplates();toast('Utilizador adicionado ao template')};
    const remove=document.createElement('button');remove.type='button';remove.className='dmo-button ghost';remove.textContent='Remover utilizador';remove.disabled=!selectedMemberId;remove.onclick=()=>{const user=users.find(item=>item.id===selectedMemberId);if(!user)return;user.template=null;selectedMemberId=null;save();renderUsers();renderTemplates();toast('Utilizador removido do template')};actions.append(select,add,remove);members.append(actions);
  };
  const workspace=templateView.querySelector('.beta-template-workspace');
  const openTemplate=template=>{
    editingTemplateName=template?.name||null;workspace.hidden=true;editor.hidden=false;editor.reset();
    $('#templateFormHeading').textContent=template?'Editar template':'Criar template';$('#accessTemplateName').value=template?.name||'';
    options.querySelectorAll('.beta-template-option').forEach(row=>{const id=row.dataset.module;row.querySelector('input').checked=!!template?.modules.includes(id);row.style.order=template?.modules.includes(id)?template.modules.indexOf(id):moduleChoices.length+moduleChoices.findIndex(item=>item[0]===id)});
    $('#accessTemplateName').focus();
  };
  $('#createAccessTemplate').onclick=()=>openTemplate(null);
  $('#cancelAccessTemplate').onclick=()=>{editor.hidden=true;workspace.hidden=false};
  editor.onsubmit=event=>{
    event.preventDefault();const name=$('#accessTemplateName').value.trim();const chosen=[...options.querySelectorAll('.beta-template-option')].sort((a,b)=>Number(a.style.order)-Number(b.style.order)).filter(row=>row.querySelector('input').checked).map(row=>row.dataset.module);
    if(!chosen.length){toast('Selecione pelo menos um módulo');return}
    if(templates.some(template=>template.name.toLocaleLowerCase('pt-PT')===name.toLocaleLowerCase('pt-PT')&&template.name!==editingTemplateName)){toast('Já existe um template com esse nome');return}
    if(editingTemplateName){const template=templates.find(item=>item.name===editingTemplateName);template.name=name;template.modules=chosen;users.filter(user=>user.template===editingTemplateName).forEach(user=>user.template=name)}else templates.push({name,modules:chosen});
    selectedTemplate=name;save();refreshTemplateSelect();renderUsers();renderTemplates();editor.hidden=true;workspace.hidden=false;toast('Template guardado nesta demonstração');
  };
  refreshTemplateSelect();renderUsers();renderTemplates();

  $('#settings').innerHTML='<div class="page-head"><div><h2>Definições</h2><p>Localização dos ficheiros PDF do Controlo.</p></div></div><div class="dmo-card beta-admin-settings"><h3>Diretório dos PDFs</h3><p>Escolha a pasta principal onde os PDFs do Controlo serão guardados.</p><div class="dmo-field"><label for="controlPdfDirectory">Pasta selecionada</label><div class="beta-directory-picker"><input id="controlPdfDirectory" readonly placeholder="Nenhuma pasta selecionada"><button type="button" class="dmo-button" id="choosePdfDirectory">Escolher pasta</button></div></div><p class="beta-settings-hint" id="directoryHint">O navegador mostra apenas o nome da pasta; o caminho completo não fica disponível nesta página.</p></div>';
  const directory=$('#controlPdfDirectory');directory.value=sessionStorage.getItem('betaControlPdfDirectory')||'';
  $('#choosePdfDirectory').onclick=async()=>{
    if(!window.showDirectoryPicker){$('#directoryHint').textContent='Este navegador não permite escolher uma pasta para escrita. Use um navegador com suporte para seleção de diretórios.';return}
    try{
      const handle=await window.showDirectoryPicker({mode:'readwrite'});
      const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('betaDmoSettings',1);request.onupgradeneeded=()=>request.result.createObjectStore('settings');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
      await new Promise((resolve,reject)=>{const transaction=db.transaction('settings','readwrite');transaction.objectStore('settings').put(handle,'controlPdfDirectory');transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error)});
      db.close();directory.value=handle.name;sessionStorage.setItem('betaControlPdfDirectory',handle.name);$('#directoryHint').textContent='Pasta associada neste navegador. O acesso será confirmado pelo navegador quando for usado.';toast('Pasta selecionada nesta demonstração');
    }catch(error){if(error.name!=='AbortError'){$('#directoryHint').textContent='Não foi possível associar a pasta. Tente novamente.'}}
  };
})();
