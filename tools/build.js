// Builds every HTML page of the site into ../docs from the templates below,
// src/data/products.json and src/content/*.html. Images stay where they are in docs/.
//   node tools/build.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/products.json'), 'utf8'));
const VER = new Date().toISOString().slice(0, 16).replace(/\D/g, '');   // cache-busting for site.css/js
const INQUIRY_TO = 'info@medivis.co.kr';   // FormSubmit target; swap for the alias FormSubmit mails after activation

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const productUrl = p => `/medivis/product/view/${p.id}/${p.category}/`;
const lineOf = key => data.lines.find(l => l.key === key);
const catName = (line, key) => lineOf(line).categories.find(c => c.key === key).name;

const NAV = [
  { label: 'About Us', href: '/medivis/about/', items: [
    ['Company Overview', '/medivis/about/'], ['Target Markets', '/medivis/marketing/'], ['Mission & Values', '/medivis/mission/']] },
  { label: 'Business', href: '/medivis/today/', items: [
    ['Our Role Today', '/medivis/today/'], ['Partners', '/medivis/partners/']] },
  { label: 'Products', href: '/medivis/product/xray/', items: data.lines.map(l => [l.name, `/medivis/product/${l.key}/`]) },
  { label: 'Contact Us', href: '/medivis/inquiry/', items: [
    ['Inquiry', '/medivis/inquiry/'], ['Office Locations', '/medivis/location/']] },
];

