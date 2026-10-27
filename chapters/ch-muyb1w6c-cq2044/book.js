/**
 * book.js — client-side behavior for the book page.
 * (theme toggle with persistence, sidebar toggle, back-to-top, scroll-spy,
 * search with page filtering)
 */

(function () {
  'use strict';

  var DATA = (window.BOOK_DATA || {});
  var bookEl = document.body;
  var rootEl = document.documentElement;

  // ── Theme toggle ────────────────────────────────────────────────
  var THEME_KEY = 'book-theme';
  var themeToggle = document.getElementById('book-theme-toggle');

  function applyTheme(theme) {
    rootEl.setAttribute('data-book-theme', theme === 'dark' ? 'dark' : 'light');
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
    var theme;
    if (saved === 'dark' || saved === 'light') {
      theme = saved;
    } else {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    applyTheme(theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = rootEl.getAttribute('data-book-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    });
  }
  initTheme();

// ── Sidebar toggle ──────────────────────────────────────────────
  var MOBILE_QUERY = '(max-width: 900px)';
  var toggle = document.getElementById('book-toggle');
  if (toggle) {
    var isMobile = function () {
      return window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
    };
    var syncToggleState = function () {
      // Mobile keeps the drawer off-canvas until opened; on desktop the
      // sidebar is visible until collapsed.
      var open = isMobile() ? bookEl.classList.contains('sidebar-open')
                            : !bookEl.classList.contains('sidebar-collapsed');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      if (isMobile()) bookEl.classList.toggle('sidebar-open');
      else bookEl.classList.toggle('sidebar-collapsed');
      syncToggleState();
    });
    syncToggleState();
  }

  // ── Back to top ─────────────────────────────────────────────────
  var backTop = document.getElementById('book-back-to-top');
  if (backTop) {
    var onScroll = function () {
      backTop.classList.toggle('visible', (document.scrollingElement || document.documentElement).scrollTop > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

// ── Scroll-spy ──────────────────────────────────────────────────
  var NAV_SEL = '.book-nav-chapter-link, .book-toc a';
  var navLinks = collectNavLinks();

  function collectNavLinks() {
    return Array.prototype.slice.call(document.querySelectorAll(NAV_SEL));
  }

  function findLink(id) {
    return navLinks.find(function (a) { return a.getAttribute('href') === '#' + id; }) || null;
  }

  var headings = (DATA.headings || []).map(function (h) {
    return { el: document.getElementById(h.id), link: findLink(h.id) };
  }).filter(function (h) { return h.el; });

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      // Deactivate all, activate the matching link (if any).
      navLinks.forEach(function (a) { a.classList.remove('active'); });
      var hit = headings.find(function (h) { return h.el === en.target; });
      if (hit && hit.link) hit.link.classList.add('active');
      else findActivePageLink(en.target.id);
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  headings.forEach(function (h) { spy.observe(h.el); });

  // Fallback: highlight the chapter link owning the visible <article>.
  function findActivePageLink(pageId) {
    if (!pageId) return;
    var link = document.querySelector('.book-nav-chapter-link[href="#' + pageId + '"]');
    if (link) link.classList.add('active');
  }

  if ('IntersectionObserver' in window && headings.length === 0) {
    // No heading anchors — spy on page articles instead.
    var pages = Array.prototype.slice.call(document.querySelectorAll('.book-page'));
    pages.forEach(function (p) { spy.observe(p); });
  }

  // ── Active chapter ──────────────────────────────────────────────
  // The sidebar is a flat chapter list with no nested page links, so the
  // active chapter comes from the page article in view rather than from an
  // ancestor of the active link.
  var chapterEls = Array.prototype.slice.call(document.querySelectorAll('.book-nav-chapter'));
  var pageChapter = {};
  (DATA.pages || []).forEach(function (p) {
    pageChapter[p.id] = p.chapterLabel != null ? String(p.chapterLabel) : null;
  });

  function setActiveChapter(label) {
    if (label == null) return;
    chapterEls.forEach(function (li) {
      li.classList.toggle('active', li.getAttribute('data-chapter') === label);
    });
  }

  if ('IntersectionObserver' in window && chapterEls.length) {
    var chapterSpy = new IntersectionObserver(function (entries) {
      // Keep the chapter whose page starts highest in the band, so scrolling
      // across a boundary cannot flap the highlight between two chapters.
      var best = null;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (!best || (best.compareDocumentPosition(en.target) & Node.DOCUMENT_POSITION_FOLLOWING)) best = en.target;
      });
      if (!best) return;
      var label = pageChapter[best.id];
      if (label != null) setActiveChapter(label);
    }, { rootMargin: '-10% 0px -75% 0px' });
    Array.prototype.slice.call(document.querySelectorAll('.book-page'))
      .forEach(function (p) { chapterSpy.observe(p); });
  }

  // Tint on click: smooth scrolling would otherwise leave the previous
  // chapter highlighted until the target page entered the band.
  chapterEls.forEach(function (li) {
    var link = li.querySelector('.book-nav-chapter-link');
    if (!link) return;
    link.addEventListener('click', function () {
      chapterEls.forEach(function (other) { other.classList.remove('active'); });
      li.classList.add('active');
    });
  });

  // Re-collect nav links after any DOM mutation (search filtering etc.).
  setTimeout(function () { navLinks = collectNavLinks(); }, 0);

  // ── Search ──────────────────────────────────────────────────────
var searchInput = document.getElementById('book-search-input');
  var searchCount = document.getElementById('book-search-count');
  if (!searchCount) {
    searchCount = document.createElement('span');
    searchCount.id = 'book-search-count';
    searchCount.className = 'book-search-count';
  }
  var searchIndex = DATA.searchIndex || null;

  function normalize(s) { return String(s || '').toLowerCase(); }

function searchMatches(q) {
    // Compile-time index (whole book text, including code) when present;
    // falls back to a DOM text scan of the rendered pages. Both branches
    // return { id } so the caller can match against article ids.
    if (searchIndex && searchIndex.length) {
      return searchIndex.filter(function (p) {
        return normalize(p.text).indexOf(q) !== -1 || normalize(p.title).indexOf(q) !== -1;
      }).map(function (p) { return { id: p.pageId }; });
    }
    var pages = Array.prototype.slice.call(document.querySelectorAll('.book-page'));
    return pages.filter(function (page) {
      return normalize(page.textContent).indexOf(q) !== -1;
    }).map(function (page) { return { id: page.id }; });
  }

  // Highlight `q` in the target element, wrapping matches in <mark class="book-search-hit">.
  function highlightMatches(el, q) {
    if (!q || !el) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return normalize(node.nodeValue).indexOf(q) !== -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var re = new RegExp(escapeRegExp(q), 'gi');
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var rest = node.nodeValue;
      var m;
      while ((m = re.exec(rest)) !== null) {
        if (m.index > 0) frag.appendChild(document.createTextNode(rest.slice(0, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'book-search-hit';
        mark.textContent = m[0];
        frag.appendChild(mark);
        rest = rest.slice(m.index + m[0].length);
        re.lastIndex = 0;
      }
      if (rest) frag.appendChild(document.createTextNode(rest));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function escapeRegExp(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function clearHighlights() {
    var marks = Array.prototype.slice.call(document.querySelectorAll('mark.book-search-hit'));
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  // Highlight into a *clone* while typing, apply into the real DOM on Enter,
  // so keystrokes never thrash the text nodes.
if (searchInput && searchInput.parentElement) {
    // The count lives outside .book-search-field, so revealing it must not
    // move the icon. Appended to the label only if the markup lacked it.
    if (!searchCount.parentElement) searchInput.closest('.book-search').appendChild(searchCount);

searchInput.addEventListener('input', function () {
      var q = normalize(searchInput.value.trim());

      // Content-level matches via the index (or DOM fallback).
      var pageEls = Array.prototype.slice.call(document.querySelectorAll('.book-page'));
      var matches = q ? searchMatches(q) : [];
      var ids = new Set(matches.map(function (m) { return m.id; }));

      // A chapter stays in the nav when its own title matches OR when one of
      // its pages matched. Filtering the nav on titles alone would hide the
      // very chapter a body-text hit lives in.
      var hitChapters = new Set();
      ids.forEach(function (id) {
        var label = pageChapter[id];
        if (label != null) hitChapters.add(label);
      });

      // Nav / ToC filtering.
      var links = Array.prototype.slice.call(document.querySelectorAll(NAV_SEL));
      links.forEach(function (a) {
        var parent = a.closest('li');
        if (!parent) return;
        var ok = !q
          || normalize(a.textContent).indexOf(q) !== -1
          || (parent.classList.contains('book-nav-chapter')
              && hitChapters.has(parent.getAttribute('data-chapter')));
        parent.style.display = ok ? '' : 'none';
      });
      navLinks = links;

      pageEls.forEach(function (page) {
        var found = !q || ids.has(page.id);
        page.classList.toggle('book-page-match', found);
      });

      // Only dim non-matching pages when the query actually matched content
      // somewhere (avoids blanking the whole book on typos).
      var filtering = q && matches.length > 0;
      bookEl.classList.toggle('search-filtering', filtering);

      if (q) {
        searchCount.textContent = matches.length > 0
          ? matches.length + ' page' + (matches.length === 1 ? '' : 's') + ' match'
          : 'No matches';
        searchCount.classList.add('visible');
      } else {
        searchCount.classList.remove('visible');
        links.forEach(function (a) {
          var parent = a.closest('li');
          if (parent) parent.style.display = '';
        });
      }
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      clearHighlights();
      var q = normalize(searchInput.value.trim());
      if (!q) return;
      document.querySelectorAll('.book-page').forEach(function (page) {
        if (page.classList.contains('book-page-match')) highlightMatches(page, q);
      });
    });
}
})();
// Element image lightbox (GLightbox).
if (window.GLightbox && document.querySelector('.glightbox')) {
  window.bookLightbox = new window.GLightbox({
    selector: 'a.glightbox',
    loop: true,
    touchNavigation: true,
    keyboardNavigation: true,
  });
}
// Printing (Ctrl+P from a browser or a PDF render): open every collapsed
// <details> so solutions/details aren't hidden, then restore the reader's
// collapse state afterwards.
(function () {
  var opened = [];
  window.addEventListener('beforeprint', function () {
    opened = [];
    document.querySelectorAll('details:not([open])').forEach(function (d) {
      d.setAttribute('open', '');
      opened.push(d);
    });
  });
  window.addEventListener('afterprint', function () {
    opened.forEach(function (d) { d.removeAttribute('open'); });
    opened = [];
  });
})();
