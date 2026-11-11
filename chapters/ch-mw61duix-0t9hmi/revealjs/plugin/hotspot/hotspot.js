/*!
 * reveal.js-hotspot 1.5.1 (vendored, theme-aware)
 * Annotate an image in place: markers sit on the picture, a tap opens the
 * explanation right next to them, the next tap closes it. One behaviour, no
 * modes. The corner button opens the figure full screen in a multimodal-style
 * dialog with every marker still working. Positions are percentages, so
 * nothing is measured at runtime. In ?print-pdf the numbered picture stays on
 * its slide (capped to fit one sheet) and its full legend prints on a page of
 * its own, so nothing is ever cut off.
 * @author  Florian Loyns
 * @license MIT
 *
 * Modified to use CSS custom properties (--hotspot-accent, --hotspot-active,
 * --hotspot-surface, --hotspot-line, --hotspot-strong, --hotspot-text,
 * --hotspot-ring, --hotspot-ring-color, --hotspot-radius, --hotspot-pw) with
 * fallbacks to the original defaults, so the hotspot inherits theme colors.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.RevealHotspot = factory());
}(this, (function () {
  'use strict';

  var VERSION = '1.5.1';

  function injectCSS(o) {
    if (document.getElementById('hotspot-css')) return;

    var half = Math.round(o.hit / 2);
    var gap  = o.hit - 4;

    var css =
      ".reveal .hotspot-block{margin:0 auto}"
      /* Der Rahmen umschließt das Bild exakt – nur so stimmen Prozentwerte. */
    + ".reveal .hotspot{position:relative;display:block;width:100%;"
      + "max-width:var(--hotspot-w," + o.width + "px);margin:0 auto;line-height:0}"
    + ".reveal .hotspot>img,.reveal .hotspot>svg,.reveal .hotspot>picture,"
      + ".reveal .hotspot>video{display:block;width:100%;height:auto;border-radius:" + "var(--hotspot-radius," + o.radius + "px)}"
    + ".reveal figure.hotspot{padding:0}"

      /* Marker: sichtbar klein, Trefferfläche groß. Liegt in .slides und
         skaliert damit mit dem Deck. */
    + ".reveal .hotspot-point{position:absolute;width:" + o.hit + "px;height:" + o.hit + "px;"
      + "transform:translate(-50%,-50%);margin:0;padding:0;border:0;background:none;"
      + "cursor:pointer;touch-action:manipulation;display:flex;align-items:center;"
      + "justify-content:center;z-index:2;font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}"
    + ".reveal .hotspot-point:focus{outline:none}"
    + ".reveal .hotspot-point:focus-visible .hotspot-dot{box-shadow:0 0 0 3px var(--hotspot-ring-color,#fff),0 0 0 6px var(--hotspot-accent," + o.accent + ")}"
    + ".reveal .hotspot-dot{width:" + o.dot + "px;height:" + o.dot + "px;border-radius:50%;"
      + "background:var(--hotspot-accent," + o.accent + ");"
      + "box-shadow:0 0 0 var(--hotspot-ring," + o.ring + "px) var(--hotspot-ring-color,#fff),0 1px 6px rgba(0,0,0,.32);"
      + "display:flex;align-items:center;justify-content:center;flex:0 0 auto;"
      + "transition:transform .16s ease,background .16s ease}"
    + "@media (hover:hover){.reveal .hotspot-point:hover .hotspot-dot{transform:scale(1.18)}}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"]{z-index:6}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-dot{background:var(--hotspot-active," + o.active + ");transform:scale(1.25)}"
    + ".reveal .hotspot-n{display:none;font-size:" + Math.round(o.dot * .62) + "px;font-weight:800;"
      + "line-height:1;color:#fff;font-family:inherit}"
    + ".reveal .hotspot[data-numbers] .hotspot-dot{width:" + Math.round(o.dot * 1.45) + "px;"
      + "height:" + Math.round(o.dot * 1.45) + "px}"
    + ".reveal .hotspot[data-numbers] .hotspot-n{display:block}"

      /* Die Sprechblase – gebaut wie der Glossar-Tooltip: weiß, 1px #E7EBEF,
         Radius 12, Schatten 0 14px 32px -12px. */
    + ".reveal .hotspot-pop{position:absolute;width:var(--hotspot-pw," + o.popWidth + "px);max-width:60vw;"
      + "background:var(--hotspot-surface," + o.surface + ");border:1px solid var(--hotspot-line," + o.line + ");border-radius:12px;"
      + "padding:12px 15px;box-shadow:0 14px 32px -12px rgba(0,0,0,.3);text-align:left;"
      + "line-height:1.5;opacity:0;pointer-events:none;visibility:hidden;"
      + "transition:opacity .18s ease,transform .18s ease,visibility .18s;z-index:7}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-pop{opacity:1;visibility:visible;pointer-events:auto}"
    + ".reveal .hotspot-label{display:block;font-size:" + o.labelSize + "px;font-weight:700;"
      + "line-height:1.3;color:var(--hotspot-strong," + o.strong + ")}"
    + ".reveal .hotspot-text{display:block;font-size:" + o.textSize + "px;font-weight:400;"
      + "color:var(--hotspot-text," + o.text + ");margin-top:4px}"
    + ".reveal .hotspot-text>*:first-child{margin-top:0}"
    + ".reveal .hotspot-text>*:last-child{margin-bottom:0}"
    + ".reveal .hotspot-pop::after{content:\"\";position:absolute;width:10px;height:10px;"
      + "background:var(--hotspot-surface," + o.surface + ");border:1px solid var(--hotspot-line," + o.line + ");transform:rotate(45deg)}"
    + ".reveal .hotspot-pop.at-r{left:" + gap + "px;top:50%;transform:translateY(-50%) translateX(6px)}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-pop.at-r{transform:translateY(-50%) translateX(0)}"
    + ".reveal .hotspot-pop.at-r::after{left:-6px;top:50%;margin-top:-5px;border-right:0;border-top:0}"
    + ".reveal .hotspot-pop.at-l{right:" + gap + "px;top:50%;transform:translateY(-50%) translateX(-6px)}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-pop.at-l{transform:translateY(-50%) translateX(0)}"
    + ".reveal .hotspot-pop.at-l::after{right:-6px;top:50%;margin-top:-5px;border-left:0;border-bottom:0}"
    + ".reveal .hotspot-pop.at-d{top:" + gap + "px;left:50%;transform:translateX(-50%) translateY(6px)}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-pop.at-d{transform:translateX(-50%) translateY(0)}"
    + ".reveal .hotspot-pop.at-d::after{top:-6px;left:50%;margin-left:-5px;border-right:0;border-bottom:0}"
    + ".reveal .hotspot-pop.at-u{bottom:" + gap + "px;left:50%;transform:translateX(-50%) translateY(-6px)}"
    + ".reveal .hotspot-point[aria-expanded=\"true\"] .hotspot-pop.at-u{transform:translateX(-50%) translateY(0)}"
    + ".reveal .hotspot-pop.at-u::after{bottom:-6px;left:50%;margin-left:-5px;border-left:0;border-top:0}"

      /* Vollbild in der Optik von Multimodal: Abdunklung rgba(0,0,0,.30),
         weißer Dialog mit 1px weißem Rand, Radius .5em, weicher Schatten,
         Auf-Zoom von 0.9 auf 1 in 0.3s, mit --slide-scale multipliziert. */
    + ".reveal .hotspot-zoom{position:absolute;top:0;right:0;width:" + o.hit + "px;height:" + o.hit + "px;"
      + "margin:0;padding:0;border:0;background:none;cursor:zoom-in;z-index:4;display:flex;"
      + "align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}"
    + ".reveal .hotspot-zoom span{width:30px;height:30px;border-radius:9px;"
      + "background:rgba(255,255,255,.88);border:1px solid var(--hotspot-line," + o.line + ");color:#6B7B7B;"
      + "display:flex;align-items:center;justify-content:center;opacity:.62;transition:opacity .15s}"
    + ".reveal .hotspot-zoom:hover span{opacity:1}"
    + ".reveal .hotspot-zoom svg{width:17px;height:17px;stroke:currentColor;fill:none;"
      + "stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"
    + ".reveal.overview .hotspot-zoom{display:none}"
    + ".reveal .hotspot-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;"
      + "background:rgba(0,0,0,.30);display:flex;justify-content:center;align-items:center;"
      + "opacity:0;transition:all .3s ease-in-out}"
    + ".reveal .hotspot-overlay.show{opacity:1}"
    + ".reveal .hotspot-dialog{position:relative;display:flex;flex-direction:column;"
      + "background:#fff;border:1px solid #fff;border-radius:.5em;"
      + "box-shadow:0 .5em .75em .5em rgba(0,0,0,.25);"
      + "transform:scale(calc(var(--slide-scale,1) * .9));transition:all .3s ease-in-out}"
    + ".reveal .hotspot-overlay.show .hotspot-dialog{transform:scale(var(--slide-scale,1))}"
    + ".reveal .hotspot-dialog .hotspot{max-width:none;width:-webkit-fit-content;width:fit-content;margin:0}"
    + ".reveal .hotspot-dialog .hotspot>img,.reveal .hotspot-dialog .hotspot>svg,"
      + ".reveal .hotspot-dialog .hotspot>video{border-radius:.5em}"
    + ".reveal .hotspot-dialog .hotspot-zoom{display:none}"
    + ".reveal .hotspot-overlay-close{position:absolute;right:1em;top:1em;width:28px;height:28px;"
      + "margin:0;padding:2px;border:0;border-radius:50%;background:rgba(0,0,0,.28);cursor:pointer;"
      + "display:flex;justify-content:center;align-items:center;z-index:2;"
      + "touch-action:manipulation;-webkit-tap-highlight-color:transparent}"
    + ".reveal .hotspot-overlay-close::before{content:\"\";position:absolute;width:28px;height:28px;"
      + "border-radius:20px;background:transparent;transition:all .0675s linear;pointer-events:none;z-index:-1}"
    + ".reveal .hotspot-overlay-close:hover::before,.reveal .hotspot-overlay-close:focus::before{"
      + "width:36px;height:36px;background:rgba(0,0,0,.2)}"
    + ".reveal .hotspot-overlay-close svg{width:24px;height:24px}"
    + ".reveal .hotspot-overlay-close svg line{stroke:#fff;stroke-linecap:round;stroke-width:1.25}"

      /* Autorenmodus: Klick auf das Bild liefert den fertigen Schnipsel. */
    + ".reveal .hotspot[data-author]{cursor:crosshair;outline:2px dashed var(--hotspot-accent," + o.accent + ");outline-offset:3px}"
    + ".reveal .hotspot-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);"
      + "background:var(--hotspot-strong," + o.strong + ");color:#fff;border-radius:9px;padding:9px 14px;z-index:9;"
      + "font-size:" + Math.round(o.textSize * .85) + "px;line-height:1.4;text-align:left;"
      + "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;max-width:92%;"
      + "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"

    + ".reveal .hotspot-legend{display:none}";

    var printRules = [
      ".reveal .hotspot-block{break-inside:avoid}",
      ".reveal .hotspot{margin:0 auto}",
      ".reveal .hotspot{width:auto !important}",
      ".reveal .hotspot > img,.reveal .hotspot > svg,.reveal .hotspot > picture,"
        + ".reveal .hotspot > video{max-height:58vh;max-width:100%;width:auto;height:auto}",
      ".reveal .hotspot .hotspot-point{opacity:1 !important;visibility:visible !important}",
      ".reveal .hotspot .hotspot-dot{width:" + Math.round(o.dot * 1.2) + "px;height:"
        + Math.round(o.dot * 1.2) + "px}",
      ".reveal .hotspot .hotspot-n{display:block;font-size:" + Math.round(o.dot * .55) + "px}",
      ".reveal .hotspot-pop,.reveal .hotspot-hint,.reveal .hotspot-zoom,"
        + ".reveal .hotspot-overlay{display:none !important}",
      ".reveal .hotspot-block > .hotspot-legend{display:none}",
      ".reveal .hotspot-legend-slide .hotspot-legend{display:block;list-style:none;"
        + "margin:0;padding:0;text-align:left}",
      ".reveal .hotspot-legend-slide .hotspot-legend li{display:flex;gap:14px;margin-bottom:16px;"
        + "break-inside:avoid;align-items:flex-start;font-size:20px;line-height:1.4}",
      ".reveal .hotspot-legend-slide .hotspot-legend .n{flex:0 0 auto;width:30px;height:30px;"
        + "margin-top:1px;border-radius:50%;background:var(--hotspot-accent," + o.accent + ");color:#fff;font-size:15px;"
        + "font-weight:800;display:flex;align-items:center;justify-content:center}",
      ".reveal .hotspot-legend-slide .hotspot-legend .l{font-size:20px;font-weight:700;color:var(--hotspot-strong," + o.strong + ")}",
      ".reveal .hotspot-legend-slide .hotspot-legend .t{font-size:18px;color:var(--hotspot-text," + o.text + ")}"
    ];
    css += "@media print{" + printRules.join('') + "}";
    printRules.forEach(function (r) {
      var i = r.indexOf('{');
      var sel = r.slice(0, i).split(',').map(function (x) {
        return 'html.print-pdf ' + x.trim();
      }).join(',');
      css += sel + r.slice(i);
    });

    var el = document.createElement('style');
    el.id = 'hotspot-css';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ------------------------------------------------------------------ *
   * Hilfsfunktionen
   * ------------------------------------------------------------------ */

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function side(x, y, override) {
    if (override === 'l' || override === 'r' || override === 'u' || override === 'd') return override;
    if (x > 62) return 'l';
    if (x < 38) return 'r';
    return y > 55 ? 'u' : 'd';
  }

  function toClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)['catch'](function () { legacyCopy(text); });
    } else legacyCopy(text);
  }
  function legacyCopy(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
  }

  var ZOOM_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<path d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"/></svg>';
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">'
    + '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  /* ------------------------------------------------------------------ *
   * Plugin
   * ------------------------------------------------------------------ */
  var Plugin = {
    id: 'hotspot',
    VERSION: VERSION,

    init: function (deck) {
      var c = (deck.getConfig && deck.getConfig().hotspot) || {};
      var o = {
        accent:    c.accent    || '#2C4A6E',
        active:    c.active    || '#203A58',
        surface:   c.surface   || '#FFFFFF',
        line:      c.line      || '#E7EBEF',
        strong:    c.strong    || '#0B1818',
        text:      c.text      || '#22312F',
        hit:       c.hit       || 48,
        dot:       c.dot       || 18,
        ring:      c.ring      || 4,
        width:     c.width     || 760,
        popWidth:  c.popWidth  || 330,
        labelSize: c.labelSize || 19,
        textSize:  c.textSize  || 17,
        radius:    c.radius    || 12,
        multiple:  c.multiple  === true,
        numbers:   c.numbers   === true,
        author:    c.author    === true,
        maximize:  c.maximize  !== false,
        strings:   {
          maximize: (c.strings && c.strings.maximize) || 'Bild groß zeigen',
          close:    (c.strings && c.strings.close)    || 'Schließen'
        }
      };

      injectCSS(o);

      var wantsSync = false;

      function build(fig) {
        if (fig.hasAttribute('data-hotspot-ready')) return;
        fig.setAttribute('data-hotspot-ready', '');

        if (!fig.hasAttribute('data-prevent-swipe')) fig.setAttribute('data-prevent-swipe', '');

        if (fig.dataset.width) fig.style.setProperty('--hotspot-w', fig.dataset.width);
        if (o.numbers && !fig.hasAttribute('data-numbers')) fig.setAttribute('data-numbers', '');
        if (o.author && !fig.hasAttribute('data-author')) fig.setAttribute('data-author', '');

        var block = el('div', 'hotspot-block');
        fig.parentNode.insertBefore(block, fig);
        block.appendChild(fig);

        var media = fig.querySelector(':scope > img, :scope > svg, :scope > picture, :scope > video');
        if (!media) {
          if (window.console) console.warn('hotspot: no image in the container', fig);
          return;
        }

        var sources = [].slice.call(fig.querySelectorAll(':scope > span[data-x], :scope > a[data-x]'));
        var points = [];

        sources.forEach(function (src, i) {
          var x = parseFloat(src.dataset.x);
          var y = parseFloat(src.dataset.y);
          var label = (src.dataset.label || '').trim();

          if (!isFinite(x) || !isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100 || !label) {
            if (window.console) console.warn('hotspot: marker ' + (i + 1)
              + ' skipped (needs data-x/data-y between 0 and 100 and a data-label)', src);
            src.parentNode.removeChild(src);
            return;
          }

          var btn = el('button', 'hotspot-point');
          btn.type = 'button';
          btn.style.left = x + '%';
          btn.style.top = y + '%';
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('aria-label', label);

          if (src.classList.contains('fragment')) {
            [].forEach.call(src.classList, function (cl) { btn.classList.add(cl); });
            if (src.dataset.fragmentIndex != null) btn.dataset.fragmentIndex = src.dataset.fragmentIndex;
            wantsSync = true;
          }

          var dot = el('span', 'hotspot-dot');
          dot.setAttribute('aria-hidden', 'true');
          dot.appendChild(el('b', 'hotspot-n', String(i + 1)));
          btn.appendChild(dot);

          var dir = side(x, y, src.dataset.side);
          var pop = el('span', 'hotspot-pop at-' + dir);
          pop.appendChild(el('span', 'hotspot-label', label));
          if (src.childNodes.length && src.textContent.trim() !== '') {
            var body = el('span', 'hotspot-text');
            while (src.firstChild) body.appendChild(src.firstChild);
            pop.appendChild(body);
          }
          btn.appendChild(pop);

          fig.appendChild(btn);
          points.push({ btn: btn, label: label, textNode: pop.querySelector('.hotspot-text') });
          src.parentNode.removeChild(src);
        });

        if (!points.length) {
          if (window.console) console.warn('hotspot: no usable markers in this container', fig);
          return;
        }

        var legend = el('ol', 'hotspot-legend');
        legend.setAttribute('aria-hidden', 'true');
        points.forEach(function (p, i) {
          var li = el('li');
          li.appendChild(el('span', 'n', String(i + 1)));
          var wrap = el('span');
          wrap.appendChild(el('span', 'l', p.label));
          if (p.textNode) {
            var t = el('span', 't');
            t.textContent = ' — ' + p.textNode.textContent.replace(/\s+/g, ' ').trim();
            wrap.appendChild(t);
          }
          li.appendChild(wrap);
          legend.appendChild(li);
        });
        block.appendChild(legend);

        /* ---- Bedienung: ein Tipp öffnet, der nächste schließt ---- */
        function closePops(except) {
          points.forEach(function (p) {
            if (p.btn !== except) p.btn.setAttribute('aria-expanded', 'false');
          });
        }
        function onTap(p) {
          var open = p.btn.getAttribute('aria-expanded') === 'true';
          if (!o.multiple && !fig.hasAttribute('data-multiple')) closePops(p.btn);
          p.btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        }

        points.forEach(function (p) {
          p.btn.addEventListener('pointerup', function (e) {
            e.stopPropagation();
            onTap(p);
          });
          p.btn.addEventListener('click', function (e) {
            if (e.detail !== 0) { e.stopPropagation(); return; }
            onTap(p);
          });
        });

        fig.addEventListener('pointerup', function (e) {
          if (!e.target.closest || !e.target.closest('.hotspot-point, .hotspot-zoom')) closePops(null);
        });
        fig.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { closePops(null); e.stopPropagation(); }
        });

        /* ---- Vollbild ---- */
        if (o.maximize && fig.dataset.maximize !== 'off') {
          var zoomBtn = el('button', 'hotspot-zoom');
          zoomBtn.type = 'button';
          zoomBtn.setAttribute('aria-label', o.strings.maximize);
          var zi = el('span'); zi.innerHTML = ZOOM_ICON; zoomBtn.appendChild(zi);
          fig.appendChild(zoomBtn);

          var overlay = null, figPh = null, closing = false;

          function trapKeys(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMax(); }
            else e.stopPropagation();
          }
          function openMax() {
            if (overlay) return;
            var s = (deck.getScale && deck.getScale()) || 1;
            overlay = el('div', 'hotspot-overlay');
            overlay.setAttribute('data-prevent-swipe', '');
            var dialog = el('div', 'hotspot-dialog');
            var closeBtn = el('button', 'hotspot-overlay-close');
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', o.strings.close);
            closeBtn.innerHTML = CLOSE_ICON;
            closeBtn.addEventListener('click', closeMax);

            figPh = document.createComment('hotspot');
            fig.parentNode.insertBefore(figPh, fig);
            dialog.appendChild(fig);
            dialog.appendChild(closeBtn);
            overlay.appendChild(dialog);
            overlay.addEventListener('pointerup', function (e) {
              if (e.target === overlay) closeMax();
            });
            ((deck.getRevealElement && deck.getRevealElement()) || document.body).appendChild(overlay);

            media.dataset.hsW = media.style.width;
            media.dataset.hsH = media.style.height;
            if (media.tagName === 'IMG' && media.naturalWidth) {
              var availW = window.innerWidth * .9 / s;
              var availH = window.innerHeight * .86 / s;
              var h = Math.min(availH, availW * media.naturalHeight / media.naturalWidth);
              media.style.height = Math.round(h) + 'px';
              media.style.width = 'auto';
            } else if (media.tagName === 'SVG' || media.tagName === 'svg') {
              media.style.height = Math.round(window.innerHeight * .8 / s) + 'px';
              media.style.width = 'auto';
            }

            requestAnimationFrame(function () {
              requestAnimationFrame(function () { overlay.classList.add('show'); });
            });
            document.addEventListener('keydown', trapKeys, true);
          }
          function closeMax() {
            if (!overlay || closing) return;
            closing = true;
            document.removeEventListener('keydown', trapKeys, true);
            overlay.classList.remove('show');
            setTimeout(function () {
              media.style.width = media.dataset.hsW || '';
              media.style.height = media.dataset.hsH || '';
              delete media.dataset.hsW; delete media.dataset.hsH;
              figPh.parentNode.insertBefore(fig, figPh);
              figPh.parentNode.removeChild(figPh);
              overlay.parentNode.removeChild(overlay);
              overlay = null; figPh = null; closing = false;
            }, 300);
          }
          zoomBtn.addEventListener('click', function (e) { e.stopPropagation(); openMax(); });
          zoomBtn.addEventListener('pointerup', function (e) { e.stopPropagation(); });
        }

        /* ---- Autorenmodus ---- */
        if (fig.hasAttribute('data-author')) {
          var hint = null;
          fig.addEventListener('click', function (e) {
            if (e.target.closest('.hotspot-point, .hotspot-zoom')) return;
            var r = media.getBoundingClientRect();
            if (!r.width || !r.height) return;
            var px = ((e.clientX - r.left) / r.width * 100).toFixed(1);
            var py = ((e.clientY - r.top) / r.height * 100).toFixed(1);
            var snippet = '<span data-x="' + px + '" data-y="' + py + '" data-label="Label">Text</span>';
            toClipboard(snippet);
            if (!hint) { hint = el('span', 'hotspot-hint'); fig.appendChild(hint); }
            hint.textContent = 'copied · ' + snippet;
          });
        }
      }

      var ready = false;
      var printMode = /(?:\?|&)print-pdf/.test(window.location.search);

      function buildPrintLegends() {
        var host = (deck.getRevealElement && deck.getRevealElement()) || document;
        [].forEach.call(host.querySelectorAll('.hotspot-block > .hotspot-legend'), function (legend) {
          if (legend.dataset.hsSlide) return;
          legend.dataset.hsSlide = '1';
          var sourceSlide = legend.closest('section');
          if (!sourceSlide || !sourceSlide.parentNode) return;
          var title = (sourceSlide.querySelector('h1,h2,h3') || {}).textContent || '';

          var slide = document.createElement('section');
          slide.className = 'hotspot-legend-slide';
          var card = document.createElement('div');
          card.className = 'cardslide';
          if (title) {
            var h = document.createElement('h2');
            h.textContent = title;
            card.appendChild(h);
          }
          card.appendChild(legend.cloneNode(true));
          slide.appendChild(card);
          sourceSlide.parentNode.insertBefore(slide, sourceSlide.nextSibling);
        });
      }

      function run() {
        var host = (deck.getRevealElement && deck.getRevealElement()) || document;
        [].forEach.call(host.querySelectorAll('.hotspot'), build);
        if (ready && wantsSync && deck.sync) { wantsSync = false; deck.sync(); }
      }

      run();

      if (printMode) buildPrintLegends();

      if (deck.on) {
        deck.on('ready', function () { ready = true; run(); });
        deck.on('slidechanged', function () {
          run();
          var host = (deck.getRevealElement && deck.getRevealElement()) || document;
          [].forEach.call(host.querySelectorAll('.hotspot-point[aria-expanded="true"]'),
            function (b) { b.setAttribute('aria-expanded', 'false'); });
        });
      } else {
        ready = true;
        if (printMode) buildPrintLegends();
      }

      Plugin.rebuild = run;
    }
  };

  return Plugin;
})));