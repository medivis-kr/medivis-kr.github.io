// Builds every HTML page of the site into ../docs from the templates below,
// src/data/products.json, src/content/*.html and the translation tables in src/i18n/.
//   node tools/build.js
//
// Languages: English is the source and keeps the original URLs (/medivis/...); every other
// language is the same site under its own prefix (/pt/medivis/...). All visible text goes
// through t(): the English sentence is the key, src/i18n/<lang>.json holds the translation.
// A missing translation falls back to English, and the build lists what is missing.
// tools/i18n_review.py exports the review spreadsheet for native speakers and imports their corrections.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/products.json'), 'utf8'));
const VER = new Date().toISOString().slice(0, 16).replace(/\D/g, '');   // cache-busting for site.css/js
// Floating contact buttons (bottom-right on every page). Empty URL = button hidden.
// WhatsApp: CEO Hyunsub Chung, +82 10-3635-6795 (number link works on PC/WhatsApp Web too; the QR link only opened in the app). LinkedIn: MEDIVIS company page (11/6).
const SOCIAL = {
  linkedin: 'https://www.linkedin.com/company/medivis-inc-kr/',
  whatsapp: 'https://wa.me/821036356795',
};
const INQUIRY_TO = 'info@medivis.co.kr';   // FormSubmit target; swap for the alias FormSubmit mails after activation

