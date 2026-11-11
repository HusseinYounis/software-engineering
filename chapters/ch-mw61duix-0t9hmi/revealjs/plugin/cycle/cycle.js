/*!
 * reveal.js-cycle (vendored, theme-aware)
 * Closed cycles and feedback loops for reveal.js.
 * @author  Florian Loyns (original), themed for slide-builder
 * @license MIT
 *
 * Modified to use CSS custom properties (--cycle-accent, --cycle-active, etc.)
 * with fallbacks to the original defaults, so the cycle inherits theme colors.
 */

(function () {
  var DOT = 27;
  var GAP = 12;

  function injectCSS(o) {
    if (document.getElementById('cycle-css')) return;
    var off = DOT / 2 + GAP;
    var css =
      ".reveal .cycle{display:flex;flex:1;min-height:0;width:100%;align-items:center;justify-content:center}"
    + ".reveal .cyc-stage{position:relative;margin:auto;overflow:visible;height:100%;aspect-ratio:1/1}"
    + ".reveal .cyc-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}"
    + ".reveal .cyc-svg path{stroke:var(--cycle-flow," + o.flow + ")}"
    + ".reveal .cyc-svg marker path{fill:var(--cycle-flow," + o.flow + ")}"

    + ".reveal .cyc-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);"
      + "text-align:center;pointer-events:none;max-width:34%}"
    + ".reveal .cyc-hub .kick{display:block;font-size:12px;font-weight:800;letter-spacing:.14em;"
      + "text-transform:uppercase;color:var(--cycle-muted," + o.muted + ");margin-bottom:2px}"
    + ".reveal .cyc-hub .lab{display:block;font-size:26px;font-weight:800;line-height:1.08;"
      + "color:var(--cycle-deep," + o.deep + ");overflow-wrap:break-word;hyphens:auto}"
    + ".reveal .cyc-hub .sub{display:block;font-size:13.5px;"
      + "color:var(--cycle-muted," + o.muted + ");margin-top:6px;line-height:1.25}"

    + ".reveal .cyc-dot{position:absolute;transform:translate(-50%,-50%);width:" + DOT + "px;height:" + DOT + "px;"
      + "border-radius:50%;background:var(--cycle-accent," + o.accent + ");"
      + "box-shadow:0 0 0 4px var(--cycle-dot-ring,#fff),0 1px 6px rgba(0,0,0,.30);"
      + "display:flex;align-items:center;justify-content:center;color:#fff;font-size:" + Math.round(DOT * .56) + "px;"
      + "font-weight:800;line-height:1;z-index:3;transition:transform .18s ease,background .18s ease,opacity .22s}"

    + ".reveal .cyc-tx{position:absolute;z-index:2;transition:opacity .22s ease}"
    + ".reveal .cyc-tx .t{display:block;font-size:18px;font-weight:800;line-height:1.16;"
      + "color:var(--cycle-text,#0B1818)}"
    + ".reveal .cyc-tx .d{display:block;font-size:14px;font-weight:400;line-height:1.22;"
      + "color:var(--cycle-muted," + o.muted + ");margin-top:3px}"
    + ".reveal .cyc-tx[data-side=r]{transform:translate(" + off + "px,-50%);text-align:left}"
    + ".reveal .cyc-tx[data-side=l]{transform:translate(calc(-100% - " + off + "px),-50%);text-align:right}"
    + ".reveal .cyc-tx[data-side=u]{transform:translate(-50%,calc(-100% - " + off + "px));text-align:center}"
    + ".reveal .cyc-tx[data-side=d]{transform:translate(-50%," + off + "px);text-align:center}"

    + ".reveal .cyc-dot.now{background:var(--cycle-active," + o.active + ");transform:translate(-50%,-50%) scale(1.18)}"
    + ".reveal .cyc-dot.dim{opacity:.3}"
    + ".reveal .cyc-tx.dim{opacity:.34}"
    + ".reveal .cyc-dot.off,.reveal .cyc-tx.off{opacity:0}"

    + ".reveal .cyc-loop{position:absolute;left:50%;bottom:0;transform:translate(-50%,140%);"
      + "font-size:14.5px;font-style:italic;color:var(--cycle-muted," + o.muted + ");white-space:nowrap;text-align:center}"

    + ".reveal .cyc-f{position:absolute;width:0;height:0;overflow:hidden;opacity:0 !important;visibility:hidden !important}"
    + "@media print{.reveal .cyc-dot,.reveal .cyc-tx{opacity:1 !important}"
      + ".reveal .cyc-svg path{opacity:1 !important}"
      + ".reveal .cyc-dot.now{transform:translate(-50%,-50%) !important;"
      + "background:var(--cycle-accent," + o.accent + ") !important}}"
    + "@media (prefers-reduced-motion:reduce){.reveal .cyc-dot,.reveal .cyc-tx{transition:none}}";
    var s = document.createElement('style');
    s.id = 'cycle-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function txt(el) { return el ? el.innerHTML : ''; }

  function parse(step) {
    var t = step.querySelector('.t, h3, h4, h5');
    var d = step.querySelector('.d');
    var title = step.getAttribute('data-title') || txt(t);
    var desc;
    if (d) desc = txt(d);
    else {
      var rest = step.cloneNode(true);
      [].forEach.call(rest.querySelectorAll('.t, h3, h4, h5'), function (x) { x.parentNode.removeChild(x); });
      desc = rest.innerHTML.trim();
    }
    return { title: title, desc: desc };
  }

  var Plugin = {
    id: 'cycle',

    init: function (deck) {
      var d = document;
      var c = (deck.getConfig && deck.getConfig().cycle) || {};
      var o = {
        accent: c.accent || '#2C4A6E',
        active: c.active || '#203A58',
        deep: c.deep || '#1E3452',
        muted: c.muted || '#6B7B7B',
        line: c.line || '#C7D2E0',
        flow: c.flow || '#AEBECF'
      };
      injectCSS(o);
      var all = [];
      var NS = 'http://www.w3.org/2000/svg';

      function svgEl(tag, attrs) {
        var e = d.createElementNS(NS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
      }

      function side(deg) {
        var c2 = Math.cos(deg * Math.PI / 180), s2 = Math.sin(deg * Math.PI / 180);
        if (c2 > 0.34) return 'r';
        if (c2 < -0.34) return 'l';
        return s2 < 0 ? 'u' : 'd';
      }

      function build(host) {
        if (host.getAttribute('data-cyc-init') || host.querySelector('.cyc-stage')) return;
        host.setAttribute('data-cyc-init', '1');

        var steps = [].map.call(host.querySelectorAll(':scope > .step'), parse);
        if (steps.length < 3) return;
        var n = steps.length;
        var mode = host.getAttribute('data-mode') || 'focus';
        var startAttr = host.getAttribute('data-start');
        var start = (startAttr && !isNaN(parseFloat(startAttr))) ? parseFloat(startAttr) : -90;

        [].forEach.call(host.querySelectorAll(':scope > .step'), function (el) { el.style.display = 'none'; });

        var stage = d.createElement('div');
        stage.className = 'cyc-stage';
        host.appendChild(stage);

        var Rdot = n <= 4 ? 30 : (n <= 6 ? 33 : 35);
        var txtMax = n <= 4 ? 30 : 25;

        var svg = svgEl('svg', { 'class': 'cyc-svg', viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid meet' });
        var defs = svgEl('defs', {});
        var mkId = 'cyc-ah-' + all.length;
        var mk = svgEl('marker', { id: mkId, markerWidth: '9', markerHeight: '9', refX: '5.4', refY: '3', orient: 'auto' });
        mk.appendChild(svgEl('path', { d: 'M0 0 L6.4 3 L0 6 z', fill: o.flow }));
        defs.appendChild(mk);
        svg.appendChild(defs);
        stage.appendChild(svg);

        function pt(deg, r) {
          var a = deg * Math.PI / 180;
          return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
        }

        var seg = 360 / n;
        var gapDeg = Math.min(seg * 0.32, 15);
        var arcs = [];
        for (var i = 0; i < n; i++) {
          var a0 = start + i * seg + gapDeg;
          var a1 = start + (i + 1) * seg - gapDeg;
          var p0 = pt(a0, Rdot), p1 = pt(a1, Rdot);
          var path = svgEl('path', {
            d: 'M ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
               ' A ' + Rdot + ' ' + Rdot + ' 0 0 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2),
            fill: 'none', stroke: o.flow, 'stroke-width': '1', 'stroke-linecap': 'round',
            'marker-end': 'url(#' + mkId + ')'
          });
          svg.appendChild(path);
          arcs.push(path);
        }

        var label = host.getAttribute('data-label');
        if (label) {
          var hubEl = d.createElement('div');
          hubEl.className = 'cyc-hub';
          var html = '';
          var kick = host.getAttribute('data-kick');
          if (kick) html += '<span class="kick">' + kick + '</span>';
          html += '<span class="lab">' + label + '</span>';
          var sub = host.getAttribute('data-sub');
          if (sub) html += '<span class="sub">' + sub + '</span>';
          hubEl.innerHTML = html;
          stage.appendChild(hubEl);
        }

        var stations = [];
        for (var j = 0; j < n; j++) {
          var deg = start + j * seg;
          var pos = pt(deg, Rdot);
          var sd = side(deg);

          var dot = d.createElement('span');
          dot.className = 'cyc-dot';
          dot.style.left = pos[0] + '%';
          dot.style.top = pos[1] + '%';
          dot.textContent = (j + 1);

          var tx = d.createElement('span');
          tx.className = 'cyc-tx';
          tx.setAttribute('data-side', sd);
          tx.style.left = pos[0] + '%';
          tx.style.top = pos[1] + '%';
          tx.innerHTML = '<span class="t">' + steps[j].title + '</span>' +
            (steps[j].desc ? '<span class="d">' + steps[j].desc + '</span>' : '');

          stage.appendChild(dot);
          stage.appendChild(tx);
          stations.push({ dot: dot, tx: tx, side: sd });
        }

        var loop = host.getAttribute('data-loop');
        var bottomFree = !stations.some(function (st) { return st.side === 'd'; });
        if (loop && bottomFree) {
          var lp = d.createElement('div');
          lp.className = 'cyc-loop';
          lp.textContent = loop;
          stage.appendChild(lp);
        }

        var fragN = mode === 'static' ? 0 : (mode === 'build' ? n - 1 : n);
        var frags = [];
        for (var f = 0; f < fragN; f++) {
          var sp = d.createElement('span');
          sp.className = 'fragment cyc-f';
          sp.setAttribute('data-fragment-index', f);
          host.appendChild(sp);
          frags.push(sp);
        }

        var cyc = { host: host, stage: stage, mode: mode, n: n,
                    stations: stations, arcs: arcs, frags: frags,
                    txtMax: txtMax, cur: -1 };
        all.push(cyc);
        layout(cyc);
        render(cyc);
      }

      function layout(cyc) {
        var w = cyc.host.clientWidth, h = cyc.host.clientHeight;
        if (!w || !h) return;
        var size = Math.min(w, h);
        cyc.stage.style.width = size + 'px';
        cyc.stage.style.height = size + 'px';

        var tw = Math.round(size * cyc.txtMax / 100);
        cyc.stations.forEach(function (st) {
          st.tx.style.maxWidth = tw + 'px';
          if (st.side === 'u' || st.side === 'd') st.tx.style.maxWidth = Math.round(tw * 0.9) + 'px';
        });

        var hub = cyc.stage.querySelector('.cyc-hub');
        if (hub) {
          var lab = hub.querySelector('.lab');
          if (lab) {
            var fs = Math.max(15, Math.round(size * 0.052));
            lab.style.fontSize = fs + 'px';
            var guard = 0;
            while (lab.scrollWidth > lab.clientWidth + 1 && fs > 13 && guard++ < 16) {
              fs -= 1; lab.style.fontSize = fs + 'px';
            }
          }
        }
      }

      function render(cyc) {
        var cur = cyc.cur, mode = cyc.mode, n = cyc.n;
        for (var i = 0; i < n; i++) {
          var st = cyc.stations[i];
          var cls = '';
          if (mode === 'build') {
            if (i > cur) cls = 'off';
            else if (i === cur) cls = 'now';
          } else if (mode === 'focus') {
            if (cur >= 0) cls = (i === cur) ? 'now' : 'dim';
          }
          setState(st, cls);
        }
        for (var k = 0; k < cyc.arcs.length; k++) {
          var show = true;
          if (mode === 'build') show = (k < cur);
          cyc.arcs[k].style.opacity = show ? '1' : '0';
        }
      }

      function setState(st, cls) {
        ['now', 'dim', 'off'].forEach(function (c) {
          st.dot.classList.remove(c); st.tx.classList.remove(c);
        });
        if (cls) { st.dot.classList.add(cls); st.tx.classList.add(cls); }
      }

      function sync() {
        all.forEach(function (cyc) {
          if (!cyc.frags.length) return;
          var shown = 0;
          cyc.frags.forEach(function (f) { if (f.classList.contains('visible')) shown++; });
          var cur = cyc.mode === 'build' ? shown : shown - 1;
          if (cur !== cyc.cur) { cyc.cur = cur; render(cyc); }
        });
      }

      function relayout() { all.forEach(layout); }

      function run() {
        [].forEach.call(d.querySelectorAll('.cycle'), build);
        relayout();
        sync();
      }

      run();
      if (deck.on) {
        deck.on('ready', function () { run(); });
        deck.on('slidechanged', function () { run(); });
        deck.on('resize', relayout);
        deck.on('fragmentshown', sync);
        deck.on('fragmenthidden', sync);
        deck.on('pdf-ready', function () { run(); });
      }

      Plugin.rebuild = run;
    }
  };

  if (typeof window !== 'undefined') {
    window.RevealCycle = Plugin;
  }
  if (typeof module !== 'undefined') {
    module.exports = Plugin;
  }
})();
