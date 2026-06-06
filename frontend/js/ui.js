/* ── TOAST ─────────────────────────────── */
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }
  function show(msg, type = 'info') {
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="bi ${icons[type]}"></i><span class="toast-msg">${msg}</span>`;
    getContainer().appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  return {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'info'),
  };
})();

/* ── MODAL ─────────────────────────────── */
const Modal = (() => {
  function open(id)  {
    const el = document.getElementById(id);
    el.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function close(id) {
    const el = document.getElementById(id);
    el.classList.remove('show');
    document.body.style.overflow = '';
  }
  function closeOnOverlay(id) {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) close(id);
    });
  }
  return { open, close, closeOnOverlay };
})();

/* ── PAGINATION ─────────────────────────── */
function renderPagination(containerId, infoId, total, page, limit, onPage) {
  const totalPages = Math.ceil(total / limit) || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  document.getElementById(infoId).textContent = `Mostrando ${from}–${to} de ${total}`;

  const c = document.getElementById(containerId);
  c.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'pg-btn'; prev.innerHTML = '<i class="bi bi-chevron-left"></i>';
  prev.disabled = page <= 1;
  prev.onclick = () => onPage(page - 1);
  c.appendChild(prev);

  const range = pagRange(page, totalPages);
  range.forEach(p => {
    if (p === '…') {
      const dots = document.createElement('button');
      dots.className = 'pg-btn'; dots.textContent = '…'; dots.disabled = true;
      c.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'pg-btn' + (p === page ? ' active' : '');
      btn.textContent = p;
      btn.onclick = () => onPage(p);
      c.appendChild(btn);
    }
  });

  const next = document.createElement('button');
  next.className = 'pg-btn'; next.innerHTML = '<i class="bi bi-chevron-right"></i>';
  next.disabled = page >= totalPages;
  next.onclick = () => onPage(page + 1);
  c.appendChild(next);
}

function pagRange(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4)  return [1, 2, 3, 4, 5, '…', total];
  if (page >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
  return [1, '…', page-1, page, page+1, '…', total];
}

/* ── SIDEBAR LAYOUT ─────────────────────── */
function renderLayout(activePage) {
  const user = API.getUser();
  if (!user) { window.location.href = '/'; return; }

  const isAdmin = user.role === 'Admin';
  const perms   = user.permisos || [];
  const has     = (p) => perms.includes(p);

  const nav = [
    { href: '/dashboard.html',   icon: 'bi-speedometer2',       label: 'Dashboard',   always: true },
    { href: '/clientes.html',    icon: 'bi-people',             label: 'Clientes',    perm: 'VER_CLIENTES' },
    { href: '/propiedades.html', icon: 'bi-building',           label: 'Propiedades', perm: 'VER_PROPIEDADES' },
    { href: '/contratos.html',   icon: 'bi-file-earmark-text',  label: 'Contratos',   perm: 'VER_CONTRATOS' },
    { href: '/agentes.html',     icon: 'bi-person-badge',       label: 'Agentes',     perm: 'VER_AGENTES' },
    { href: '/servicios.html',   icon: 'bi-tools',              label: 'Servicios',   perm: 'VER_SERVICIOS' },
    { href: '/cobros.html',      icon: 'bi-arrow-down-circle',  label: 'Cobros',      perm: 'VER_FINANZAS' },
    { href: '/pagos.html',       icon: 'bi-arrow-up-circle',    label: 'Pagos',       perm: 'VER_FINANZAS' },
    { href: '/reportes.html',    icon: 'bi-bar-chart',          label: 'Reportes',    perm: 'VER_REPORTES' },
  ];

  const adminNav = [
    { href: '/usuarios.html',  icon: 'bi-person-badge', label: 'Usuarios',    perm: 'VER_USUARIOS' },
    { href: '/roles.html',     icon: 'bi-shield-lock',  label: 'Roles',       perm: 'VER_ROLES' },
  ];

  function navLink({ href, icon, label }) {
    const active = window.location.pathname === href || activePage === label ? ' active' : '';
    return `<a href="${href}" class="sidebar-link${active}">
      <i class="bi ${icon}"></i> ${label}
    </a>`;
  }

  const mainLinks  = nav.filter(n => n.always || has(n.perm)).map(navLink).join('');
  const adminLinks = adminNav.filter(n => has(n.perm)).map(navLink).join('');

  const initials = (user.username || 'U').slice(0, 2).toUpperCase();

  document.getElementById('app-sidebar').innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="bi bi-buildings-fill"></i></div>
      <div class="sidebar-brand-text">
        <h6>Sistema Britos</h6>
        <small>Gestión Inmobiliaria</small>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-section">Menú</div>
      ${mainLinks}
      ${adminLinks ? `<div class="sidebar-section">Administración</div>${adminLinks}` : ''}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">${initials}</div>
        <div style="overflow:hidden;flex:1;min-width:0">
          <div class="sidebar-user-name">${user.full_name || user.username}</div>
          <div class="sidebar-user-role">${user.role || ''}</div>
        </div>
      </div>
      <a href="#" class="sidebar-link" id="btn-logout">
        <i class="bi bi-box-arrow-left"></i> Cerrar sesión
      </a>
    </div>
  `;

  document.getElementById('topbar-user-name').textContent = user.full_name || user.username;
  document.getElementById('topbar-user-role').textContent = user.role     || '';
  document.getElementById('topbar-avatar').textContent    = initials;

  document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    API.clearSession();
    window.location.href = '/';
  });
}

/* ── HELPERS ─────────────────────────────── */
function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR');
}
