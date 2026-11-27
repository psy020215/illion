/* 페이지별 화면 그리기. 내용은 content/ 폴더에서 고치세요. */
{
  const { esc, site, products, notices, effects, inCat, isOwn, fail } = window.ILION;
  const $ = id => document.getElementById(id);
  const page = document.body.dataset.page;
  const setText = (id, v) => { const el = $(id); if (el && v != null && v !== '') el.textContent = v; };
  const effTags = p => `<div class="eff">${effects(p).map(e => `<span>${esc(e)}</span>`).join('')}</div>`;

  /* ── 메인 ── */
  if (page === 'home') {
    Promise.all([site, products(), notices()]).then(([s, ps, ns]) => {
      const h = s.home || {}, c = s.company || {}, cats = s.categories || [];
      setText('h-kicker', h.kicker); setText('h-t1', h.title_1); setText('h-t2', h.title_2); setText('h-intro', h.intro);

      $('cats').innerHTML = cats.map(cat => {
        const n = ps.filter(p => inCat(p, cat)).length;
        return `<a class="card cat-card rv" href="products.html?cat=${encodeURIComponent(cat.name)}">
          <div class="n">${n}</div><h3>${esc(cat.name)}</h3><p>${esc(cat.desc)}</p><span class="go">원료 보기 →</span></a>`;
      }).join('');

      const makers = [...new Set(ps.map(p => p.maker))];
      const own = ps.filter(p => isOwn(p, s));
      $('stats').innerHTML = [
        [c.founded, '', '설립 연도', 1990], [ps.length, '+', '취급 원료', 0], [makers.length, '', '협력 제조사', 0], [own.length, '', '자체 개발 원료', 0]
      ].map(([v, suf, l, from]) => `<div><b><span data-n="${esc(v)}" data-from="${from}">${esc(v)}</span><i>${suf}</i></b><span>${l}</span></div>`).join('');
      setText('hero-count', ps.length); setText('hero-makers', makers.length);
      window.ILION.countUp($('stats'));

      $('own').innerHTML = own.map(p => `<a class="card own-card rv" href="products.html?q=${encodeURIComponent(p.name)}">
        <h3>${esc(p.name)}</h3>${p.eff ? effTags(p) : ''}<p class="inci" style="margin-top:10px">${esc(p.inci)}</p></a>`).join('');

      $('news').innerHTML = ns.slice(0, 3).map(n => `<li><a href="notice.html#${n.id}"><span class="label">Notice</span>
        <h3>${esc(n.title)}</h3><p>${esc(n.body.replace(/[*_#>\[\]()`]/g, ''))}</p><time datetime="${esc(n.date)}">${esc(n.date.replace(/-/g, '.'))}</time></a></li>`).join('')
        || '<li class="empty">등록된 공지가 없어요.</li>';

      $('makers').innerHTML = makers.map(m => `<a href="products.html?maker=${encodeURIComponent(m)}">${esc(m)}<span>${ps.filter(p => p.maker === m).length}</span></a>`).join('');
      window.ILION.reveal();
    }).catch(e => fail($('cats'), e));
  }

  /* ── 취급 원료 ── */
  if (page === 'products') {
    Promise.all([site, products()]).then(([s, ps]) => {
      const cats = s.categories || [];
      const params = new URLSearchParams(location.search);
      const state = { q: params.get('q') || '', cat: params.get('cat') || '', maker: params.get('maker') || '' };
      const qIn = $('q'), mSel = $('maker'), chips = $('chips'), body = $('rows'), count = $('count');

      mSel.innerHTML = '<option value="">전체 제조원</option>' + [...new Set(ps.map(p => p.maker))].map(m => `<option>${esc(m)}</option>`).join('');
      chips.innerHTML = [['', '전체'], ...cats.map(c => [c.name, c.name])].map(([v, l]) => `<button class="chip" type="button" data-cat="${esc(v)}">${esc(l)}</button>`).join('');
      qIn.value = state.q; mSel.value = state.maker;

      const hl = (txt, q) => {
        const e = esc(txt); if (!q) return e;
        const re = new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return e.replace(re, m => `<mark>${m}</mark>`);
      };
      const render = () => {
        const q = state.q.trim().toLowerCase(), cat = cats.find(c => c.name === state.cat);
        const list = ps.filter(p => (!state.maker || p.maker === state.maker) && (!cat || inCat(p, cat)) &&
          (!q || [p.maker, p.name, p.inci, p.eff].join(' ').toLowerCase().includes(q)));
        count.textContent = `${ps.length}개 중 ${list.length}개 원료`;
        body.innerHTML = list.map(p => `<tr><td data-l="제조원">${hl(p.maker, q)}</td><td data-l="상품명">${hl(p.name, q)}${isOwn(p, s) ? '<span class="own">자체</span>' : ''}</td>
          <td data-l="INCI">${hl(p.inci, q)}</td><td data-l="효능">${p.eff ? effTags(p) : ''}</td></tr>`).join('')
          || `<tr><td colspan="4" class="empty">조건에 맞는 원료가 없어요.</td></tr>`;
        for (const b of chips.children) b.setAttribute('aria-pressed', b.dataset.cat === state.cat);
        const u = new URLSearchParams(); for (const k of ['q', 'cat', 'maker']) if (state[k]) u.set(k, state[k]);
        try { history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '')); } catch {}
      };
      qIn.addEventListener('input', () => { state.q = qIn.value; render(); });
      mSel.addEventListener('change', () => { state.maker = mSel.value; render(); });
      chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { state.cat = b.dataset.cat; render(); } });
      render();
    }).catch(e => fail($('rows-wrap'), e));
  }

  /* ── 공지사항 ── */
  if (page === 'notice') {
    notices().then(ns => {
      $('notices').innerHTML = ns.map(n => `<article class="notice" id="${n.id}"><time datetime="${esc(n.date)}">${esc(n.date.replace(/-/g, '.'))}</time>
        <h2>${esc(n.title)}</h2><div class="body">${marked.parse(n.body, { breaks: true })}</div></article>`).join('')
        || '<p class="empty">등록된 공지가 없어요.</p>';
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }).catch(e => fail($('notices'), e));
  }

  /* ── 회사 소개 ── */
  if (page === 'about') {
    site.then(s => {
      const a = s.about || {}, c = s.company || {};
      setText('lead2', a.lead); setText('intro-ko', a.intro_ko); setText('intro-en', a.intro_en);
      $('values').innerHTML = (a.values || []).map(v => `<div class="card"><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('');
      $('history').innerHTML = (a.history || []).map(h => `<li><b>${esc(h.year)}</b><div>${esc(h.text)}</div></li>`).join('');
      contact(c);
    }).catch(e => fail($('values'), e));
  }

  /* ── 문의하기 ── */
  if (page === 'contact') {
    site.then(s => {
      const c = s.company || {};
      contact(c);
      $('contact-form').addEventListener('submit', e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const body = `이름: ${f.get('name')}\n회사: ${f.get('company')}\n연락처: ${f.get('phone')}\n이메일: ${f.get('email')}\n\n${f.get('msg')}`;
        location.href = `mailto:${c.email}?subject=${encodeURIComponent('[홈페이지 문의] ' + f.get('type') + ' - ' + f.get('name'))}&body=${encodeURIComponent(body)}`;
        $('form-ok').classList.add('show');
      });
    }).catch(e => fail($('info'), e));
  }

  function contact(c) {
    const info = $('info');
    if (info) info.innerHTML = [['주소', c.address], ['전화', c.tel], ['팩스', c.fax], ['이메일', c.email], ['사업자번호', c.biz_no]]
      .filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    const map = $('map');
    if (map && c.address) map.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(c.address) + '&t=m&z=16&output=embed';
  }
}
