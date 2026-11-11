/*
 * RELAX widget helper — powers the `relax` element rendered by the engine.
 * Loaded next to the vendored relax-embed.bundle.js. Exposes window.relaxWidget
 * with run()/copySchema() used by inline onclick handlers in element markup.
 *
 * RELAX widgets embed the vendored RelaX engine (MIT, dbis-uibk/relax —
 * see LICENSE.txt next to this file).
 */
(function () {
  'use strict';
  if (window.relaxWidget) return;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function widgetOf(btn) {
    if (typeof btn.closest === 'function') return btn.closest('.relax-widget');
    var el = btn && btn.parentElement;
    while (el && !el.classList.contains('relax-widget')) el = el.parentElement;
    return el;
  }

  function renderTable(res) {
    if (!res.rowCount) {
      return '<p class="relax-none">Empty result — no rows returned.</p>';
    }
    var html = '<div class="relax-table-wrap"><table class="relax-table">';
    html += '<thead><tr>';
    for (var i = 0; i < res.columns.length; i++) {
      var col = res.columns[i];
      var name = col && col.name ? col.name : '';
      var dot = name.indexOf('.');
      var rel = dot >= 0 ? name.substring(0, dot) : '';
      var nm = dot >= 0 ? name.substring(dot + 1) : name;
      html += '<th>' + esc(nm) +
        (rel ? '<small>' + esc(rel) + '</small>' : '') +
        '<small>' + esc(col ? col.type : '') + '</small></th>';
    }
    html += '</tr></thead><tbody>';
    for (var r = 0; r < res.rows.length; r++) {
      html += '<tr>';
      for (var c = 0; c < res.columns.length; c++) {
        var val = res.rows[r][c];
        html += '<td>' + (val === null ? '<em class="relax-null">null</em>' : esc(val)) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function renderTree(node) {
    if (!node) return '';
    var isLeaf = !node.children || node.children.length === 0;
    var cls = 'relax-node-box' + (isLeaf ? ' relax-leaf' : '');
    var badge = node.rowCount >= 0
      ? '<span class="relax-node-rows">' + node.rowCount + ' row' + (node.rowCount !== 1 ? 's' : '') + '</span>'
      : '';
    var schemaAttr = node.columns && node.columns.length > 0 ? ' data-node-schema="1"' : '';
    var html = '<li><div class="relax-node-wrap"><div class="' + cls + '"' + schemaAttr + '>' +
      (node.htmlLabel || esc(node.label || '?')) + badge + '</div>';
    if (!isLeaf) {
      html += '<ul class="relax-node-children">';
      for (var i = 0; i < node.children.length; i++) html += renderTree(node.children[i]);
      html += '</ul>';
    }
    html += '</div></li>';
    return html;
  }

  /* ── Per-node hover popup (schema columns + counts) ──
     One fixed-position element shared by all widgets on the page; moved to the
     hovered node and filled with that node's intermediate-schema details. */
  var _popup = null;

  function popupEl() {
    if (!_popup) {
      _popup = document.createElement('div');
      _popup.className = 'relax-node-popup';
      document.body.appendChild(_popup);
    }
    return _popup;
  }

  function showNodePopup(node, boxEl) {
    if (!node.columns || node.columns.length === 0) return;
    var colRows = '';
    for (var i = 0; i < node.columns.length; i++) {
      var c = node.columns[i];
      colRows += '<div class="relax-pop-col"><span class="relax-pop-col-name">' + esc(c.name) + '</span>' +
        '<span class="relax-pop-col-type">' + esc(c.type) + '</span></div>';
    }
    var popup = popupEl();
    popup.innerHTML =
      '<div class="relax-pop-title">Schema &nbsp;&middot;&nbsp; ' + node.columns.length + ' col' +
      (node.columns.length !== 1 ? 's' : '') + ', ' +
      (node.rowCount >= 0 ? node.rowCount + ' row' + (node.rowCount !== 1 ? 's' : '') : '?') + '</div>' + colRows;
    popup.style.display = 'block';
    positionPopup(popup, boxEl);
  }

  function hideNodePopup() {
    if (_popup) _popup.style.display = 'none';
  }

  function positionPopup(popup, boxEl) {
    var r = boxEl.getBoundingClientRect();
    var pw = popup.offsetWidth || 240;
    var ph = popup.offsetHeight || 100;
    var top = r.top - ph - 10;
    if (top < 8) top = r.bottom + 10;
    var left = r.left + r.width / 2 - pw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
  }

  /* Walk the rendered tree DOM in parallel with the tree node data and attach
     hover handlers, mirroring how the reference calculator exposes per-node
     schema details. */
  function attachTreeEvents(rootEl, treeNode) {
    function attach(liEl, node) {
      var box = liEl.querySelector(':scope > .relax-node-wrap > .relax-node-box');
      if (box && node.columns && node.columns.length > 0) {
        box.addEventListener('mouseenter', function () { showNodePopup(node, box); });
        box.addEventListener('mouseleave', hideNodePopup);
      }
      var ul = liEl.querySelector(':scope > .relax-node-wrap > ul');
      if (ul && node.children) {
        var lis = ul.querySelectorAll(':scope > li');
        node.children.forEach(function (child, i) { if (lis[i]) attach(lis[i], child); });
      }
    }
    var rootLi = rootEl.querySelector('ul > li');
    if (rootLi) attach(rootLi, treeNode);
  }

  function run(btn) {
    var w = widgetOf(btn);
    if (!w) return;
    var schemaEl = w.querySelector('.relax-schema-text');
    var queryEl = w.querySelector('.relax-query-input');
    var statusEl = w.querySelector('.relax-status');
    var formulaEl = w.querySelector('.relax-formula');
    var treeEl = w.querySelector('.relax-tree');
    var tableEl = w.querySelector('.relax-table');

    var schema = schemaEl ? schemaEl.textContent : '';
    var query = queryEl ? queryEl.value.trim() : '';
    if (!query) {
      if (statusEl) statusEl.textContent = 'Enter a relational algebra expression first.';
      return;
    }
    if (!window.relaxAPI) {
      if (statusEl) statusEl.textContent = 'RELAX engine not loaded (relax-embed.bundle.js missing).';
      return;
    }
    var res = window.relaxAPI.relaxEval(schema, query);
    if (statusEl) { statusEl.textContent = ''; statusEl.setAttribute('class', 'relax-status'); }
    if (formulaEl) formulaEl.innerHTML = '';
    if (treeEl) treeEl.innerHTML = '';
    if (tableEl) tableEl.innerHTML = '';
    hideNodePopup();

    if (res && res.error) {
      if (statusEl) {
        statusEl.textContent = 'Error: ' + res.error;
        statusEl.setAttribute('class', 'relax-status relax-error');
      }
      return;
    }
    if (!res) {
      if (statusEl) statusEl.textContent = 'No result returned.';
      return;
    }
    if (statusEl) {
      statusEl.textContent = 'Formula ✓   Degree: ' + res.columns.length + '   |   Rows: ' + res.rowCount;
      statusEl.setAttribute('class', 'relax-status relax-ok');
    }
    if (formulaEl && res.formulaHtml) {
      var fhtml = String(res.formulaHtml).replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '');
      formulaEl.innerHTML = '<div class="relax-section-title">Formula</div><div class="relax-formula-html">' + fhtml + '</div>';
    }
    if (treeEl) {
      var treeHtml = renderTree(res.tree);
      if (treeHtml) {
        treeEl.innerHTML = '<div class="relax-section-title">Expression Tree</div><div class="relax-tree-root"><ul>' + treeHtml + '</ul></div>';
        attachTreeEvents(treeEl, res.tree);
      }
    }
    if (tableEl) {
      tableEl.innerHTML = '<div class="relax-section-title">Result Table</div>' + renderTable(res);
    }
  }

  function runAll(root) {
    var nodes = (root || document).querySelectorAll('.relax-widget .relax-run');
    for (var i = 0; i < nodes.length; i++) run(nodes[i]);
  }

  function copySchema(btn) {
    var w = widgetOf(btn);
    if (!w) return;
    var schemaEl = w.querySelector('.relax-schema-text');
    if (!schemaEl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(schemaEl.textContent).catch(function () {});
    }
  }

  // Symbol palette buttons: insert the button's data-sym value into the
  // widget's query textarea at the caret (falling back to the label text).
  function insertSymbol(btn) {
    var w = widgetOf(btn);
    if (!w) return;
    var q = w.querySelector('.relax-query-input');
    if (!q) return;
    var sym = (btn && btn.getAttribute) ? btn.getAttribute('data-sym') : null;
    if (!sym && btn && btn.textContent) sym = btn.textContent.trim();
    if (!sym) return;
    var start = q.selectionStart;
    var end = q.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number') {
      q.value = q.value.slice(0, start) + sym + q.value.slice(end);
      var caret = start + sym.length;
      q.focus();
      try { q.setSelectionRange(caret, caret); } catch (_) {}
    } else {
      q.value = q.value + sym;
    }
  }

  function closeModal(overlay) {
    overlay.setAttribute('class', 'relax-modal-backdrop');
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // "⧉ Schema" button: open a modal with the pre-rendered crow's-foot ER
  // diagram for this schema (compiled to a PNG by the app's mermaid pass) plus
  // the RELAX schema text and a Copy button. When no diagram was compiled
  // (e.g. a standalone embed without the render pass), the modal still works —
  // it just shows the schema text and a hint.
  function showDiagram(btn) {
    var w = widgetOf(btn);
    if (!w) return;
    var open = w.querySelector('.relax-modal-backdrop');
    if (open) { open.setAttribute('class', 'relax-modal-backdrop relax-open'); return; }

    var schemaEl = w.querySelector('.relax-schema-text');
    var schemaText = schemaEl ? schemaEl.textContent : '';
    var img = w.querySelector('.relax-diagram .relax-diagram-img');
    var hasImg = !!img && !!img.getAttribute('src');

    var title = 'Relational schema';
    var titleEl = w.querySelector('.relax-title');
    if (titleEl) {
      var t = titleEl.textContent.trim();
      if (t && t !== 'Relational Algebra Calculator') title = t;
    }

    var diagramHtml = hasImg
      ? '<img class="relax-diagram-img" src="' + esc(img.getAttribute('src')) + '" alt="Entity relationship diagram" />'
      : '<p class="relax-diagram-none">ER diagram not available for this schema. Open a preview or export to render it.</p>';

    var overlay = document.createElement('div');
    overlay.setAttribute('class', 'relax-modal-backdrop relax-open');
    overlay.innerHTML =
      '<div class="relax-modal">' +
      '<div class="relax-modal-head"><span class="relax-modal-title">' + esc(title) + '</span>' +
      '<button type="button" class="relax-modal-close" title="Close" aria-label="Close">&times;</button></div>' +
      '<div class="relax-modal-body">' +
      '<div class="relax-modal-figure">' + diagramHtml +
      '<div class="relax-modal-caption">Entity&#8211;relationship diagram (crow&#8217;s foot)</div></div>' +
      '<div class="relax-modal-schema"><div class="relax-modal-schema-label">Schema (RELAX)</div>' +
      '<pre class="relax-modal-schema-text">' + esc(schemaText) + '</pre></div>' +
      '</div>' +
      '<div class="relax-modal-foot"><button type="button" class="relax-modal-copy">Copy schema</button></div>' +
      '</div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
    var closeBtn = overlay.querySelector('.relax-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { closeModal(overlay); });
    var copyBtn = overlay.querySelector('.relax-modal-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(schemaText).catch(function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = schemaText;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
      }
      copyBtn.textContent = 'Copied \u2713';
      setTimeout(function () { copyBtn.textContent = 'Copy schema'; }, 1200);
    });
    w.appendChild(overlay);
  }

  window.relaxWidget = { run: run, runAll: runAll, copySchema: copySchema, insertSymbol: insertSymbol, showDiagram: showDiagram };
})();