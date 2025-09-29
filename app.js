(() => {
  const CANDIDATES = ['http://localhost:3001', 'http://localhost:3000'];
  let API = CANDIDATES[0];

  async function pickAliveBase() {
    for (const base of CANDIDATES) {
      try {
        const r = await fetch(base, { method: 'GET', cache: 'no-store' });
        if (r.ok) { API = base; return; }
      } catch {  }
    }
  }

  const $grid       = document.getElementById('grid');
  const $empty      = document.getElementById('empty');
  const $loading    = document.getElementById('loading');
  const $error      = document.getElementById('error');
  const $search     = document.getElementById('search');
  const $clear      = document.getElementById('clearBtn');
  const $searchWrap = document.getElementById('searchWrap');

  const $overlay   = document.getElementById('overlay');
  const $modalBody = document.getElementById('modalBody');
  const $closeModal= document.getElementById('closeModal');

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const show = (el) => el.classList.remove('hidden');
  const hide = (el) => el.classList.add('hidden');
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const icon = (id) => `<svg class="ic" aria-hidden="true"><use href="#${id}"/></svg>`;

  function normalizeUser(u = {}) {
    const name = u.fullname ?? u.fullName ?? u.name ?? 'Без имени';
    return {
      id: u.id ?? u.userId ?? u._id ?? Math.random().toString(36).slice(2),
      name,
      phone:   u.phone ?? '',
      email:   u.email ?? '',
      address: u.address ?? '',
      hireDate: u.hire_date ?? u.hireDate ?? '',
      position: u.position_name ?? u.position ?? u.title ?? '',
      dept:     u.department ?? u.subdivision ?? '',
      note:     u.note ?? u.about ?? u.description ?? '',
      raw: u,
    };
  }

  function render(users) {
    $grid.innerHTML = '';
    if (!users.length) { show($empty); return; }
    hide($empty);

    const frag = document.createDocumentFragment();
    users.forEach(u0 => {
      const u = normalizeUser(u0);
      const card = el('article', 'card');
      card.appendChild(el('div', 'name', escapeHtml(u.name)));
      card.appendChild(el('div', 'row', icon('ic-phone') + `<span>${escapeHtml(u.phone || '—')}</span>`));
      card.appendChild(el('div', 'row', icon('ic-mail')  + `<span>${escapeHtml(u.email || '—')}</span>`));
      card.addEventListener('click', () => openModal(u));
      frag.appendChild(card);
    });
    $grid.appendChild(frag);
  }

  function openModal(u) {
    $modalBody.innerHTML = '';
    const kv = (k, v) => {
      const row = el('div', 'kv');
      row.appendChild(el('b', '', escapeHtml(k)));
      row.appendChild(el('div', '', v ? escapeHtml(v) : '—'));
      return row;
    };

    $modalBody.appendChild(el('h2', '', `<span id="modalTitle">${escapeHtml(u.name)}</span>`));
    $modalBody.appendChild(kv('Телефон:', u.phone));
    $modalBody.appendChild(kv('Почта:', u.email));
    $modalBody.appendChild(kv('Дата приема:', u.hireDate));
    $modalBody.appendChild(kv('Должность:', u.position));
    $modalBody.appendChild(kv('Подразделение:', u.dept));
    $modalBody.appendChild(kv('Адрес:', u.address));

    if (u.note) {
      $modalBody.appendChild(el('div', 'section-title', 'Дополнительная информация:'));
      $modalBody.appendChild(el('div', 'note', escapeHtml(u.note)));
    }

    const title = el('div', 'section-title', 'Дополнительная информация:');
    const note  = el('div', 'note', escapeHtml(u.note || '—'));
    $modalBody.appendChild(title);
    $modalBody.appendChild(note);

    $overlay.classList.remove('hidden');
    $overlay.setAttribute('aria-hidden', 'false');
  }
  function closeModal(){ $overlay.classList.add('hidden'); $overlay.setAttribute('aria-hidden', 'true'); }
  $overlay.addEventListener('click', (e) => { if (e.target === $overlay) closeModal(); });
  $closeModal.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  const pickList = (data) => Array.isArray(data) ? data : (data?.data ?? []);
  async function fetchUsers(term = '') {
    hide($error); hide($empty); show($loading);
    try {
      const url = new URL(API);
      if (term.trim()) url.searchParams.set('term', term.trim());
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      render(pickList(data));
    } catch (err) {
      console.error(err);
      render([]); show($error);
    } finally {
      hide($loading);
    }
  }

  const onType = debounce(() => fetchUsers($search.value), 300);
  $search.addEventListener('input', () => {
    $searchWrap.classList.toggle('has-text', $search.value.length > 0);
    onType();
  });
  document.getElementById('searchBtn')?.addEventListener('click', () => fetchUsers($search.value));
  $clear.addEventListener('click', () => {
    $search.value = '';
    $searchWrap.classList.remove('has-text');
    fetchUsers('');
    $search.focus();
  });

  (async () => {
    await pickAliveBase();
    await fetchUsers('');
  })();
})();
