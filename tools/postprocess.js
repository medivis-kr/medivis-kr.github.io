// Turn the raw mirror in ../docs into a GitHub Pages-ready static site.
// Run after tools/mirror.js:  node tools/postprocess.js
const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..', 'docs');
const INQUIRY_TO = 'info@medivis.co.kr';   // FormSubmit target; replace with the alias FormSubmit mails after activation

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

// Junk captured from the productView(seq, C_P_TYPE2) function definition.
fs.rmSync(path.join(SITE, 'medivis', 'product', 'view', 'seq'), { recursive: true, force: true });

for (const f of walk(SITE).filter(f => f.endsWith('.html'))) {
  let h = fs.readFileSync(f, 'utf8');
  // Server-side CSRF tokens mean nothing on a static host.
  h = h.replace(/\s*<input type="hidden" id="csrf_token"[^>]*>/g, '');
  if (f.endsWith(path.join('inquiry', 'index.html'))) {
    h = h.replace('action="/medivis/inquiry/inquiry_process" method="post"', 'method="post"');
    h = h.replace('$("#form").submit();', `sendInquiry(this);`);
    h = h.replace('</script>\n\n\t<footer>', `
	function sendInquiry(btn) {
		// Required-field check (the original loop's "return false" only left the loop).
		var missing = $("input[type=text]").filter(function () {
			return !$(this).hasClass("business_text") || $("input[name=business]:checked").val() == "Other";
		}).filter(function () { return $.trim($(this).val()) == ""; });
		if (missing.length) { missing.first().focus(); return; }
		if (!$("input[name=business]:checked").length) { alert("Please select your business type."); return; }

		var data = { _subject: "[MEDIVIS Website] New inquiry", _template: "table", _captcha: "false" };
		$("#form").serializeArray().forEach(function (f) { data[f.name] = f.value; });
		$(btn).prop("disabled", true).val("Sending...");
		fetch("https://formsubmit.co/ajax/${INQUIRY_TO}", {
			method: "POST",
			headers: { "Content-Type": "application/json", "Accept": "application/json" },
			body: JSON.stringify(data)
		}).then(function (r) { return r.json(); }).then(function (r) {
			if (String(r.success) !== "true") throw new Error(r.message || "send failed");
			alert("Your inquiry has been sent. Thank you.");
			$("#form")[0].reset(); $(".business_text").hide();
		}).catch(function () {
			alert("Sorry, the inquiry could not be sent. Please email us at ${INQUIRY_TO}.");
		}).then(function () { $(btn).prop("disabled", false).val("Submit Inquiry"); });
	}
</script>

	<footer>`);
    if (!h.includes('function sendInquiry')) throw new Error('inquiry page layout changed; patch not applied');
  }
  fs.writeFileSync(f, h);
}

// GitHub Pages extras.
// No CNAME here: the custom domain is set in Settings → Pages once DNS is switched (GitHub commits CNAME itself),
// so the site can be checked at https://medivis-kr.github.io first.
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
fs.writeFileSync(path.join(SITE, '404.html'),
  '<!doctype html><meta charset="utf-8"><title>MEDIVIS</title><meta http-equiv="refresh" content="0; url=/">' +
  '<p><a href="/">MEDIVIS</a></p>\n');
console.log('postprocess done');
