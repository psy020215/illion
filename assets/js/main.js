{
  const page = document.body.dataset.page || 'home';
  const links = [
    ['about', 'about.html', '회사 소개'],
    ['solutions', 'solutions.html', '사업 분야'],
    ['news', 'news.html', '뉴스'],
    ['contact', 'contact.html', '문의하기']
  ];
  const logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="#8fd3ff" stroke-width="2"/><circle cx="16" cy="9" r="3" fill="#ff5c8a"/><circle cx="9" cy="20" r="3" fill="#8fd3ff"/><circle cx="23" cy="20" r="3" fill="#fff"/><path d="M16 9 9 20h14z" fill="none" stroke="#fff" stroke-width="1.4"/></svg>';

  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'top';
    header.innerHTML = `<div class="wrap">
      <a class="logo" href="index.html">${logo}<span>Acme AI</span></a>
      <button class="menu" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav">☰</button>
      <nav class="nav" id="nav">${links.map(([k, h, t]) =>
        `<a href="${h}"${k === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
    </div>`;
    const btn = header.querySelector('.menu'), nav = header.querySelector('.nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'foot';
    footer.innerHTML = `<div class="wrap">
      <div><a class="logo" href="index.html" style="color:#fff">${logo}<span>Acme AI</span></a>
        <p style="margin-top:12px">데이터와 AI로 산업의 문제를 해결합니다.</p></div>
      <div><h4>바로가기</h4>${links.map(([, h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>
      <div><h4>연락처</h4><span>서울특별시 강남구 테헤란로 000</span><br><span>contact@acme-ai.example</span><br><span>02-000-0000</span></div>
      <div class="copy">© ${new Date().getFullYear()} Acme AI. All rights reserved. · 시안용 샘플 회사명·문구입니다.</div>
    </div>`;
  }

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('form-ok').classList.add('show');
      form.reset();
    });
  }
}
