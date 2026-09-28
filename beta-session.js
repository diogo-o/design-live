/* Navigable demo identities. Session data disappears when the browser session ends. */
(() => {
  const accounts = [
    {number:'9000',name:'Admin DMO',role:'admin',title:'Administração',template:null,modules:[],home:'13_ADMIN_01_VISUAL_AUTHORITY_admin.html'},
    {number:'1001',name:'João Silva',role:'chief',title:'Chefe',template:'Responsável operacional',modules:['jobon','controlo-aprovar','boquilhas'],home:'23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html'},
    {number:'1003',name:'Rui Costa',role:'operator',title:'Operador',template:'Operador',modules:['jobon','controlo-criar','boquilhas'],home:'20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html'}
  ];
  const adminEmail = 'admin@baglass.pt';
  const demoPassword = 'Demo123';
  const verifyPassword = password => password === demoPassword;
  const resolve = value => {
    if (!value) return null;
    const normalized = String(value).trim();
    if (normalized.includes('@')) {
      return normalized.toLowerCase() === adminEmail.toLowerCase() ? accounts[0] : null;
    }
    let users,templates;
    try { users=JSON.parse(sessionStorage.getItem('betaUsers'));templates=JSON.parse(sessionStorage.getItem('betaAccessTemplates')) } catch (_) {}
    if(Array.isArray(users)){
      const user=users.find(item=>item.number===normalized&&item.state==='Ativo');
      if(!user)return null;
      const modules=(Array.isArray(templates)?templates:[]).find(item=>item.name===user.template)?.modules||[];
      if(!modules.length&&!user.isAdmin)return null;
      const role=user.isAdmin?'admin':modules.includes('controlo-aprovar')?'chief':'operator';
      return {number:user.number,name:user.name,title:user.title||role,role,template:user.template,modules,home:role==='admin'?'13_ADMIN_01_VISUAL_AUTHORITY_admin.html':role==='chief'?'23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html':'20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html'};
    }
    return accounts.find(account=>account.number===normalized)||null;
  };
  const get = () => { try { return resolve(sessionStorage.getItem('betaDemoUser')) } catch (_) { return null } };
  const set = number => { sessionStorage.setItem('betaDemoUser',number); return get() };
  const logout = () => { sessionStorage.removeItem('betaDemoUser'); location.href='12_LOGIN_01_VISUAL_AUTHORITY_login.html' };
  window.betaDemoSession={accounts,adminEmail,demoPassword,verifyPassword,resolve,get,set,logout};
  if (document.body.dataset.betaPage === 'login') return;
  const account=get();
  if(!account){ location.replace('12_LOGIN_01_VISUAL_AUTHORITY_login.html'); return }
  const page=document.body.dataset.betaPage;
  if(page==='admin'&&account.role!=='admin'){location.replace(account.home);return}
  if(page==='controlo-approve'&&!account.modules.includes('controlo-aprovar')){location.replace(account.home);return}
  if((page==='controlo-create'||page==='pegamentos')&&!account.modules.includes('controlo-criar')){location.replace(account.home);return}
  if(page==='controlo-hub'&&!account.modules.includes('controlo-criar')){location.replace(account.home);return}
  if(account.role==='admin'&&page!=='admin'){location.replace(account.home);return}
  document.querySelectorAll('.dmo-primary-nav a').forEach(link=>{
    const href=link.getAttribute('href')||'';
    if(account.modules?.length && ((href.includes('JOB_ON')&&!account.modules.includes('jobon'))||(href.includes('BOQUILHAS')&&!account.modules.includes('boquilhas'))||(href.includes('CONTROLO')&&!account.modules.some(id=>id.startsWith('controlo'))))){link.remove();return}
    if(account.role==='chief'&&href.includes('CONTROLO'))link.href='23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html';
    if(account.role==='operator'&&href.includes('CONTROLO'))link.href='22_PESO_OPERADOR_01_VISUAL_AUTHORITY_peso-operador.html';
  });
  document.addEventListener('click',event=>{if(event.target.closest('a[href="12_LOGIN_01_VISUAL_AUTHORITY_login.html"]'))sessionStorage.removeItem('betaDemoUser')});
})();
