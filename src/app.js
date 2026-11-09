// Vini & Deo Recipes: list with filters, recipe pages, servings scaling, suggestions, EN/PT toggle.
// Routing uses the URL hash: "#" is the list, "#/recipe/<slug>" is a recipe page.
// Slugs always come from the English recipe name, so links work in both languages.
(function () {
  'use strict';

  var MEALS = ['All', 'Breakfast', 'Snack', 'Lunch', 'Dinner'];
  var PROTEINS = ['Chicken', 'Beef', 'Pork', 'Fish', 'Seafood', 'Eggs', 'Vegetarian'];
  // Prep sections shown before the main steps, in either language.
  var PREP_GROUPS = ['Marinade', 'Dressing', 'Sauce', 'Marinada', 'Molho', 'Molho da salada'];
  var LANG_KEY = 'recipes-lang';
  var DEFAULT_LANG = 'en';

  var state = { category: 'All', proteins: [], servings: null, lastSlug: null, focusBrand: false, lang: loadLang() };
  var app = document.getElementById('app');

  // ---------- language ----------
  // Languages come from the keys of window.I18N; English is the default.
  function loadLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      return Object.prototype.hasOwnProperty.call(window.I18N, saved) ? saved : DEFAULT_LANG;
    } catch (e) { return DEFAULT_LANG; }
  }
  function saveLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage blocked: the choice lasts for this visit */ }
  }
  function t(key) { return window.I18N[state.lang][key]; }
  // Meal and protein names (data values stay in English for filtering).
  function label(word) { return window.I18N[state.lang].labels[word] || word; }
  // Recipe text in the current language, falling back to English.
  function view(r) {
    var pt = state.lang === 'pt' && window.RECIPES_PT[r.name];
    return pt ? Object.assign({}, r, pt) : r;
  }
  function brandName() { return t('brandLines').join(' '); }
  function applyChrome() {
    document.documentElement.lang = t('htmlLang');
    document.title = brandName();
  }

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function cats(r) { return r.cats || [r.category]; }
  function prots(r) { return r.prots || [r.protein]; }
  function servingsText(n) { return n + ' ' + (n === 1 ? t('serving') : t('servings')); }
  function meta(r) {
    var v = view(r);
    if (v.metaText) return v.metaText;
    return r.time + ' min' + (v.note ? ' ' + v.note : '') + ' · ' + servingsText(r.servings);
  }
  // Link to the original recipe page, labeled with the site's domain.
  function sourceHTML(url) {
    var host;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { host = url; }
    return '<a class="source" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>' +
      esc(t('recipeFrom')) + esc(host) + '<span class="sr-only">' + esc(t('newTab')) + '</span></a>';
  }
  // Meal tag, then one tag per protein.
  function tagsHTML(r) {
    return '<div class="tags">' + cats(r).map(function (c) { return '<span class="tag tag--meal">' + esc(label(c)) + '</span>'; }).join('') +
      prots(r).map(function (p) { return '<span class="tag tag--protein">' + esc(label(p)) + '</span>'; }).join('') + '</div>';
  }
  function icon(protein, size) {
    var inner = window.PROTEIN_ICONS[protein] || '';
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (size >= 40 ? 0.5 : 1) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  // ---------- quantity scaling ----------
  // Amounts come first, after any "Prefix: ". Ranges use "to" (EN) or "a" (PT); decimals use "." or ",".
  var NUM = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?)';
  var LEAD = new RegExp('^((?:[\\p{L} ,]+: )?)' + NUM + '(?: (?:to|a) ' + NUM + ')?', 'u');
  function parse(s) {
    var m;
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3];
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2];
    return parseFloat(s.replace(',', '.'));
  }
  function fmt(v) {
    var w = Math.floor(v + 0.001), f = v - w, best = [0, ''], d = 1;
    [[0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [3 / 4, '3/4'], [1, '']].forEach(function (c) {
      var e = Math.abs(f - c[0]); if (e < d) { d = e; best = c; }
    });
    if (d > 0.06) {
      var dec = (Math.round(v * 10) / 10).toString();
      return state.lang === 'pt' ? dec.replace('.', ',') : dec;
    }
    if (best[0] === 1) { w += 1; best = [0, '']; }
    if (w === 0 && best[1]) return best[1];
    return best[1] ? w + ' ' + best[1] : String(w || 0);
  }
  function scale(text, k) {
    if (k === 1) return text;
    return text.replace(LEAD, function (all, pre, a, b) {
      return pre + fmt(parse(a) * k) + (b ? ' ' + t('to') + ' ' + fmt(parse(b) * k) : '');
    });
  }

  // Split "Prefix: text" items into labeled groups.
  function group(items, isSteps) {
    var order = [], map = {};
    items.forEach(function (s) {
      var m = s.match(isSteps ? /^([\p{L} ]+): (.*)$/u : /^([\p{L} ,]+): (.*)$/u);
      var key = m ? m[1] : '';
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(m ? m[2] : s);
    });
    var seq;
    if (isSteps) {
      var prep = order.filter(function (k) { return PREP_GROUPS.indexOf(k) > -1; });
      var rest = order.filter(function (k) { return k && prep.indexOf(k) < 0; });
      seq = prep.concat(map[''] ? [''] : []).concat(rest);
    } else {
      seq = order.slice();
      if (seq.indexOf('') > 0) { seq.splice(seq.indexOf(''), 1); seq.unshift(''); }
    }
    return seq.map(function (k) {
      return { title: k ? k.charAt(0).toUpperCase() + k.slice(1) : (isSteps ? t('stepsMain') : t('ingredientsMain')), main: !k, items: map[k], multi: seq.length > 1 };
    });
  }

  // ---------- views ----------
  // Brand lockup: one line per entry in brandLines, with the ampersand in italic.
  // The space between lines keeps the link's accessible name readable ("Deo & Vini Recipes").
  function brandHTML() {
    return '<a class="brand" href="#">' + t('brandLines').map(function (line) {
      return '<span class="brand__line">' + esc(line).replace(/&amp;/g, '<span class="brand__amp">&amp;</span>') + '</span>';
    }).join(' ') + '</a>';
  }
  // One button per language in window.I18N, labeled and tagged in its own language.
  function langToggleHTML() {
    return '<div class="lang-toggle" role="group" aria-label="' + esc(t('language')) + '">' +
      Object.keys(window.I18N).map(function (code) {
        var L = window.I18N[code];
        return '<button type="button" data-lang="' + esc(code) + '" lang="' + esc(L.htmlLang) + '" aria-pressed="' + (code === state.lang) + '">' + esc(L.short) + '</button>';
      }).join('') + '</div>';
  }

  function cardHTML(r, tall) {
    var v = view(r);
    var media = r.image
      ? '<img src="' + esc(r.image) + '" alt="" loading="lazy">'
      : icon(prots(r)[0], 50);
    return '<a class="card" href="#/recipe/' + slug(r.name) + '">' +
      '<div class="card__media' + (tall ? ' card__media--tall' : '') + (r.image ? ' card__media--photo' : '') + '" aria-hidden="true">' + media + '</div>' +
      '<div class="card__body">' +
      tagsHTML(r) +
      '<' + (tall ? 'h3' : 'h2') + ' class="card__title">' + esc(v.name) + '</' + (tall ? 'h3' : 'h2') + '>' +
      '<p class="meta">' + esc(meta(r)) + '</p>' +
      '</div></a>';
  }

  // ---------- time-of-day order ----------
  // The home list puts the next meal (Toronto time) first, then the meals after it, each group shuffled.
  // Before 7:00 breakfast, before 11:00 snack, before 13:00 lunch, before 16:00 snack, before 18:00 dinner, after that breakfast again.
  var SCHEDULE = [[7, 'Breakfast'], [11, 'Snack'], [13, 'Lunch'], [16, 'Snack'], [18, 'Dinner'], [24, 'Breakfast']];
  function torontoHour() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) { if (p.type === 'hour') h = +p.value; if (p.type === 'minute') m = +p.value; });
      return h + m / 60;
    } catch (e) { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  }
  function mealSequence() {
    var h = torontoHour(), i = 0;
    while (h >= SCHEDULE[i][0]) i++;
    var seq = [];
    for (var k = 0; k < SCHEDULE.length; k++) {
      var meal = SCHEDULE[(i + k) % SCHEDULE.length][1];
      if (seq.indexOf(meal) < 0) seq.push(meal);
    }
    return seq; // e.g. ['Lunch', 'Snack', 'Dinner', 'Breakfast']
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  // Built once per page load, so filtering or switching language does not reshuffle the cards.
  var ORDERED = (function () {
    var seq = mealSequence();
    var groups = seq.map(function () { return []; });
    window.RECIPES.forEach(function (r) {
      var best = Math.min.apply(null, cats(r).map(function (c) { var i = seq.indexOf(c); return i < 0 ? seq.length : i; }));
      (groups[best] || (groups[best] = [])).push(r);
    });
    return groups.reduce(function (all, g) { return all.concat(shuffle(g)); }, []);
  })();

  function visibleRecipes() {
    return ORDERED.filter(function (r) {
      var okCat = state.category === 'All' || cats(r).indexOf(state.category) > -1;
      var okProt = state.proteins.length === 0 || prots(r).some(function (p) { return state.proteins.indexOf(p) > -1; });
      return okCat && okProt;
    });
  }

  function renderList(focusSelector) {
    var list = visibleRecipes();
    var mealChips = MEALS.map(function (c) {
      return '<button type="button" class="chip" data-meal="' + c + '" aria-pressed="' + (c === state.category) + '">' + esc(label(c)) + '</button>';
    }).join('');
    var protChips = PROTEINS.map(function (p) {
      return '<button type="button" class="chip" data-protein="' + p + '" aria-pressed="' + (state.proteins.indexOf(p) > -1) + '">' + icon(p, 18) + esc(label(p)) + '</button>';
    }).join('');
    var results = list.length
      ? '<div class="grid">' + list.map(function (r) { return cardHTML(r, false); }).join('') + '</div>'
      : '<div class="empty"><h2>' + esc(t('emptyTitle')) + '</h2><p>' + esc(t('emptyText')) + '</p><button type="button" class="btn-primary" data-reset>' + esc(t('showAll')) + '</button></div>';

    app.innerHTML =
      '<h1 class="visually-hidden">' + esc(t('myRecipes')) + '</h1>' +
      '<div class="layout layout--home">' +
      '<div class="sidebar">' + brandHTML() + '<hr class="divider">' +
      '<aside class="filters" aria-label="' + esc(t('filters')) + '">' +
      '<div class="filter-group"><span class="label">' + esc(t('meal')) + '</span><div class="chips" role="group" aria-label="' + esc(t('meal')) + '">' + mealChips + '</div></div>' +
      '<div class="filter-group"><div class="filter-head"><span class="label">' + esc(t('protein')) + '</span>' +
      (state.proteins.length ? '<button type="button" class="link-btn" data-clear>' + esc(t('clear')) + '</button>' : '') +
      '</div><div class="chips" role="group" aria-label="' + esc(t('protein')) + '">' + protChips + '</div></div>' +
      '</aside>' +
      '<hr class="divider">' + langToggleHTML() +
      '</div>' +
      '<div class="results">' + results + '</div>' +
      '</div>';

    if (focusSelector) {
      var el = app.querySelector(focusSelector);
      if (el) el.focus();
    }
  }

  function renderRecipe(r) {
    var v = view(r);
    var base = r.servings || 1;
    var srv = state.servings || base;
    var k = srv / base;

    var ing = group(v.ingredients, false).map(function (g) {
      return '<div class="group' + (g.multi && !g.main ? ' group--boxed' : '') + '">' +
        (g.multi ? '<h4>' + esc(g.title) + '</h4>' : '') +
        '<ul>' + g.items.map(function (s) { return '<li>' + esc(scale(s, k)) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    var steps = group(v.steps, true).map(function (g) {
      return '<div class="group' + (g.multi && !g.main ? ' group--boxed' : '') + '">' +
        (g.multi ? '<h4>' + esc(g.title) + '</h4>' : '') +
        '<ol>' + g.items.map(function (s, i) { return '<li><span class="step-n" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>'; }).join('') + '</ol></div>';
    }).join('');

    var oc = cats(r), op = prots(r);
    var sugg = window.RECIPES.filter(function (x) {
      return x !== r && cats(x).some(function (c) { return oc.indexOf(c) > -1; });
    }).sort(function (a, b) {
      var sa = prots(a).some(function (p) { return op.indexOf(p) > -1; }) ? 0 : 1;
      var sb = prots(b).some(function (p) { return op.indexOf(p) > -1; }) ? 0 : 1;
      return sa - sb;
    }).slice(0, 3);

    // DOM order is brand, recipe, suggestions (the order on small screens and for keyboard users);
    // on wide screens the grid puts the suggestions in the left column under the brand.
    app.innerHTML =
      '<div class="layout layout--recipe">' +
      '<div class="sidebar">' + brandHTML() + '</div>' +
      '<div class="detail">' +
      '<a class="back" href="#"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>' + esc(t('back')) + '</a>' +
      '<article class="recipe">' +
      (r.image ? '<img class="recipe__hero" src="' + esc(r.image) + '" alt="' + esc(v.name) + '">' : '') +
      '<div class="recipe__body">' +
      '<div class="recipe__head">' +
      tagsHTML(r) +
      '<h2 class="recipe__title" id="recipe-title" tabindex="-1">' + esc(v.name) + '</h2>' +
      '<p class="meta">' + esc(meta(r)) + '</p>' +
      '<div class="stepper" role="group" aria-label="' + esc(t('servingsGroup')) + '">' +
      '<button type="button" class="dec" data-srv="-1" aria-label="' + esc(t('fewer')) + '"' + (srv <= 1 ? ' disabled' : '') + '>−</button>' +
      '<output aria-live="polite">' + esc(servingsText(srv)) + '</output>' +
      '<button type="button" class="inc" data-srv="1" aria-label="' + esc(t('more')) + '">+</button>' +
      '</div></div>' +
      '<div class="columns">' +
      '<section class="col-ingredients"><h3>' + esc(t('ingredients')) + '</h3><div class="groups">' + ing + '</div></section>' +
      '<section class="col-steps"><h3>' + esc(t('instructions')) + '</h3><div class="groups">' + steps + '</div></section>' +
      '</div>' +
      (r.source ? '<footer class="recipe__source">' + sourceHTML(r.source) + '</footer>' : '') +
      '</div></article>' +
      '</div>' +
      (sugg.length ? '<section class="more" aria-labelledby="more-title"><h2 id="more-title">' + esc(t('alsoLike')) + '</h2><div class="grid">' +
        sugg.map(function (x) { return cardHTML(x, true); }).join('') + '</div></section>' : '') +
      '</div>';
  }

  // ---------- routing ----------
  function currentRecipe() {
    var m = location.hash.match(/^#\/recipe\/(.+)$/);
    return m && window.RECIPES.find(function (x) { return slug(x.name) === m[1]; });
  }
  function route() {
    var r = currentRecipe();
    if (r) {
      var s = slug(r.name);
      if (state.lastSlug !== s) state.servings = null;
      state.lastSlug = s;
      renderRecipe(r);
      window.scrollTo(0, 0);
      var title = document.getElementById('recipe-title');
      if (title) title.focus({ preventScroll: true });
    } else {
      var from = state.lastSlug;
      state.lastSlug = null;
      // Back from a recipe: focus its card. Home through the brand: keep focus on the brand.
      var focus = state.focusBrand ? '.brand' : (from ? 'a.card[href="#/recipe/' + from + '"]' : null);
      state.focusBrand = false;
      renderList(focus);
    }
  }

  // ---------- events ----------
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button, a');
    if (!b) return;
    if (b.dataset.meal) { state.category = b.dataset.meal; renderList('[data-meal="' + b.dataset.meal + '"]'); }
    else if (b.dataset.protein) {
      var p = b.dataset.protein, i = state.proteins.indexOf(p);
      if (i > -1) state.proteins.splice(i, 1); else state.proteins.push(p);
      renderList('[data-protein="' + p + '"]');
    }
    else if (b.hasAttribute('data-clear')) { state.proteins = []; renderList('[data-protein="Chicken"]'); }
    else if (b.hasAttribute('data-reset')) { state.category = 'All'; state.proteins = []; renderList(); }
    else if (b.dataset.lang) {
      // Language toggle: re-render the current view in place and keep focus on the toggle.
      if (b.dataset.lang === state.lang) return;
      state.lang = b.dataset.lang;
      saveLang(state.lang);
      applyChrome();
      var shown = currentRecipe();
      if (shown) renderRecipe(shown); else renderList();
      var pressed = app.querySelector('[data-lang="' + state.lang + '"]');
      if (pressed) pressed.focus();
    }
    else if (b.classList.contains('brand')) {
      // The brand resets the filters and shows the full list.
      state.category = 'All'; state.proteins = []; state.lastSlug = null;
      if (currentRecipe()) { state.focusBrand = true; } // the hash change renders the list
      else { e.preventDefault(); renderList('.brand'); window.scrollTo(0, 0); }
    }
    else if (b.dataset.srv) {
      var r = currentRecipe();
      var cur = state.servings || r.servings || 1;
      state.servings = Math.min(24, Math.max(1, cur + Number(b.dataset.srv)));
      renderRecipe(r);
      var again = app.querySelector('[data-srv="' + b.dataset.srv + '"]');
      if (again && !again.disabled) again.focus();
    }
  });

  window.addEventListener('hashchange', route);
  applyChrome();
  route();
})();
