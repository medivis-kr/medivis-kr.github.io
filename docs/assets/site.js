// Header state, mobile menu, section-tab scroll spy, inquiry form.
(function () {
  var header = document.querySelector('.site-header');
  var transparent = header.classList.contains('is-transparent');

  function onScroll() {
    if (transparent) header.classList.toggle('is-transparent', window.scrollY < 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var btn = document.querySelector('.menu-btn');
  btn.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded', open);
  });

  // Product list: tabs filter the grid instead of scrolling.
  var filters = [].slice.call(document.querySelectorAll('.filter-tabs a'));
  function applyFilter(key) {
    filters.forEach(function (a) { a.classList.toggle('is-active', a.dataset.filter === key); });
    [].forEach.call(document.querySelectorAll('.product-grid .product-card'), function (c) {
      c.hidden = c.dataset.cat !== key;
    });
  }
  filters.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      applyFilter(a.dataset.filter);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  });
  var pre = location.hash.match(/^#cat-(\w+)/);
  if (filters.length && pre && filters.some(function (a) { return a.dataset.filter === pre[1]; })) applyFilter(pre[1]);

  // Highlight the tab whose section is in view.
  var tabs = [].slice.call(document.querySelectorAll('.section-tabs:not(.filter-tabs) a'));
  if (tabs.length && 'IntersectionObserver' in window) {
    var byId = {};
    tabs.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tabs.forEach(function (a) { a.classList.remove('is-active'); });
        byId[e.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }
})();

// Inquiry form → FormSubmit (no server of our own on GitHub Pages).
function initInquiry(endpoint, fallbackEmail) {
  var form = document.getElementById('inquiry');
  var msg = form.querySelector('.form-msg');
  var other = form.querySelector('.business-other');
  var submit = form.querySelector('button[type=submit]');

  form.addEventListener('change', function (e) {
    if (e.target.name !== 'business') return;
    other.hidden = e.target.value !== 'Other';
    other.required = !other.hidden;
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = '';
    var bad = [].slice.call(form.querySelectorAll('input, textarea')).filter(function (el) {
      el.classList.remove('is-invalid');
      return !el.checkValidity();
    });
    bad.forEach(function (el) { if (el.type !== 'radio' && el.type !== 'checkbox') el.classList.add('is-invalid'); });
    if (bad.length) {
      msg.className = 'form-msg err';
      msg.textContent = form.agree_check.checked || bad.some(function (el) { return el.name !== 'agree_check'; })
        ? 'Please fill in all the required fields.' : 'Please check I agree to the Privacy Policy.';
      bad[0].focus();
      return;
    }

    var data = { _subject: '[MEDIVIS Website] New inquiry', _template: 'table', _captcha: 'false' };
    new FormData(form).forEach(function (v, k) { if (k !== 'business_text' || v) data[k] = v; });
    submit.disabled = true; submit.textContent = 'Sending...';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); }).then(function (r) {
      if (String(r.success) !== 'true') throw new Error(r.message || 'send failed');
      form.reset(); other.hidden = true;
      msg.className = 'form-msg ok'; msg.textContent = 'Your inquiry has been sent. Thank you.';
    }).catch(function () {
      msg.className = 'form-msg err';
      msg.textContent = 'Sorry, the inquiry could not be sent. Please email us at ' + fallbackEmail + '.';
    }).then(function () { submit.disabled = false; submit.textContent = 'Submit Inquiry'; });
  });
}
