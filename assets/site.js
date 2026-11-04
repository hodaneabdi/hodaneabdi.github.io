(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- nav: transparent over dark heroes, frosted once scrolled ----
  var nav = document.querySelector('.nav');
  var heroEl = document.querySelector('.hero, .cs-hero');
  function navState() {
    if (!nav) return;
    var limit = heroEl ? heroEl.offsetHeight - 70 : 10;
    nav.classList.toggle('solid', window.scrollY > limit);
  }
  navState(); window.addEventListener('scroll', navState, { passive: true });

  // ---- split headline into words for the staggered blur-in ----
  document.querySelectorAll('.split').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  });

  // ---- reveal on scroll, with stagger inside [data-stagger] ----
  document.querySelectorAll('[data-stagger]').forEach(function (g) {
    Array.prototype.forEach.call(g.querySelectorAll(':scope > .reveal'), function (c, i) { c.style.setProperty('--delay', (i * 90) + 'ms'); });
  });
  var els = document.querySelectorAll('.reveal, .viz');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // ---- step cards scale up as they enter the viewport ----
  var steps = document.querySelectorAll('.step');
  function scaleSteps() {
    var vh = window.innerHeight;
    steps.forEach(function (s) {
      var r = s.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      s.style.transform = 'scale(' + (0.9 + 0.1 * p).toFixed(4) + ')';
    });
  }
  if (steps.length && !reduce) { scaleSteps(); window.addEventListener('scroll', function () { requestAnimationFrame(scaleSteps); }, { passive: true }); }

  // ---- count-up numbers ----
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var target = +el.getAttribute('data-count'), text = el.textContent, done = false;
    var ob = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting || done) return; done = true; ob.disconnect();
      var t0 = null;
      (function step(ts) {
        if (!t0) t0 = ts; var p = Math.min((ts - t0) / 1100, 1), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = text.replace(String(target), String(v));
        if (p < 1) requestAnimationFrame(step); else el.textContent = text;
      })(performance.now());
    }, { threshold: 0.6 });
    ob.observe(el);
  });

  // ---- carousel: drag, arrows, dots ----
  document.querySelectorAll('.rail-wrap').forEach(function (w) {
    var rail = w.querySelector('.rail'), cards = rail.querySelectorAll('.case'), dots = w.querySelector('.dots');
    if (!rail) return;
    cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    var di = dots.querySelectorAll('i');
    function upd() {
      var best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - rail.scrollLeft - 24); if (d < bd) { bd = d; best = i; } });
      di.forEach(function (d, i) { d.classList.toggle('on', i === best); });
    }
    rail.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true }); upd();
    var step = function (dir) { var c = cards[0]; rail.scrollBy({ left: dir * (c.offsetWidth + 16), behavior: 'smooth' }); };
    w.querySelector('.prev').addEventListener('click', function () { step(-1); });
    w.querySelector('.next-btn').addEventListener('click', function () { step(1); });
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; rail.classList.remove('drag'); });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  });

  // ---- toolkit: view more ----
  var more = document.getElementById('toolsMore');
  if (more) more.addEventListener('click', function () {
    var t = document.querySelector('.tools'); var open = t.classList.toggle('open');
    more.textContent = open ? 'View less' : 'View more'; more.setAttribute('aria-expanded', open);
  });

  // ---- tooltips for any [data-tip] element (mouse, touch and keyboard) ----
  var tip = document.getElementById('tip');
  function show(el, x, y) { tip.textContent = el.getAttribute('data-tip'); tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on'); }
  function hide() { if (tip) tip.classList.remove('on'); }
  if (tip) document.querySelectorAll('[data-tip]').forEach(function (el) {
    el.setAttribute('tabindex', '0');
    el.addEventListener('mousemove', function (e) { show(el, e.clientX, e.clientY); });
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', function () { var r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); });
    el.addEventListener('blur', hide);
    el.addEventListener('touchstart', function () { var r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); }, { passive: true });
  });
  window.addEventListener('scroll', hide, { passive: true });

  // ---- Home Credit: review slider ----
  var k = document.getElementById('hcK');
  if (k && window.HC) {
    var H = window.HC, sum = H.r.reduce(function (a, b) { return a + b; }, 0);
    var bars = document.querySelectorAll('.dec');
    var upd = function () {
      var n = +k.value, caught, good;
      if (H.exact[n]) { caught = H.exact[n][0]; good = H.exact[n][1]; }
      else { var s = 0; for (var i = 10 - n; i < 10; i++) s += H.r[i]; caught = Math.round(s / sum * H.total); good = Math.round(n * H.per) - caught; }
      document.getElementById('hcPct').textContent = n * 10 + '%';
      document.getElementById('hcCaught').textContent = Math.round(caught / H.total * 100) + '%';
      document.getElementById('hcGood').textContent = (good / caught).toFixed(1);
      bars.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-i') >= 10 - n); });
      k.setAttribute('aria-valuetext', n * 10 + '% reviewed, ' + Math.round(caught / H.total * 100) + '% of defaults caught');
    };
    k.addEventListener('input', upd); upd();
  }

  // ---- Fleet: repair-fee slider ----
  var f = document.getElementById('flFee');
  if (f && window.FL) {
    var trucks = document.querySelectorAll('.truck');
    var fu = function () {
      var row = window.FL[+f.value], n = row[1], g = row[3];
      document.getElementById('flN').textContent = n;
      document.getElementById('flG').textContent = '+$' + Math.round(g).toLocaleString('en-US');
      trucks.forEach(function (t) { t.classList.toggle('on', +t.getAttribute('data-n') < n); });
      f.setAttribute('aria-valuetext', '$' + row[0].toLocaleString('en-US') + ' per truck: ' + n + ' trucks repaired, weekly gain $' + Math.round(g).toLocaleString('en-US'));
    };
    f.addEventListener('input', fu); fu();
  }
})();

