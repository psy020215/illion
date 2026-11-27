/* 공통: 내용 파일 읽기 + 머리말/꼬리말
   내용은 content/ 폴더의 파일에서 고치세요. 이 파일은 고칠 필요가 없어요. */
window.ILION = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // UTF-8(엑셀 'CSV UTF-8' 포함)과 엑셀 기본 CSV(EUC-KR)를 모두 읽어요
  const text = async url => {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' (' + r.status + ')');
    const buf = await r.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, ''); }
    catch { return new TextDecoder('euc-kr').decode(buf); }
  };

  const parseCSV = t => {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) {
        if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && t[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };

  const site = text('content/site.yml').catch(() => text('content/site.yml.txt')).then(t => jsyaml.load(t) || {});

  let _products;
  const products = () => _products ||= text('content/products.csv').then(t => {
    const rows = parseCSV(t).filter(r => r.some(c => c.trim()));
    return rows.slice(1).map(r => ({
      maker: (r[0] || '').trim(), name: (r[1] || '').trim(),
      inci: (r[2] || '').replace(/\s+/g, ' ').trim(), eff: (r[3] || '').trim()
    })).filter(p => p.name);
  });

  const effects = p => p.eff.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const inCat = (p, cat) => (cat.keywords || []).some(k => p.eff.toLowerCase().includes(String(k).toLowerCase()));
  const isOwn = (p, s) => p.maker.toLowerCase() === String(s?.company?.short || 'ILION KOREA').toLowerCase();

  let _notices;
  const notices = () => _notices ||= text('content/notices.md').then(t => {
    t = t.replace(/<!--[\s\S]*?-->/g, '');
    return t.split(/^##\s+/m).slice(1).map((blk, i) => {
      const nl = blk.indexOf('\n');
      const head = (nl < 0 ? blk : blk.slice(0, nl)).trim();
      const body = nl < 0 ? '' : blk.slice(nl + 1).trim();
      const m = head.match(/^(\d{4}-\d{2}-\d{2})\s*\|?\s*(.*)$/);
      const date = m ? m[1] : '';
      return { date, title: (m ? m[2] : head) || '제목 없음', body, id: 'n-' + (date.replace(/-/g, '') || 'x') + '-' + i };
    }).sort((a, b) => b.date.localeCompare(a.date));
  });

  const fail = (el, e) => {
    if (!el) return;
    el.innerHTML = `<div class="err">내용 파일을 불러오지 못했어요: ${esc(e.message)}<br>
      파일을 컴퓨터에서 바로 열면 이렇게 보일 수 있어요. GitHub Pages 주소에서 확인해 주세요.
      content 폴더의 파일을 고쳤다면 형식(들여쓰기, 쉼표)을 확인해 주세요.</div>`;
  };

  // 머리말·꼬리말
  const page = document.body.dataset.page || 'home';
  const links = [['about', 'about.html', '회사 소개'], ['products', 'products.html', '취급 원료'], ['notice', 'notice.html', '공지사항'], ['contact', 'contact.html', '문의하기']];
  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'top';
    header.innerHTML = `<div class="wrap">
      <a class="logo" href="index.html"><span class="logo-text"><span>ILION KOREA</span><small>(주)이리온 코리아</small></span></a>
      <button class="menu" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav">☰</button>
      <nav class="nav" id="nav">${links.map(([k, h, t]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav></div>`;
    const btn = header.querySelector('.menu'), nav = header.querySelector('.nav');
    btn.addEventListener('click', () => btn.setAttribute('aria-expanded', nav.classList.toggle('open')));
  }
  const footer = document.getElementById('site-footer');
  site.then(s => {
    const c = s.company || {};
    if (header && c.short) header.querySelector('.logo-text span').textContent = c.short;
    if (header && c.name_ko) header.querySelector('.logo-text small').textContent = c.name_ko;
    if (!footer) return;
    footer.className = 'foot';
    footer.innerHTML = `<div class="wrap">
      <div><a class="logo" href="index.html" style="color:#fff"><span class="logo-text"><span>${esc(c.short)}</span><small>${esc(c.name_ko)}</small></span></a>
        <p style="margin-top:12px">${esc(c.name_en)}</p></div>
      <div><h4>바로가기</h4>${links.map(([, h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>
      <div><h4>연락처</h4><span>${esc(c.address)}</span><br>
        <span>전화 ${esc(c.tel)}</span><br><span>팩스 ${esc(c.fax)}</span><br><span>${esc(c.email)}</span>
        ${c.biz_no ? `<br><span>사업자등록번호 ${esc(c.biz_no)}</span>` : ''}</div>
      <div class="copy">© ${new Date().getFullYear()} ${esc(c.name_en || c.short)} All rights reserved.</div></div>`;
  }).catch(e => fail(footer, e));

  return { esc, site, products, notices, effects, inCat, isOwn, fail };
})();
