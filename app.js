const Shield = (() => {

  /* ---------------- Datos simulados (estado global de la app demo) ---------------- */
  const state = {
    user: { name: localStorage.getItem('userNombre') || 'Renzo Vidal', plan: 'Premium', level: 12, xp: 3260, xpNext: 4000, avatarInitials: localStorage.getItem('userAvatarInitials') || 'RV' },
    score: 78,
    device: { estado: 'Protegido', amenazas: 2, ultimaSim: 'Phishing bancario', tiempoProtegido: '18 días' },
    notifications: [
      { level:'critico', title:'Enlace sospechoso detectado', desc:'En la app de Mensajes, hace 12 min', icon:'fa-triangle-exclamation' },
      { level:'medio', title:'Permiso de ubicación abierto', desc:'App "Linterna Pro" — hace 2 h', icon:'fa-location-dot' },
      { level:'bajo', title:'Actualización de Shield disponible', desc:'Versión 4.2.1 — hace 1 día', icon:'fa-arrow-up-right-dots' },
    ],
  };

  /* ---------------- Utilidades ---------------- */
  function scoreColor(v){
    if (v >= 80) return getCss('--success');
    if (v >= 50) return getCss('--warning');
    return getCss('--danger');
  }
  function getCss(varName){
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  function qs(sel, ctx=document){ return ctx.querySelector(sel); }
  function qsa(sel, ctx=document){ return Array.from(ctx.querySelectorAll(sel)); }
  function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

  /* ---------------- Halo Shield: gauge circular SVG ---------------- */
  function gaugeSVG(value, {size=180, stroke=10, showLabel=true, sub='Security Score'} = {}){
    const r = (size/2) - stroke;
    const c = 2 * Math.PI * r;
    const offset = c - (value/100) * c;
    const color = scoreColor(value);
    return `
      <div class="gauge" style="width:${size}px;height:${size}px;">
        <div class="gauge-glow" style="background:${color}"></div>
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
          <circle class="value-ring" cx="${size/2}" cy="${size/2}" r="${r}"
            stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-final-offset="${offset}"></circle>
        </svg>
        ${showLabel ? `<div class="gauge-center">
          <div class="gauge-number">${value}</div>
          <div class="gauge-sub">${sub}</div>
        </div>` : ''}
      </div>`;
  }
  function animateGauges(root=document){
    qsa('.value-ring', root).forEach(ring => {
      requestAnimationFrame(() => {
        setTimeout(()=>{ ring.style.strokeDashoffset = ring.dataset.finalOffset; }, 120);
      });
    });
  }
  function miniRing(value, size=44){
    const r = (size/2) - 4;
    const c = 2*Math.PI*r;
    const offset = c - (value/100)*c;
    const color = scoreColor(value);
    return `<svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(148,163,184,.15)" stroke-width="4"></circle>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
    </svg>`;
  }

  /* ---------------- Gráficos simulados en canvas ---------------- */
  function drawLineChart(canvas, data, color){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,w,h);
    const max = Math.max(...data)*1.15, min = Math.min(...data)*0.85;
    const step = w/(data.length-1);
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, color+'55'); grad.addColorStop(1, color+'00');

    ctx.beginPath();
    data.forEach((v,i)=>{
      const x = i*step, y = h - ((v-min)/(max-min))*h*0.85 - 6;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    data.forEach((v,i)=>{
      const x = i*step, y = h - ((v-min)/(max-min))*h*0.85 - 6;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin='round'; ctx.stroke();

    data.forEach((v,i)=>{
      const x = i*step, y = h - ((v-min)/(max-min))*h*0.85 - 6;
      ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fillStyle = getCss('--bg'); ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle=color; ctx.stroke();
    });
  }

  function drawBarChart(canvas, data, labels, color){
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr);
    ctx.clearRect(0,0,w,h);
    const max = Math.max(...data)*1.2;
    const gap = 14;
    const barW = (w/data.length) - gap;
    data.forEach((v,i)=>{
      const x = i*(barW+gap) + gap/2;
      const barH = (v/max)*(h-24);
      const y = h - barH;
      const grad = ctx.createLinearGradient(0,y,0,h);
      grad.addColorStop(0,color); grad.addColorStop(1,color+'33');
      roundRect(ctx, x, y, barW, barH, 6);
      ctx.fillStyle = grad; ctx.fill();
    });
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  /* ---------------- Toasts ---------------- */
  function ensureToastStack(){
    let stack = qs('.toast-stack');
    if(!stack){ stack = document.createElement('div'); stack.className='toast-stack'; document.body.appendChild(stack); }
    return stack;
  }
  const toastMeta = {
    success: { icon:'fa-circle-check' }, error: { icon:'fa-circle-xmark' },
    warning: { icon:'fa-triangle-exclamation' }, info: { icon:'fa-shield-halved' },
  };
  function toast(type, title, desc='', duration=4200){
    const stack = ensureToastStack();
    const meta = toastMeta[type] || toastMeta.info;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${meta.icon}"></i></div>
      <div class="toast-body"><b>${title}</b>${desc ? `<p>${desc}</p>` : ''}</div>
      <button class="toast-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>`;
    stack.appendChild(el);
    const remove = () => { el.classList.add('leaving'); setTimeout(()=>el.remove(), 250); };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
  }

  /* ---------------- Modales ---------------- */
  function openModal(id){ const m = document.getElementById(id); if(m) m.classList.add('open'); }
  function closeModal(id){ const m = document.getElementById(id); if(m) m.classList.remove('open'); }
  function wireModals(){
    qsa('[data-open-modal]').forEach(btn=>{
      btn.addEventListener('click', ()=> openModal(btn.dataset.openModal));
    });
    qsa('.modal-overlay').forEach(overlay=>{
      overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.classList.remove('open'); });
      overlay.querySelectorAll('[data-close-modal]').forEach(b=> b.addEventListener('click', ()=> overlay.classList.remove('open')));
    });
  }

  /* ---------------- Side panel ---------------- */
  function wireSidePanel(){
    const overlay = qs('.side-panel-overlay');
    if(!overlay) return;
    qsa('[data-open-panel]').forEach(btn => btn.addEventListener('click', ()=> overlay.classList.add('open')));
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.classList.remove('open'); });
    qsa('[data-close-panel]', overlay).forEach(b=> b.addEventListener('click', ()=> overlay.classList.remove('open')));
  }

  /* ---------------- Dropdowns ---------------- */
  function wireDropdowns(){
    qsa('.dropdown').forEach(dd=>{
      const trigger = qs('.dropdown-trigger', dd);
      if(!trigger) return;
      trigger.addEventListener('click', e=>{
        e.stopPropagation();
        const wasOpen = dd.classList.contains('open');
        qsa('.dropdown.open').forEach(o=>o.classList.remove('open'));
        if(!wasOpen) dd.classList.add('open');
      });
    });
    document.addEventListener('click', ()=> qsa('.dropdown.open').forEach(o=>o.classList.remove('open')));
  }

  /* ---------------- Sidebar / layout ---------------- */
  const NAV = [
    { group:'Principal', items:[
      { id:'dashboard', icon:'fa-gauge-high', label:'Dashboard', href:'dashboard.html' },
      { id:'diagnostico', icon:'fa-magnifying-glass-chart', label:'Diagnóstico', href:'diagnostico.html' },
      { id:'security-score', icon:'fa-shield-halved', label:'Security Score', href:'security-score.html' },
      { id:'alertas', icon:'fa-bell', label:'Centro de Alertas', href:'dashboard.html#alertas', badge:2 },
    ]},
    { group:'Entrenamiento', items:[
      { id:'simulaciones', icon:'fa-user-secret', label:'Simulaciones', href:'simulaciones.html' },
      { id:'gamificacion', icon:'fa-trophy', label:'Gamificación', href:'gamificacion.html' },
      { id:'cursos', icon:'fa-graduation-cap', label:'Centro Educativo', href:'cursos.html' },
    ]},
    { group:'Comunidad', items:[
      { id:'comunidad', icon:'fa-people-group', label:'Comunidad', href:'comunidad.html' },
      { id:'premium', icon:'fa-crown', label:'Premium', href:'premium.html' },
    ]},
    { group:'Cuenta', items:[
      { id:'perfil', icon:'fa-user', label:'Perfil', href:'perfil.html' },
      { id:'admin', icon:'fa-user-shield', label:'Panel Admin', href:'admin.html' },
    ]},
  ];

  function renderSidebar(active){
    const mount = qs('#sidebar-mount');
    if(!mount) return;
    const groups = NAV.map(g => `
      <div class="nav-group">
        <div class="nav-group-title">${g.group}</div>
        ${g.items.map(it => `
          <a class="nav-item ${it.id===active?'active':''}" href="${it.href}" data-tooltip="${it.label}">
            <i class="fa-solid ${it.icon}"></i><span>${it.label}</span>
            ${it.badge ? `<span class="nav-badge">${it.badge}</span>`:''}
          </a>`).join('')}
      </div>`).join('');

    mount.innerHTML = `
      <div class="sidebar-brand">
        <div class="logo-mark"><i class="fa-solid fa-shield-halved"></i></div>
        <div class="brand-text"><b>SHIELD</b><span>Protegiendo tu vida digital</span></div>
        <button class="sidebar-close" data-close-sidebar aria-label="Cerrar menú"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <a href="security-score.html" class="sidebar-mini-score" data-tooltip="Security Score">
        <div class="ring-mini">${miniRing(state.score,44)}</div>
        <div>
          <div class="label">Protección</div>
          <div class="value">${state.score}/100</div>
        </div>
      </a>
      <nav>${groups}</nav>
      <div class="sidebar-footer">
        <a class="nav-item" href="login.html" data-tooltip="Cerrar sesión"><i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span></a>
      </div>`;
    qsa('[data-close-sidebar]', mount).forEach(btn => btn.addEventListener('click', () => {
      const shell = qs('.app-shell');
      if(shell) shell.classList.remove('sidebar-open', 'sidebar-hidden', 'is-collapsed');
    }));
  }

  function renderHeader({ title, crumbs=[] }){
    const mount = qs('#header-mount');
    if(!mount) return;
    const crumbTrail = crumbs.map((c,i)=> i===crumbs.length-1
      ? `<span class="current">${c}</span>`
      : `<span>${c}</span><i class="fa-solid fa-chevron-right" style="font-size:9px"></i>`).join(' ');

    mount.innerHTML = `
      <button class="header-toggle" id="sidebarToggle" aria-label="Alternar menú"><i class="fa-solid fa-bars"></i></button>
      <div class="breadcrumbs">${crumbTrail || `<span class="current">${title}</span>`}</div>
      <div class="header-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Buscar amenazas, cursos, simulaciones…">
      </div>
      <div class="header-actions">
        <button class="icon-btn" data-tooltip="Notificaciones" data-open-panel><i class="fa-solid fa-bell"></i><span class="dot"></span></button>
        <button class="icon-btn" data-tooltip="Ayuda"><i class="fa-solid fa-circle-question"></i></button>
        <div class="dropdown header-user" style="border-left:none;padding-left:0;">
          <div class="dropdown-trigger flex items-center gap-10" style="cursor:pointer;">
            <div class="avatar">${state.user.avatarInitials}</div>
            <div class="who"><b>${state.user.name}</b><span>Plan ${state.user.plan}</span></div>
            <i class="fa-solid fa-chevron-down fs-12 text-faint"></i>
          </div>
          <div class="dropdown-menu">
            <a href="perfil.html"><i class="fa-solid fa-user"></i> Mi perfil</a>
            <a href="premium.html"><i class="fa-solid fa-crown"></i> Suscripción</a>
            <a href="admin.html"><i class="fa-solid fa-user-shield"></i> Panel admin</a>
            <hr>
            <a href="login.html"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a>
          </div>
        </div>
      </div>`;

    qs('#sidebarToggle').addEventListener('click', ()=>{
      const shell = qs('.app-shell');
      if(!shell) return;
      if(window.innerWidth <= 1024){
        // En móvil: abrir/cerrar sidebar
        shell.classList.toggle('sidebar-open');
        shell.classList.remove('sidebar-hidden', 'is-collapsed');
      } else {
        // En desktop: colapsar/expandir sidebar
        shell.classList.toggle('is-collapsed');
        shell.classList.remove('sidebar-open', 'sidebar-hidden');
      }
    });
  }

  function renderNotifPanel(){
    const mount = qs('#notif-panel-mount');
    if(!mount) return;
    const icons = { critico:'fa-circle-exclamation', alto:'fa-triangle-exclamation', medio:'fa-info', bajo:'fa-check' };
    mount.innerHTML = `
      <div class="side-panel-overlay">
        <div class="side-panel">
          <div class="modal-header">
            <h3>Notificaciones</h3>
            <button class="modal-close" data-close-panel><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="flex flex-col gap-12">
            ${state.notifications.map(n => `
              <div class="card" style="padding:16px;">
                <div class="flex items-center gap-12">
                  <div class="stat-tile icon bg-${n.level==='critico'?'red':n.level==='medio'?'blue':'green'}" style="width:38px;height:38px;">
                    <i class="fa-solid ${n.icon}"></i>
                  </div>
                  <div style="flex:1">
                    <b class="fs-13">${n.title}</b>
                    <p class="fs-12 mt-8">${n.desc}</p>
                  </div>
                </div>
              </div>`).join('')}
          </div>
          <button class="btn btn-secondary btn-block mt-20">Ver todas las alertas</button>
        </div>
      </div>`;
  }

  /* ---------------- Scroll reveal simple ---------------- */
  function wireReveal(){
    const els = qsa('[data-reveal]');
    if(!('IntersectionObserver' in window) || !els.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold:.12 });
    els.forEach(el=>io.observe(el));
  }

  /* ---------------- Sidebar scrim para móvil ---------------- */
  function ensureScrim(){
    const shell = qs('.app-shell');
    if(!shell || qs('.sidebar-scrim')) return;
    const scrim = document.createElement('div');
    scrim.className = 'sidebar-scrim';
    scrim.addEventListener('click', ()=> shell.classList.remove('sidebar-open'));
    shell.prepend(scrim);
  }

  /* ---------------- Init general ---------------- */
  function initLayout({ active, title, crumbs }){
    renderSidebar(active);
    renderHeader({ title, crumbs });
    renderNotifPanel();
    ensureScrim();
    wireModals();
    wireSidePanel();
    wireDropdowns();
    window.scrollTo(0,0);
    const loader = qs('.app-loader');
    if(loader){
      setTimeout(()=>{
        loader.classList.add('hidden');
        setTimeout(()=> loader.style.display = 'none', 250);
      }, 550);
    }
  }

  return {
    state, qs, qsa, initials,
    gaugeSVG, animateGauges, miniRing,
    drawLineChart, drawBarChart,
    toast, openModal, closeModal,
    initLayout, wireReveal, scoreColor,
  };
})();