// ---------- languages ----------
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'mn', label: 'Монгол' },
];
const DICT = {};
for (const l of LANGS) {
  const f = path.join(ROOT, 'src/i18n', `${l.code}.json`);
  DICT[l.code] = l.code === 'en' || !fs.existsSync(f) ? {} : JSON.parse(fs.readFileSync(f, 'utf8'));
}
let LANG = 'en';
const USED = new Set();            // every English string the site uses (written to src/i18n/_source.json)
const MISSING = {};                // lang -> Set of untranslated strings
// Model numbers and codes ("SF-90", "17 X 17", "TF-90 · 4-Way" is text) are not translated.
const isCode = s => /^[A-Z0-9][A-Z0-9 .·×"\-/()+]*$/.test(s) && !/[a-z]/.test(s);
function t(s) {
  if (s == null || s === '') return s;
  s = String(s);
  if (isCode(s)) return s;
  USED.add(s);
  if (LANG === 'en') return s;
  const v = DICT[LANG][s];
  if (v) return v;
  (MISSING[LANG] = MISSING[LANG] || new Set()).add(s);
  return s;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const te = s => esc(t(s));         // translate + escape (plain-text strings)
const L = () => LANGS.find(l => l.code === LANG);

const productUrl = p => `/medivis/product/view/${p.id}/${p.category}/`;
const lineOf = key => data.lines.find(l => l.key === key);
const catName = (line, key) => lineOf(line).categories.find(c => c.key === key).name;

const NAV = [
  { label: 'About Us', href: '/medivis/about/', items: [
    ['Company Overview', '/medivis/about/'], ['Target Markets', '/medivis/marketing/'], ['Mission & Values', '/medivis/mission/']] },
  { label: 'Business', href: '/medivis/today/', items: [
    ['Our Role Today', '/medivis/today/']] },
  { label: 'Products', href: '/medivis/product/xray/', items: data.lines.map(l => [l.name, `/medivis/product/${l.key}/`]) },
  { label: 'Contact Us', href: '/medivis/inquiry/', items: [
    ['Inquiry', '/medivis/inquiry/'], ['Office Locations', '/medivis/location/']] },
];

// Page path ("medivis/about/index.html") -> public URL of that page in a language.
const pageUrl = (rel, code) => (code === 'en' ? '' : `/${code}`) + '/' + rel.replace(/index\.html$/, '');

// ---------- shared pieces ----------
function layout({ rel, title, titleRaw, description, descriptionRaw, section, body, transparentHeader = false, extraScript = '' }) {
  const lang = L();
  const nav = NAV.map(n => `
        <li class="nav-item${n.label === section ? ' is-current' : ''}">
          <a href="${n.href}">${te(n.label)}</a>
          <ul class="nav-sub">${n.items.map(([s, h]) => `<li><a href="${h}">${te(s)}</a></li>`).join('')}</ul>
        </li>`).join('');
  const alternates = LANGS.map(l => `
  <link rel="alternate" hreflang="${l.code}" href="https://www.medivis.co.kr${pageUrl(rel, l.code)}">`).join('') + `
  <link rel="alternate" hreflang="x-default" href="https://www.medivis.co.kr${pageUrl(rel, 'en')}">`;
  const switcher = `
      <div class="lang-switch">
        <button class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z"/></svg><span>${lang.code.toUpperCase()}</span></button>
        <ul class="lang-menu">${LANGS.map(l => `<li><a data-keep href="${pageUrl(rel, l.code)}" hreflang="${l.code}" lang="${l.code}"${l.code === lang.code ? ' aria-current="true"' : ''}>${l.label}</a></li>`).join('')}</ul>
      </div>`;
  const ttl = titleRaw ? esc(titleRaw) + ' | MEDIVIS' : title ? te(title) + ' | MEDIVIS' : 'MEDIVIS';
  return `<!doctype html>
<html lang="${lang.code}"${lang.dir ? ` dir="${lang.dir}"` : ''}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${ttl}</title>
  <meta name="description" content="${descriptionRaw ? esc(descriptionRaw) : te(description || 'MEDIVIS connects certified medical technologies to global markets with precision and trust.')}">
  <meta property="og:title" content="${ttl}">
  <meta property="og:image" content="https://www.medivis.co.kr/common/medivis/img/main/main01.jpg">${alternates}
  <link rel="icon" href="/uploads/favicon/1769137000724_favicon.ico">
  <link rel="stylesheet" href="/common/medivis/css/pretendardvariable.css">${lang.code === 'ar' ? `
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap">` : ''}
  <link rel="stylesheet" href="/assets/site.css?v=${VER}">
</head>
<body>
  <header class="site-header${transparentHeader ? ' is-transparent' : ''}">
    <div class="wrap header-inner">
      <a class="logo" href="/"><img src="/common/medivis/img/logo/medivis_logo.png" alt="MEDIVIS" width="140" height="24"></a>
      <nav class="nav" aria-label="Main"><ul>${nav}
      </ul></nav>${switcher}
      <a class="header-cta" href="/medivis/inquiry/">${te('Contact')}</a>
      <button class="menu-btn" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </header>
  <main>
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <img class="footer-logo" src="/common/medivis/img/logo/medivis_logo.png" alt="MEDIVIS" width="140" height="24">
        <ul class="footer-nav">${NAV.map(n => `<li><a href="${n.href}">${te(n.label)}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-info">
        <p><span>${te('Business Name')} : MEDIVIS</span><span>${te('CEO')} : HYUN SUB CHUNG</span><span>${te('E-mail')} : <a href="mailto:info@medivis.co.kr">info@medivis.co.kr</a></span></p>
        <p>${te('Address')} : <span dir="ltr">Bldg. B, Suite 908, 19 Cheongcho-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, 10542, Republic of Korea (IS Biz Tower Central Phase 2)</span></p>
      </div>
      <div class="footer-bottom">
        <p>Copyright © ${new Date().getFullYear()} MEDIVIS Inc. All rights reserved.</p>
        <p><a data-keep href="/medivis/policy/privacy/">${te('Privacy Policy')}</a><a data-keep href="/medivis/policy/termsuse/">${te('Terms of Use')}</a></p>
      </div>
    </div>
  </footer>
  <div class="float-social">${SOCIAL.linkedin ? `
    <a class="fs-linkedin" href="${SOCIAL.linkedin}" target="_blank" rel="noopener" aria-label="MEDIVIS on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg></a>` : ''}${SOCIAL.whatsapp ? `
    <a class="fs-whatsapp" href="${SOCIAL.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with MEDIVIS on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zM20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.31-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.42z"/></svg></a>` : ''}
  </div>
  <script src="/assets/site.js?v=${VER}"></script>${extraScript}
</body>
</html>
`;
}

// Sub-page banner: MEDIVIS Navy with the brand's "X-ray beam + V" signature lines.
const hero = ({ eyebrow, title, text }) => `
    <section class="page-hero">
      <div class="wrap">
        ${eyebrow ? `<p class="eyebrow">${te(eyebrow)}</p>` : ''}
        <h1>${te(title)}</h1>
        ${text ? `<p class="lead">${te(text)}</p>` : ''}
      </div>
    </section>`;

const tabs = items => `
    <div class="section-tabs"><div class="wrap"><ul>${items.map(([id, label]) =>
      `<li><a href="#${id}">${te(label)}</a></li>`).join('')}</ul></div></div>`;

// "INNOVISION EXII (Ceiling Type-ELIN T5)" -> model on line 1, type on line 2 (no brackets)
const nameHtml = p => {
  const m = p.name.match(/^(.*?)\s*\((.+)\)$/);
  return m ? `<span dir="ltr">${esc(m[1])}</span><span class="name-sub">${te(m[2])}</span>` : `<span dir="ltr">${esc(p.name)}</span>`;
};
// Plain-text name with only the type part translated (for <title> and meta description).
const nameText = p => { const m = p.name.match(/^(.*?)\s*\((.+)\)$/); return m ? `${m[1]} (${t(m[2])})` : p.name; };
const productCard = p => `
          <a class="product-card" href="${productUrl(p)}">
            <div class="product-img${p.imageFit === 'photo' ? ' is-photo' : ''}"${p.imageBg ? ` style="background:${p.imageBg}"` : ''}><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>
            <h3>${p.badge ? `<span class="badge">${te(p.badge)}</span>` : ''}${nameHtml(p)}</h3>
          </a>`;

// Structured detail (specs table, feature rows, highlight cards) for products without a detail board image.
function productDetail(p) {
  // Order: Features, highlight blocks, then Key Specifications last; backgrounds alternate gray/white.
  const blocks = [];
  if (p.features) blocks.push(['features', 'Features', `
        <h2>${te('Features')}</h2>
        ${p.intro ? `<p class="lead-dark intro">${te(p.intro)}</p>` : ''}${p.features.map((f, i) => `
        <div class="feature-row${i % 2 ? ' is-reverse' : ''}">
          <div class="feature-media"><img src="${f.image}" alt="${te(f.title)}" loading="lazy"></div>
          <div class="feature-copy">${f.label ? `<p class="eyebrow">${te(f.label)}</p>` : ''}<h3>${te(f.title)}</h3>${f.text ? `<p>${te(f.text)}</p>` : ''}</div>
        </div>`).join('')}`]);
  (p.highlights || []).forEach((h, i) => blocks.push([`hl-${i}`, h.title.split(' – ')[0], `
        <h2>${te(h.title)}</h2>
        ${h.lead ? `<p class="lead-dark intro">${te(h.lead)}</p>` : ''}${h.images ? `
        <div class="hl-gallery">${h.images.map(g => `<figure style="flex:${g.ratio}"><a href="${g.src}" target="_blank" rel="noopener" title="${te('View full size')}"><img src="${g.src}" alt="${te(g.alt)}" loading="lazy"></a></figure>`).join('')}</div>` : ''}
        <div class="grid-${h.items.length > 3 ? 3 : h.items.length} feature-list">${h.items.map(([s, d], k) => `
          <div class="feature"><span class="num">${String(k + 1).padStart(2, '0')}</span><h3>${te(s)}</h3>${Array.isArray(d)
            ? `<ul class="bullets">${d.map(x => `<li>${te(x)}</li>`).join('')}</ul>` : (d ? `<p>${te(d)}</p>` : '')}</div>`).join('')}
        </div>`]));
  // Captioned photo grids (e.g. operating modes, system components): all text stays HTML for translation.
  (p.galleries || []).forEach((g, i) => blocks.push([`gal-${i}`, g.title, `
        <h2>${te(g.title)}</h2>
        <div class="grid-3 photo-grid">${g.items.map(it => `
          <figure class="photo-card"><div class="photo"><img src="${it.image}" alt="${te(it.title)}" loading="lazy"></div>
            <figcaption>${te(it.title)}${it.text ? `<span>${te(it.text)}</span>` : ''}</figcaption></figure>`).join('')}
        </div>`]));
  if (p.specs) blocks.push(['specs', 'Key Specifications', `
        <h2>${te('Key Specifications')}</h2>
        ${p.intro && !p.features ? `<p class="lead-dark intro">${te(p.intro)}</p>` : ''}
        <table class="spec-table">${p.specs.map(([k, v]) => `<tr><th>${te(k)}</th><td>${te(v)}</td></tr>`).join('')}</table>`]);
  return tabs(blocks.map(([id, label]) => [id, label])) + blocks.map(([id, , html], i) => `
    <section class="section${i % 2 ? '' : ' section-gray'}" id="${id}">
      <div class="wrap">${html}
      </div>
    </section>`).join('');
}

function redirect(to) {
  return `<!doctype html><meta charset="utf-8"><title>MEDIVIS</title><link rel="canonical" href="${to}">` +
    `<meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">MEDIVIS</a>\n`;
}

// ---------- pages (built once per language) ----------
function buildPages() {
  const pages = {};
  const page = (rel, opts) => { pages[rel] = layout({ rel, ...opts }); };

  page('index.html', {
    transparentHeader: true,
    body: `
    <section class="home-hero">
      <div class="wrap">
        <h1>${t('Where Medical Devices<br>Meet the World')}</h1>
        <p class="lead">${t('Connecting certified medical technologies to global <br class="pc">markets with precision and trust.')}</p>
        <div class="btns"><a class="btn btn-light" href="/medivis/about/">${te('About MEDIVIS')}</a><a class="btn btn-line" href="/medivis/product/xray/">${te('View Products')}</a></div>
      </div>
    </section>
    <section class="section">
      <div class="wrap split">
        <div>
          <p class="eyebrow">MEDIVIS Inc.</p>
          <h2>${te('Where Medical Devices Meet the World')}</h2>
        </div>
        <div>
          <p class="lead-dark">${te('MEDIVIS connects today’s medical innovations to global markets—and builds tomorrow’s solutions from within.')}</p>
          <a class="text-link" href="/medivis/about/">${te('More View')}</a>
        </div>
      </div>
    </section>
    <section class="section section-gray">
      <div class="wrap">
        <p class="eyebrow">${te('Why partner with us')}</p>
        <h2>${te('A trusted partner for global medical device collaboration')}</h2>
        <div class="grid-3 feature-list">
          <div class="feature"><span class="num">01</span><h3>${te('Global Connectivity')}</h3><p>${te('Connecting manufacturers with qualified regional partners worldwide.')}</p></div>
          <div class="feature"><span class="num">02</span><h3>${te('Compliance-Driven Operations')}</h3><p>${te('Built on international standards, transparency, and responsible practices.')}</p></div>
          <div class="feature"><span class="num">03</span><h3>${te('Sustainable Growth')}</h3><p>${te('Supporting long-term collaboration through aligned execution and trust.')}</p></div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <p class="eyebrow">${te('Our Product')}</p>
        <h2>${te('Products')}</h2>
        <div class="grid-4 line-cards">${data.lines.flatMap(l => l.categories.map(c => {
          const first = data.products.find(p => p.line === l.key && p.category === c.key);
          return first ? `
          <a class="line-card" href="/medivis/product/${l.key}/#cat-${c.key}">
            <div class="product-img${first.imageFit === 'photo' ? ' is-photo' : ''}"${first.imageBg ? ` style="background:${first.imageBg}"` : ''}><img src="${first.image}" alt="${te(c.name)}" loading="lazy"></div>
            <h3>${te(c.name)}</h3>
          </a>` : ''; })).join('')}
        </div>
      </div>
    </section>
    <section class="cta-band">
      <div class="wrap">
        <h2>${te('Please join us with MEDIVIS')}</h2>
        <p>${te('A trusted partner for global medical device collaboration.')}</p>
        <a class="btn btn-light" href="/medivis/inquiry/">${te('Contact Us')}</a>
      </div>
    </section>`,
  });

  page('medivis/about/index.html', {
    title: 'Company Overview', section: 'About Us',
    body: hero({ eyebrow: 'About Us', title: 'Company Overview',
      text: 'MEDIVIS is a global healthcare solutions company that connects medical device manufacturers with international markets through insight-driven coordination and compliance-focused execution.' })
    + tabs([['overview', 'Overview'], ['model', 'How We Connect']]) + `
    <section class="section" id="overview">
      <div class="wrap split">
        <div><p class="eyebrow">MEDIVIS Inc.</p><h2>${te('Where Medical Devices Meet the World')}</h2></div>
        <div><img class="rounded" src="/common/medivis/img/about/about_img.png" alt="" loading="lazy"></div>
      </div>
    </section>
    <section class="section section-gray" id="model">
      <div class="wrap">
        <h2>${te('How We Connect')}</h2>
        <div class="grid-3">
          <div class="step-card"><img src="/common/medivis/img/about/card1.png" alt="" loading="lazy"><span class="num">01</span><h3>${te('Medical Device Manufacturers')}</h3>
            <p>${te('MEDIVIS works with certified medical device manufacturers to support global expansion by aligning product innovation, quality standards, and regulatory requirements.')}</p>
            <ul class="tags">${['Product Innovation', 'Quality & Compliance', 'Regulatory Approval'].map(s => `<li>${te(s)}</li>`).join('')}</ul></div>
          <div class="step-card is-hub"><img src="/common/medivis/img/about/card2.png" alt="" loading="lazy"><span class="num">02</span><h3>MEDIVIS Inc.</h3>
            <p>${te('As a strategic global hub, MEDIVIS bridges manufacturers and global markets by integrating market insight, operational coordination, and compliance-driven execution.')}</p>
            <ul class="tags">${['Market Insight', 'Coordination', 'Compliance'].map(s => `<li>${te(s)}</li>`).join('')}</ul></div>
          <div class="step-card"><img src="/common/medivis/img/about/card3.png" alt="" loading="lazy"><span class="num">03</span><h3>${te('Global Markets')}</h3>
            <p>${te('Through trusted regional partners, MEDIVIS enables localized execution while maintaining global standards across diverse international healthcare markets.')}</p>
            <ul class="tags">${['Regional Distribution', 'Sales & Support', 'Local Execution'].map(s => `<li>${te(s)}</li>`).join('')}</ul></div>
        </div>
      </div>
    </section>`,
  });

  page('medivis/marketing/index.html', {
    title: 'Target Markets', section: 'About Us',
    body: hero({ eyebrow: 'About Us', title: 'Target Markets',
      text: 'We work closely with local partners to ensure localized execution while maintaining global standards of quality and compliance.' }) + `
    <section class="section">
      <div class="wrap">
        <div class="grid-4 region-cards">${['Middle East', 'CIS', 'Africa', 'Asia'].map((r, i) => `
          <div class="region-card"><img src="/common/medivis/img/marketing/marketing0${i + 1}.png" alt="${te(r)}" loading="lazy"><h3>${te(r)}</h3></div>`).join('')}
        </div>
      </div>
    </section>`,
  });

  page('medivis/mission/index.html', {
    title: 'Mission & Values', section: 'About Us',
    body: hero({ eyebrow: 'About Us', title: 'Mission & Values' })
    + tabs([['mission', 'Our Mission'], ['values', 'Our Core Values']]) + `
    <section class="section" id="mission">
      <div class="wrap split">
        <div><p class="eyebrow">${te('Our Mission')}</p><h2>${te('To connect medical innovation with global opportunity—creating value through collaboration, trust, and compliance.')}</h2></div>
        <div><img class="rounded" src="/common/medivis/img/mission/mission_01.png" alt="" loading="lazy"></div>
      </div>
    </section>
    <section class="section section-gray" id="values">
      <div class="wrap">
        <h2>${te('Our Core Values')}</h2>
        <div class="grid-2 feature-list">${[
          ['Partnership & Collaboration', 'We work as an extension of our partners’ teams, aligning goals to create shared and sustainable success.'],
          ['Customer-Centric Approach', 'We design solutions around customer needs, market realities, and measurable outcomes.'],
          ['Trust & Long-Term Relationships', 'We build relationships based on transparency, reliability, and long-term commitment.'],
          ['Compliance & Responsibility', 'We operate with strict adherence to international standards and regulatory requirements.'],
        ].map(([h, d], i) => `
          <div class="feature"><span class="num">0${i + 1}</span><h3>${te(h)}</h3><p>${te(d)}</p></div>`).join('')}
        </div>
      </div>
    </section>`,
  });

  page('medivis/today/index.html', {
    title: 'Our Role Today', section: 'Business',
    body: hero({ eyebrow: 'Business', title: 'Our Role Today',
      text: 'MEDIVIS operates as a strategic global connector within the medical device ecosystem.' }) + `
    <section class="section">
      <div class="wrap">
        <div class="grid-4 feature-list">${[
          ['Cross-Border Communication', 'Managing communication with manufacturers and customers.'],
          ['Partner Identification', 'Identifying, evaluating, and contracting regional distributors.'],
          ['Sales & Logistics Management', 'Supporting day-to-day sales and marketing activities.'],
          ['Local Market Entry', 'Coordinating market entry strategies with local partners.'],
        ].map(([h, d], i) => `
          <div class="feature"><span class="num">0${i + 1}</span><h3>${te(h)}</h3><p>${te(d)}</p></div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section section-gray">
      <div class="wrap split">
        <div><img class="rounded" src="/common/medivis/img/today/today_img1.png" alt="" loading="lazy"></div>
        <div><p class="lead-dark">${te('This model allows manufacturers to focus on product development and quality, while regional partners deliver localized sales and customer support.')}</p></div>
      </div>
    </section>`,
  });

  for (const line of data.lines) {
    const cats = line.categories.filter(c => data.products.some(p => p.line === line.key && p.category === c.key));
    const other = data.lines.find(l => l !== line);
    page(`medivis/product/${line.key}/index.html`, {
      title: line.name, section: 'Products', description: line.intro,
      // One grid of the line's products; the tabs filter it (and #cat-Digital preselects a tab).
      body: hero({ eyebrow: 'Products', title: line.name, text: line.intro }) + `
    <div class="section-tabs filter-tabs"><div class="wrap"><ul>
${cats.map((c, i) => `
      <li><a href="#cat-${c.key}" data-filter="${c.key}"${i ? '' : ' class="is-active"'}>${te(c.name)}</a></li>`).join('')}
    </ul></div></div>
    <section class="section">
      <div class="wrap">
        <div class="grid-3 product-grid">${data.products.filter(p => p.line === line.key)
          .map(p => productCard(p).replace('class="product-card"', `class="product-card" data-cat="${p.category}"${p.category === cats[0].key ? '' : ' hidden'}`)).join('')}
        </div>
      </div>
    </section>` + (other ? `
    <section class="cta-band cta-slim">
      <div class="wrap"><h2>${te(other.name)}</h2><p>${te(other.intro)}</p><a class="btn btn-light" href="/medivis/product/${other.key}/">${te('View')} ${te(other.name)}</a></div>
    </section>` : ''),
    });
  }

  for (const p of data.products) {
    const line = lineOf(p.line);
    page(`medivis/product/view/${p.id}/${p.category}/index.html`, {
      titleRaw: nameText(p), section: 'Products', descriptionRaw: `${nameText(p)} – ${t(catName(p.line, p.category))} | MEDIVIS ${t(line.name)}`,
      body: `
    <section class="product-top">
      <div class="wrap split">
        <div>
          <p class="crumbs"><a href="/medivis/product/${line.key}/">${te(line.name)}</a> / <a href="/medivis/product/${line.key}/#cat-${p.category}">${te(catName(p.line, p.category))}</a></p>
          ${p.badge ? `<span class="badge">${te(p.badge)}</span>` : ''}
          <h1>${nameHtml(p)}</h1>
          <p class="lead-dark">${te(p.tagline || catName(p.line, p.category))}</p>
          ${p.target ? `<p class="target">${te(p.target)}</p>` : ''}
          <div class="btns"><a class="btn" href="/medivis/inquiry/">${te('Product Inquiry')}</a><a class="btn btn-ghost" href="/medivis/product/${line.key}/">${te('Back to List')}</a></div>
        </div>
        <div class="product-img product-img-lg${p.imageFit === 'photo' && !p.heroImage ? ' is-photo' : ''}"${p.imageBg && !p.heroImage ? ` style="background:${p.imageBg}"` : ''}><img src="${p.heroImage || p.image}" alt="${esc(p.name)}"></div>
      </div>
    </section>` + (p.detail ? `
    <section class="section">
      <div class="wrap detail-board"><img src="${p.detail}" alt="${esc(p.name)}" loading="lazy"></div>
    </section>` : productDetail(p)),
    });
  }

  const formText = {
    required: t('Please fill in all the required fields.'),
    agree: t('Please check I agree to the Privacy Policy.'),
    sending: t('Sending...'),
    sent: t('Your inquiry has been sent. Thank you.'),
    failed: t('Sorry, the inquiry could not be sent. Please email us at'),
    submit: t('Submit Inquiry'),
  };
  page('medivis/inquiry/index.html', {
    title: 'Inquiry', section: 'Contact Us',
    body: hero({ eyebrow: 'Contact Us', title: 'Inquiry', text: 'Tell us about your company and how we can work together.' }) + `
    <section class="section">
      <div class="wrap narrow">
        <form id="inquiry" class="form" novalidate>
          <input type="hidden" name="language" value="${LANG}">
          <div class="form-grid">
            <label>${te('Company Name')}<span>*</span><input name="company_name" required placeholder="${te('Please enter your company name')}"></label>
            <label>${te('Country')}<span>*</span><input name="country" required placeholder="${te('Please enter your country')}"></label>
            <fieldset class="full"><legend>${te('Business Type')}<span>*</span></legend>
              <div class="choices">${['Manufacturer', 'OEM/ODM', 'Trading Company', 'Other'].map(v =>
                `<label class="choice"><input type="radio" name="business" value="${v}" required> ${te(v)}</label>`).join('')}</div>
              <input name="business_text" class="business-other" placeholder="${te('Other')}" hidden>
            </fieldset>
            <label>${te('Full Name')}<span>*</span><input name="full_name" required placeholder="${te('Please enter your full name')}"></label>
            <label>${te('Job Title')}<span>*</span><input name="job_title" required placeholder="${te('Please enter your job title')}"></label>
            <label>${te('Email Address')}<span>*</span><input name="email_address" type="email" required placeholder="${te('Please enter your email address')}"></label>
            <label>${te('Contact Number')}<span>*</span><input name="contact_number" required placeholder="${te('Please enter your contact number')}"></label>
            <label class="full">${te('Message')}<span>*</span><textarea name="message" rows="6" required placeholder="${te('Please enter your message')}"></textarea></label>
          </div>
          <label class="agree"><input type="checkbox" name="agree_check" required> ${t('I agree to the collection and use of my personal data in accordance with the <a href="/medivis/policy/privacy/" target="_blank">Privacy Policy</a> for the purpose of business inquiry and communication.')}</label>
          <button class="btn" type="submit">${esc(formText.submit)}</button>
          <p class="form-msg" role="status"></p>
        </form>
      </div>
    </section>`,
    extraScript: `
  <script>initInquiry("https://formsubmit.co/ajax/${INQUIRY_TO}", "${INQUIRY_TO}", ${JSON.stringify(formText)});</script>`,
  });

  page('medivis/location/index.html', {
    title: 'Office Locations', section: 'Contact Us',
    body: hero({ eyebrow: 'Contact Us', title: 'Office Locations' }) + `
    <section class="section">
      <div class="wrap split location">
        <div>
          <h2>MEDIVIS Inc.</h2>
          <p class="lead-dark" dir="ltr">Bldg. B, Suite 908, 19 Cheongcho-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, 10542, Republic of Korea</p>
          <p dir="ltr">(IS Biz Tower Central Phase 2)</p>
          <p>${te('E-mail')} : <a href="mailto:info@medivis.co.kr">info@medivis.co.kr</a></p>
        </div>
        <div class="map"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3161.898983518012!2d126.85580697629729!3d37.58099632329819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9b9364a62b99%3A0xaeb43aa1b2a59c93!2sIS%20Biz%20Tower%20Central%202!5e0!3m2!1sen!2skr!4v1770282174069!5m2!1sen!2skr" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="MEDIVIS office map"></iframe></div>
      </div>
    </section>`,
  });

  // Legal texts stay English only (a translated policy would need legal review); other languages link here.
  if (LANG === 'en') {
    for (const [key, title, sub] of [['privacy', 'Privacy Policy', '(GDPR Compliant)'], ['termsuse', 'Terms of Use', '']]) {
      page(`medivis/policy/${key}/index.html`, {
        title,
        body: hero({ title, text: sub }) + `
    <section class="section">
      <div class="wrap narrow prose">
${fs.readFileSync(path.join(ROOT, `src/content/${key}.html`), 'utf8')}
      </div>
    </section>`,
      });
    }
    pages['404.html'] = layout({ rel: '404.html',
      title: 'Page Not Found',
      body: hero({ title: 'Page Not Found', text: 'The page you are looking for does not exist.' }) +
        `\n    <section class="section"><div class="wrap"><a class="btn" href="/">Go to Home</a></div></section>`,
    });
    // Partners page removed 11/6; old links go to Our Role Today.
    pages['medivis/partners/index.html'] = redirect('/medivis/today/');
    // Old per-category URLs (/medivis/product/xray/Digital) jump to the matching tab.
    for (const line of data.lines) for (const c of line.categories)
      pages[`medivis/product/${line.key}/${c.key}/index.html`] = redirect(`/medivis/product/${line.key}/#cat-${c.key}`);
    // Removed 11/6: AccuRay D5/D6 (89) and the Endoscopy line (92, 94, 95). Old links land on the X-Ray list.
    for (const rel of ['medivis/product/endoscopy', ...['Imaging', 'Light', 'GAS', 'Integrated', 'Target'].map(c => `medivis/product/endoscopy/${c}`),
                       'medivis/product/view/89/Analog', 'medivis/product/view/92/Integrated',
                       'medivis/product/view/94/Imaging', 'medivis/product/view/95/Light'])
      pages[`${rel}/index.html`] = redirect('/medivis/product/xray/');
  }
  return pages;
}

// Internal links get the language prefix; files (/uploads, /common, /assets), mail links and
// links marked data-keep (language switcher, English-only legal pages) stay as they are.
const prefixLinks = (html, code) => code === 'en' ? html :
  html.replace(/(<a\b[^>]*?)href="\/(?!uploads\/|common\/|assets\/)([^"]*)"/g,
    (m, pre, rest) => /\bdata-keep\b/.test(m) ? m : `${pre}href="/${code}/${rest}"`)
      .replace(/ data-keep/g, '');

// One-time cleanups of folders from the first mirror / removed products.
for (const rel of ['medivis/product/endoscopy', 'medivis/product/view/89', 'medivis/product/view/92',
                   'medivis/product/view/94', 'medivis/product/view/95'])
  fs.rmSync(path.join(DOCS, rel), { recursive: true, force: true });
for (const c of ['GAS', 'Imaging', 'Integrated', 'Light', 'Target'])
  fs.rmSync(path.join(DOCS, 'medivis/product/xray', c), { recursive: true, force: true });

let count = 0;
for (const lang of LANGS) {
  LANG = lang.code;
  const base = lang.code === 'en' ? DOCS : path.join(DOCS, lang.code);
  if (lang.code !== 'en') fs.rmSync(base, { recursive: true, force: true });
  for (const [rel, html] of Object.entries(buildPages())) {
    const f = path.join(base, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, prefixLinks(html, lang.code).replace(/ data-keep/g, ''));
    count++;
  }
}
// English source strings for translators (sorted, stable).
fs.writeFileSync(path.join(ROOT, 'src/i18n/_source.json'), JSON.stringify([...USED].sort(), null, 1) + '\n');
console.log(`built ${count} pages in ${LANGS.length} languages (v=${VER})`);
for (const [code, set] of Object.entries(MISSING)) console.log(`  ${code}: ${set.size} strings not translated yet (English shown)`);
