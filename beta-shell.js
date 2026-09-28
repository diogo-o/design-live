/* Shared DMO header. Pages supply only module title and demo user context. */
(() => {
  const host = document.querySelector('[data-shell-module]');
  if (!host) return;

  const logo = document.createElement('img');
  logo.className = 'dmo-shell-logo';
  logo.src = '0_ASSET_LOGO.png';
  logo.alt = 'BA Glass';
  logo.width = 44;
  logo.height = 44;

  const identity = document.createElement('div');
  identity.className = 'dmo-shell-identity';
  const title = document.createElement('strong');
  title.textContent = 'Portal DMO';
  const module = document.createElement('span');
  module.textContent = host.dataset.shellModule;
  identity.append(title, module);

  const user = document.createElement('div');
  user.className = 'dmo-shell-user admin-user';
  const name = document.createElement('strong');
  name.dataset.userProfileName = '';
  const demoUser=window.betaDemoSession?.get();
  name.textContent = demoUser?.name || host.dataset.shellUser || 'Utilizador';
  const role = document.createElement('span');
  role.dataset.userProfileTitle = '';
  role.textContent = demoUser?.title || host.dataset.shellRole || '';
  user.append(name, role);

  const logout = document.createElement('a');
  logout.className = 'dmo-shell-logout';
  logout.href = '12_LOGIN_01_VISUAL_AUTHORITY_login.html';
  logout.textContent = 'Sair';
  logout.setAttribute('aria-label', 'Terminar sessão');
  host.replaceChildren(logo, identity, user, logout);
})();