// ---------- shared pieces ----------
function layout({ title, description, section, body, transparentHeader = false, extraScript = '' }) {
  const nav = NAV.map(n => `
        <li class="nav-item${n.label === section ? ' is-current' : ''}">
          <a href="${n.href}">${n.label}</a>
          <ul class="nav-sub">${n.items.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul>
        </li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title ? esc(title) + ' | ' : ''}MEDIVIS</title>
  <meta name="description" content="${esc(description || 'MEDIVIS connects certified medical technologies to global markets with precision and trust.')}">
  <meta property="og:title" content="${title ? esc(title) + ' | ' : ''}MEDIVIS">
  <meta property="og:image" content="https://www.medivis.co.kr/common/medivis/img/main/main01.jpg">
  <link rel="icon" href="/uploads/favicon/1769137000724_favicon.ico">
  <link rel="stylesheet" href="/common/medivis/css/pretendardvariable.css">
  <link rel="stylesheet" href="/assets/site.css?v=${VER}">
</head>
<body>
  <header class="site-header${transparentHeader ? ' is-transparent' : ''}">
    <div class="wrap header-inner">
      <a class="logo" href="/"><img src="/common/medivis/img/logo/medivis_logo.png" alt="MEDIVIS" width="140" height="24"></a>
      <nav class="nav" aria-label="Main"><ul>${nav}
      </ul></nav>
      <a class="header-cta" href="/medivis/inquiry/">Contact</a>
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
        <ul class="footer-nav">${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-info">
        <p><span>Business Name : MEDIVIS</span><span>CEO : HYUN SUB CHUNG</span><span>E-mail : <a href="mailto:info@medivis.co.kr">info@medivis.co.kr</a></span></p>
        <p>Address : Bldg. B, Suite 908, 19 Cheongcho-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, 10542, Republic of Korea (IS Biz Tower Central Phase 2)</p>
      </div>
      <div class="footer-bottom">
        <p>Copyright © ${new Date().getFullYear()} MEDIVIS Inc. All rights reserved.</p>
        <p><a href="/medivis/policy/privacy/">Privacy Policy</a><a href="/medivis/policy/termsuse/">Terms of Use</a></p>
      </div>
    </div>
  </footer>
  <script src="/assets/site.js?v=${VER}"></script>${extraScript}
</body>
</html>
`;
}

// Sub-page banner: MEDIVIS Navy with the brand's "X-ray beam + V" signature lines.
const hero = ({ eyebrow, title, text }) => `
    <section class="page-hero">
      <div class="wrap">
        ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
        <h1>${esc(title)}</h1>
        ${text ? `<p class="lead">${text}</p>` : ''}
      </div>
    </section>`;

const tabs = items => `
    <div class="section-tabs"><div class="wrap"><ul>${items.map(([id, label]) =>
      `<li><a href="#${id}">${esc(label)}</a></li>`).join('')}</ul></div></div>`;

const productCard = p => `
          <a class="product-card" href="${productUrl(p)}">
            <div class="product-img${p.imageFit === 'photo' ? ' is-photo' : ''}"${p.imageBg ? ` style="background:${p.imageBg}"` : ''}><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>
            <h3>${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}${esc(p.name)}</h3>
          </a>`;

// Structured detail (specs table, feature rows, highlight cards) for products without a detail board image.
function productDetail(p) {
  // Order: Features, highlight blocks, then Key Specifications last; backgrounds alternate gray/white.
  const blocks = [];
  if (p.features) blocks.push(['features', 'Features', `
        <h2>Features</h2>
        ${p.intro ? `<p class="lead-dark intro">${esc(p.intro)}</p>` : ''}${p.features.map((f, i) => `
        <div class="feature-row${i % 2 ? ' is-reverse' : ''}">
          <div class="feature-media"><img src="${f.image}" alt="${esc(f.title)}" loading="lazy"></div>
          <div class="feature-copy">${f.label ? `<p class="eyebrow">${esc(f.label)}</p>` : ''}<h3>${esc(f.title)}</h3>${f.text ? `<p>${esc(f.text)}</p>` : ''}</div>
        </div>`).join('')}`]);
  (p.highlights || []).forEach((h, i) => blocks.push([`hl-${i}`, h.title.split(' – ')[0], `
        <h2>${esc(h.title)}</h2>
        ${h.lead ? `<p class="lead-dark intro">${esc(h.lead)}</p>` : ''}
        <div class="grid-${h.items.length > 3 ? 3 : h.items.length} feature-list">${h.items.map(([t, d], k) => `
          <div class="feature"><span class="num">${String(k + 1).padStart(2, '0')}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}
        </div>`]));
  if (p.specs) blocks.push(['specs', 'Key Specifications', `
        <h2>Key Specifications</h2>
        ${p.intro && !p.features ? `<p class="lead-dark intro">${esc(p.intro)}</p>` : ''}
        <table class="spec-table">${p.specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`]);
  return tabs(blocks.map(([id, label]) => [id, label])) + blocks.map(([id, , html], i) => `
    <section class="section${i % 2 ? '' : ' section-gray'}" id="${id}">
      <div class="wrap">${html}
      </div>
    </section>`).join('');
}

// ---------- pages ----------
const pages = {};

pages['index.html'] = layout({
  transparentHeader: true,
  body: `
    <section class="home-hero">
      <div class="wrap">
        <h1>Where Medical Devices<br>Meet the World</h1>
        <p class="lead">Connecting certified medical technologies to global <br class="pc">markets with precision and trust.</p>
        <div class="btns"><a class="btn btn-light" href="/medivis/about/">About MEDIVIS</a><a class="btn btn-line" href="/medivis/product/xray/">View Products</a></div>
      </div>
    </section>
    <section class="section">
      <div class="wrap split">
        <div>
          <p class="eyebrow">MEDIVIS Inc.</p>
          <h2>Where Medical Devices Meet the World</h2>
        </div>
        <div>
          <p class="lead-dark">MEDIVIS connects today’s medical innovations to global markets—and builds tomorrow’s solutions from within.</p>
          <a class="text-link" href="/medivis/about/">More View</a>
        </div>
      </div>
    </section>
    <section class="section section-gray">
      <div class="wrap">
        <p class="eyebrow">Why partner with us</p>
        <h2>A trusted partner for global medical device collaboration</h2>
        <div class="grid-3 feature-list">
          <div class="feature"><span class="num">01</span><h3>Global Connectivity</h3><p>Connecting manufacturers with qualified regional partners worldwide.</p></div>
          <div class="feature"><span class="num">02</span><h3>Compliance-Driven Operations</h3><p>Built on international standards, transparency, and responsible practices.</p></div>
          <div class="feature"><span class="num">03</span><h3>Sustainable Growth</h3><p>Supporting long-term collaboration through aligned execution and trust.</p></div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <p class="eyebrow">Our Product</p>
        <h2>Products</h2>
        <div class="grid-4 line-cards">${data.lines.flatMap(l => l.categories.map(c => {
          const first = data.products.find(p => p.line === l.key && p.category === c.key);
          return first ? `
          <a class="line-card" href="/medivis/product/${l.key}/#cat-${c.key}">
            <div class="product-img${first.imageFit === 'photo' ? ' is-photo' : ''}"${first.imageBg ? ` style="background:${first.imageBg}"` : ''}><img src="${first.image}" alt="${esc(c.name)}" loading="lazy"></div>
            <h3>${esc(c.name)}</h3>
          </a>` : ''; })).join('')}
        </div>
      </div>
    </section>
    <section class="cta-band">
      <div class="wrap">
        <h2>Please join us with MEDIVIS</h2>
        <p>A trusted partner for global medical device collaboration.</p>
        <a class="btn btn-light" href="/medivis/inquiry/">Contact Us</a>
      </div>
    </section>`,
});

pages['medivis/about/index.html'] = layout({
  title: 'Company Overview', section: 'About Us',
  body: hero({ eyebrow: 'About Us', title: 'Company Overview',
    text: 'MEDIVIS is a global healthcare solutions company that connects medical device manufacturers with international markets through insight-driven coordination and compliance-focused execution.' })
  + tabs([['overview', 'Overview'], ['model', 'How We Connect']]) + `
    <section class="section" id="overview">
      <div class="wrap split">
        <div><p class="eyebrow">MEDIVIS Inc.</p><h2>Where Medical Devices Meet the World</h2></div>
        <div><img class="rounded" src="/common/medivis/img/about/about_img.png" alt="" loading="lazy"></div>
      </div>
    </section>
    <section class="section section-gray" id="model">
      <div class="wrap">
        <h2>How We Connect</h2>
        <div class="grid-3">
          <div class="step-card"><img src="/common/medivis/img/about/card1.png" alt="" loading="lazy"><span class="num">01</span><h3>Medical Device Manufacturers</h3>
            <p>MEDIVIS works with certified medical device manufacturers to support global expansion by aligning product innovation, quality standards, and regulatory requirements.</p>
            <ul class="tags"><li>Product Innovation</li><li>Quality &amp; Compliance</li><li>Regulatory Approval</li></ul></div>
          <div class="step-card is-hub"><img src="/common/medivis/img/about/card2.png" alt="" loading="lazy"><span class="num">02</span><h3>MEDIVIS Inc.</h3>
            <p>As a strategic global hub, MEDIVIS bridges manufacturers and global markets by integrating market insight, operational coordination, and compliance-driven execution.</p>
            <ul class="tags"><li>Market Insight</li><li>Coordination</li><li>Compliance</li></ul></div>
          <div class="step-card"><img src="/common/medivis/img/about/card3.png" alt="" loading="lazy"><span class="num">03</span><h3>Global Markets</h3>
            <p>Through trusted regional partners, MEDIVIS enables localized execution while maintaining global standards across diverse international healthcare markets.</p>
            <ul class="tags"><li>Regional Distribution</li><li>Sales &amp; Support</li><li>Local Execution</li></ul></div>
        </div>
      </div>
    </section>`,
});

pages['medivis/marketing/index.html'] = layout({
  title: 'Target Markets', section: 'About Us',
  body: hero({ eyebrow: 'About Us', title: 'Target Markets',
    text: 'We work closely with local partners to ensure localized execution while maintaining global standards of quality and compliance.' }) + `
    <section class="section">
      <div class="wrap">
        <div class="grid-4 region-cards">${['Middle East', 'CIS', 'Africa', 'Asia'].map((r, i) => `
          <div class="region-card"><img src="/common/medivis/img/marketing/marketing0${i + 1}.png" alt="${r}" loading="lazy"><h3>${r}</h3></div>`).join('')}
        </div>
      </div>
    </section>`,
});

pages['medivis/mission/index.html'] = layout({
  title: 'Mission & Values', section: 'About Us',
  body: hero({ eyebrow: 'About Us', title: 'Mission & Values' })
  + tabs([['mission', 'Our Mission'], ['values', 'Our Core Values']]) + `
    <section class="section" id="mission">
      <div class="wrap split">
        <div><p class="eyebrow">Our Mission</p><h2>To connect medical innovation with global opportunity—creating value through collaboration, trust, and compliance.</h2></div>
        <div><img class="rounded" src="/common/medivis/img/mission/mission_01.png" alt="" loading="lazy"></div>
      </div>
    </section>
    <section class="section section-gray" id="values">
      <div class="wrap">
        <h2>Our Core Values</h2>
        <div class="grid-2 feature-list">
          <div class="feature"><span class="num">01</span><h3>Partnership &amp; Collaboration</h3><p>We work as an extension of our partners’ teams, aligning goals to create shared and sustainable success.</p></div>
          <div class="feature"><span class="num">02</span><h3>Customer-Centric Approach</h3><p>We design solutions around customer needs, market realities, and measurable outcomes.</p></div>
          <div class="feature"><span class="num">03</span><h3>Trust &amp; Long-Term Relationships</h3><p>We build relationships based on transparency, reliability, and long-term commitment.</p></div>
          <div class="feature"><span class="num">04</span><h3>Compliance &amp; Responsibility</h3><p>We operate with strict adherence to international standards and regulatory requirements.</p></div>
        </div>
      </div>
    </section>`,
});

pages['medivis/today/index.html'] = layout({
  title: 'Our Role Today', section: 'Business',
  body: hero({ eyebrow: 'Business', title: 'Our Role Today',
    text: 'MEDIVIS operates as a strategic global connector within the medical device ecosystem.' }) + `
    <section class="section">
      <div class="wrap">
        <div class="grid-4 feature-list">
          <div class="feature"><span class="num">01</span><h3>Cross-Border Communication</h3><p>Managing communication with manufacturers and customers.</p></div>
          <div class="feature"><span class="num">02</span><h3>Partner Identification</h3><p>Identifying, evaluating, and contracting regional distributors.</p></div>
          <div class="feature"><span class="num">03</span><h3>Sales &amp; Logistics Management</h3><p>Supporting day-to-day sales and marketing activities.</p></div>
          <div class="feature"><span class="num">04</span><h3>Local Market Entry</h3><p>Coordinating market entry strategies with local partners.</p></div>
        </div>
      </div>
    </section>
    <section class="section section-gray">
      <div class="wrap split">
        <div><img class="rounded" src="/common/medivis/img/today/today_img1.png" alt="" loading="lazy"></div>
        <div><p class="lead-dark">This model allows manufacturers to focus on product development and quality, while regional partners deliver localized sales and customer support.</p></div>
      </div>
    </section>`,
});

pages['medivis/partners/index.html'] = layout({
  title: 'Partners', section: 'Business',
  body: hero({ eyebrow: 'Business', title: 'Partners',
    text: 'MEDIVIS currently collaborates with established medical device manufacturers to support global market access and sustainable distribution models.' }) + `
    <section class="section">
      <div class="wrap grid-2">
        <div class="partner-card">
          <div class="product-img"><img src="/common/medivis/img/partners/partners_img1.png" alt="" loading="lazy"></div>
          <img class="partner-logo" src="/common/medivis/img/partners/h_logo_1.png" alt="DK Medical Systems" loading="lazy">
          <p>Specializing in advanced X-ray imaging systems with proven expertise in diagnostic technology.</p>
          <a class="text-link" href="/medivis/product/xray/">X-Ray Products</a>
        </div>
        <div class="partner-card">
          <div class="product-img"><img src="/common/medivis/img/partners/partners_img2.png" alt="" loading="lazy"></div>
          <img class="partner-logo" src="/common/medivis/img/partners/h_logo_2.png" alt="SOLENDOS" loading="lazy">
          <p>Focused on innovative endoscopy systems designed for minimally invasive medical procedures.</p>
        </div>
      </div>
    </section>`,
});

for (const line of data.lines) {
  const cats = line.categories.filter(c => data.products.some(p => p.line === line.key && p.category === c.key));
  const other = data.lines.find(l => l !== line);
  pages[`medivis/product/${line.key}/index.html`] = layout({
    title: line.name, section: 'Products', description: line.intro,
    // One grid of the line's products; the tabs filter it (and #cat-Digital preselects a tab).
    body: hero({ eyebrow: 'Products', title: line.name, text: esc(line.intro) }) + `
    <div class="section-tabs filter-tabs"><div class="wrap"><ul>
${cats.map((c, i) => `
      <li><a href="#cat-${c.key}" data-filter="${c.key}"${i ? '' : ' class="is-active"'}>${esc(c.name)}</a></li>`).join('')}
    </ul></div></div>
    <section class="section">
      <div class="wrap">
        <div class="grid-3 product-grid">${data.products.filter(p => p.line === line.key)
          .map(p => productCard(p).replace('class="product-card"', `class="product-card" data-cat="${p.category}"${p.category === cats[0].key ? '' : ' hidden'}`)).join('')}
        </div>
      </div>
    </section>` + (other ? `
    <section class="cta-band cta-slim">
      <div class="wrap"><h2>${esc(other.name)}</h2><p>${esc(other.intro)}</p><a class="btn btn-light" href="/medivis/product/${other.key}/">View ${esc(other.name)}</a></div>
    </section>` : ''),
  });
  // Old per-category URLs (/medivis/product/xray/Digital) jump to the matching section.
  for (const c of line.categories)
    pages[`medivis/product/${line.key}/${c.key}/index.html`] = redirect(`/medivis/product/${line.key}/#cat-${c.key}`);
}

for (const p of data.products) {
  const line = lineOf(p.line);
  pages[`medivis/product/view/${p.id}/${p.category}/index.html`] = layout({
    title: p.name, section: 'Products', description: `${p.name} – ${catName(p.line, p.category)} | MEDIVIS ${line.name}`,
    body: `
    <section class="product-top">
      <div class="wrap split">
        <div>
          <p class="crumbs"><a href="/medivis/product/${line.key}/">${esc(line.name)}</a> / <a href="/medivis/product/${line.key}/#cat-${p.category}">${esc(catName(p.line, p.category))}</a></p>
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
          <h1>${esc(p.name)}</h1>
          <p class="lead-dark">${esc(p.tagline || catName(p.line, p.category))}</p>
          ${p.target ? `<p class="target">${esc(p.target)}</p>` : ''}
          <div class="btns"><a class="btn" href="/medivis/inquiry/">Product Inquiry</a><a class="btn btn-ghost" href="/medivis/product/${line.key}/">Back to List</a></div>
        </div>
        <div class="product-img product-img-lg${p.imageFit === 'photo' && !p.heroImage ? ' is-photo' : ''}"${p.imageBg && !p.heroImage ? ` style="background:${p.imageBg}"` : ''}><img src="${p.heroImage || p.image}" alt="${esc(p.name)}"></div>
      </div>
    </section>` + (p.detail ? `
    <section class="section">
      <div class="wrap detail-board"><img src="${p.detail}" alt="${esc(p.name)} details" loading="lazy"></div>
    </section>` : productDetail(p)),
  });
}

pages['medivis/inquiry/index.html'] = layout({
  title: 'Inquiry', section: 'Contact Us',
  body: hero({ eyebrow: 'Contact Us', title: 'Inquiry', text: 'Tell us about your company and how we can work together.' }) + `
    <section class="section">
      <div class="wrap narrow">
        <form id="inquiry" class="form" novalidate>
          <div class="form-grid">
            <label>Company Name<span>*</span><input name="company_name" required placeholder="Please enter your company name"></label>
            <label>Country<span>*</span><input name="country" required placeholder="Please enter your country"></label>
            <fieldset class="full"><legend>Business Type<span>*</span></legend>
              <div class="choices">${['Manufacturer', 'OEM/ODM', 'Trading Company', 'Other'].map(v =>
                `<label class="choice"><input type="radio" name="business" value="${v}" required> ${v}</label>`).join('')}</div>
              <input name="business_text" class="business-other" placeholder="Other" hidden>
            </fieldset>
            <label>Full Name<span>*</span><input name="full_name" required placeholder="Please enter your full name"></label>
            <label>Job Title<span>*</span><input name="job_title" required placeholder="Please enter your job title"></label>
            <label>Email Address<span>*</span><input name="email_address" type="email" required placeholder="Please enter your email address"></label>
            <label>Contact Number<span>*</span><input name="contact_number" required placeholder="Please enter your contact number"></label>
            <label class="full">Message<span>*</span><textarea name="message" rows="6" required placeholder="Please enter your message"></textarea></label>
          </div>
          <label class="agree"><input type="checkbox" name="agree_check" required> I agree to the collection and use of my personal data in accordance with the <a href="/medivis/policy/privacy/" target="_blank">Privacy Policy</a> for the purpose of business inquiry and communication.</label>
          <button class="btn" type="submit">Submit Inquiry</button>
          <p class="form-msg" role="status"></p>
        </form>
      </div>
    </section>`,
  extraScript: `
  <script>initInquiry("https://formsubmit.co/ajax/${INQUIRY_TO}", "${INQUIRY_TO}");</script>`,
});

pages['medivis/location/index.html'] = layout({
  title: 'Office Locations', section: 'Contact Us',
  body: hero({ eyebrow: 'Contact Us', title: 'Office Locations' }) + `
    <section class="section">
      <div class="wrap split location">
        <div>
          <h2>MEDIVIS Inc.</h2>
          <p class="lead-dark">Bldg. B, Suite 908, 19 Cheongcho-ro, Deogyang-gu, Goyang-si, Gyeonggi-do, 10542, Republic of Korea</p>
          <p>(IS Biz Tower Central Phase 2)</p>
          <p>E-mail : <a href="mailto:info@medivis.co.kr">info@medivis.co.kr</a></p>
        </div>
        <div class="map"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3161.898983518012!2d126.85580697629729!3d37.58099632329819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9b9364a62b99%3A0xaeb43aa1b2a59c93!2sIS%20Biz%20Tower%20Central%202!5e0!3m2!1sen!2skr!4v1770282174069!5m2!1sen!2skr" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="MEDIVIS office map"></iframe></div>
      </div>
    </section>`,
});

for (const [key, title, sub] of [['privacy', 'Privacy Policy', '(GDPR Compliant)'], ['termsuse', 'Terms of Use', '']]) {
  pages[`medivis/policy/${key}/index.html`] = layout({
    title,
    body: hero({ title, text: sub }) + `
    <section class="section">
      <div class="wrap narrow prose">
${fs.readFileSync(path.join(ROOT, `src/content/${key}.html`), 'utf8')}
      </div>
    </section>`,
  });
}

function redirect(to) {
  return `<!doctype html><meta charset="utf-8"><title>MEDIVIS</title><link rel="canonical" href="${to}">` +
    `<meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">MEDIVIS</a>\n`;
}
pages['404.html'] = layout({
  title: 'Page Not Found',
  body: hero({ title: 'Page Not Found', text: 'The page you are looking for does not exist.' }) +
    `\n    <section class="section"><div class="wrap"><a class="btn" href="/">Go to Home</a></div></section>`,
});

// Removed 11/6: AccuRay D5/D6 (89) and the Endoscopy line (92, 94, 95). Old links land on the X-Ray list.
for (const rel of ['medivis/product/endoscopy', 'medivis/product/view/89', 'medivis/product/view/92',
                   'medivis/product/view/94', 'medivis/product/view/95'])
  fs.rmSync(path.join(DOCS, rel), { recursive: true, force: true });
for (const rel of ['medivis/product/endoscopy', ...['Imaging', 'Light', 'GAS', 'Integrated', 'Target'].map(c => `medivis/product/endoscopy/${c}`),
                   'medivis/product/view/89/Analog', 'medivis/product/view/92/Integrated',
                   'medivis/product/view/94/Imaging', 'medivis/product/view/95/Light'])
  pages[`${rel}/index.html`] = redirect('/medivis/product/xray/');

// Category folders the first mirror created under the wrong product line.
for (const c of ['GAS', 'Imaging', 'Integrated', 'Light', 'Target'])
  fs.rmSync(path.join(DOCS, 'medivis/product/xray', c), { recursive: true, force: true });

for (const [rel, html] of Object.entries(pages)) {
  const f = path.join(DOCS, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}
console.log(`built ${Object.keys(pages).length} pages (v=${VER})`);
