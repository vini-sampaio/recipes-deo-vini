// Vini & Deo Recipes: list with filters, recipe pages, servings scaling, suggestions.
// Routing uses the URL hash: "#" is the list, "#/recipe/<slug>" is a recipe page.
(function () {
  'use strict';

  var MEALS = ['All', 'Breakfast', 'Snack', 'Lunch', 'Dinner'];
  var PROTEINS = ['Chicken', 'Beef', 'Pork', 'Fish', 'Seafood', 'Eggs', 'Vegetarian'];
  var PREP_GROUPS = ['Marinade', 'Dressing', 'Sauce'];

  var state = { category: 'All', proteins: [], servings: null, lastSlug: null };
  var app = document.getElementById('app');
  var countEl = document.getElementById('count');

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function cats(r) { return r.cats || [r.category]; }
  function prots(r) { return r.prots || [r.protein]; }
  function meta(r) {
    if (r.metaText) return r.metaText;
    return r.time + ' min' + (r.note ? ' ' + r.note : '') + ' · ' + r.servings + (r.servings === 1 ? ' serving' : ' servings');
  }
  // Link to the original recipe page, labeled with the site's domain.
  function sourceHTML(url) {
    var host;
    try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { host = url; }
    return '<a class="source" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>' +
      'Recipe from ' + esc(host) + '<span class="sr-only"> (opens in a new tab)</span></a>';
  }
  // Meal tag, then one tag per protein (recipes with several proteins list them in prots).
  function tagsHTML(r) {
    var list = r.prots || [r.protein];
    return '<div class="tags"><span class="tag tag--meal">' + esc(r.category) + '</span>' +
      list.map(function (p) { return '<span class="tag tag--protein">' + esc(p) + '</span>'; }).join('') + '</div>';
  }
  function icon(protein, size) {
    var inner = window.PROTEIN_ICONS[protein] || '';
    return '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  // ---------- quantity scaling ----------
  var NUM = '(\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)';
  var LEAD = new RegExp('^((?:[A-Za-z ,]+: )?)' + NUM + '(?: to ' + NUM + ')?');
  function parse(s) {
    var m;
    if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3];
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2];
    return parseFloat(s);
  }
  function fmt(v) {
    var w = Math.floor(v + 0.001), f = v - w, best = [0, ''], d = 1;
    [[0, ''], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [3 / 4, '3/4'], [1, '']].forEach(function (c) {
      var e = Math.abs(f - c[0]); if (e < d) { d = e; best = c; }
    });
    if (d > 0.06) return (Math.round(v * 10) / 10).toString();
    if (best[0] === 1) { w += 1; best = [0, '']; }
    if (w === 0 && best[1]) return best[1];
    return best[1] ? w + ' ' + best[1] : String(w || 0);
  }
  function scale(t, k) {
    if (k === 1) return t;
    return t.replace(LEAD, function (all, pre, a, b) {
      return pre + fmt(parse(a) * k) + (b ? ' to ' + fmt(parse(b) * k) : '');
    });
  }

  // Split "Prefix: text" items into labeled groups.
  function group(items, isSteps) {
    var order = [], map = {};
    items.forEach(function (t) {
      var m = t.match(isSteps ? /^([A-Za-z ]+): (.*)$/ : /^([A-Za-z ,]+): (.*)$/);
      var key = m ? m[1] : '';
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(m ? m[2] : t);
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
      return { title: k ? k.charAt(0).toUpperCase() + k.slice(1) : (isSteps ? 'Meal' : 'Main ingredients'), main: !k, items: map[k], multi: seq.length > 1 };
    });
  }

  // ---------- views ----------
  function cardHTML(r, tall) {
    var media = r.image
      ? '<img src="' + esc(r.image) + '" alt="" loading="lazy">'
      : icon(prots(r)[0], 50);
    return '<a class="card" href="#/recipe/' + slug(r.name) + '">' +
      '<div class="card__media' + (tall ? ' card__media--tall' : '') + '" aria-hidden="true">' + media + '</div>' +
      '<div class="card__body">' +
      tagsHTML(r) +
      '<' + (tall ? 'h3' : 'h2') + ' class="card__title">' + esc(r.name) + '</' + (tall ? 'h3' : 'h2') + '>' +
      '<p class="meta">' + esc(meta(r)) + '</p>' +
      '</div></a>';
  }

  function visibleRecipes() {
    return window.RECIPES.filter(function (r) {
      var okCat = state.category === 'All' || cats(r).indexOf(state.category) > -1;
      var okProt = state.proteins.length === 0 || prots(r).some(function (p) { return state.proteins.indexOf(p) > -1; });
      return okCat && okProt;
    });
  }

  function renderList(focusSelector) {
    var list = visibleRecipes();
    countEl.textContent = list.length + (list.length === 1 ? ' recipe' : ' recipes');
    var mealChips = MEALS.map(function (c) {
      return '<button type="button" class="chip" data-meal="' + c + '" aria-pressed="' + (c === state.category) + '">' + c + '</button>';
    }).join('');
    var protChips = PROTEINS.map(function (p) {
      return '<button type="button" class="chip" data-protein="' + p + '" aria-pressed="' + (state.proteins.indexOf(p) > -1) + '">' + icon(p, 18) + p + '</button>';
    }).join('');
    var results = list.length
      ? '<div class="grid">' + list.map(function (r) { return cardHTML(r, false); }).join('') + '</div>'
      : '<div class="empty"><h2>Nothing matches yet</h2><p>Try another meal or fewer proteins.</p><button type="button" class="btn-primary" data-reset>Show all recipes</button></div>';

    app.innerHTML =
      '<div><h1 class="page-title">My recipes</h1><p class="page-intro">The dishes I keep coming back to. Pick a meal, then narrow it down by protein.</p></div>' +
      '<div class="layout">' +
      '<aside class="filters" aria-label="Filters">' +
      '<div class="filter-group"><span class="label">Meal</span><div class="chips" role="group" aria-label="Meal">' + mealChips + '</div></div>' +
      '<div class="filter-group"><div class="filter-head"><span class="label">Protein</span>' +
      (state.proteins.length ? '<button type="button" class="link-btn" data-clear>Clear</button>' : '') +
      '</div><div class="chips" role="group" aria-label="Protein">' + protChips + '</div></div>' +
      '</aside>' +
      '<div class="results">' + results + '</div>' +
      '</div>';

    if (focusSelector) {
      var el = app.querySelector(focusSelector);
      if (el) el.focus();
    }
  }

  function renderRecipe(r) {
    countEl.textContent = '';
    var base = r.servings || 1;
    var srv = state.servings || base;
    var k = srv / base;

    var ing = group(r.ingredients, false).map(function (g) {
      return '<div class="group' + (g.multi && !g.main ? ' group--boxed' : '') + '">' +
        (g.multi ? '<h4>' + esc(g.title) + '</h4>' : '') +
        '<ul>' + g.items.map(function (t) { return '<li>' + esc(scale(t, k)) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    var steps = group(r.steps, true).map(function (g) {
      return '<div class="group' + (g.multi && !g.main ? ' group--boxed' : '') + '">' +
        (g.multi ? '<h4>' + esc(g.title) + '</h4>' : '') +
        '<ol>' + g.items.map(function (t, i) { return '<li><span class="step-n" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>'; }).join('') + '</ol></div>';
    }).join('');

    var oc = cats(r), op = prots(r);
    var sugg = window.RECIPES.filter(function (x) {
      return x !== r && cats(x).some(function (c) { return oc.indexOf(c) > -1; });
    }).sort(function (a, b) {
      var sa = prots(a).some(function (p) { return op.indexOf(p) > -1; }) ? 0 : 1;
      var sb = prots(b).some(function (p) { return op.indexOf(p) > -1; }) ? 0 : 1;
      return sa - sb;
    }).slice(0, 3);

    app.innerHTML =
      '<article class="recipe">' +
      (r.image ? '<img class="recipe__hero" src="' + esc(r.image) + '" alt="' + esc(r.name) + '">' : '') +
      '<div class="recipe__body">' +
      '<a class="back" href="#"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>Back to recipes</a>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      tagsHTML(r) +
      '<h2 class="recipe__title" id="recipe-title" tabindex="-1">' + esc(r.name) + '</h2>' +
      '<p class="meta">' + esc(meta(r)) + '</p>' +
      '<div class="stepper" role="group" aria-label="Servings">' +
      '<button type="button" class="dec" data-srv="-1" aria-label="Fewer servings"' + (srv <= 1 ? ' disabled' : '') + '>−</button>' +
      '<output aria-live="polite">' + srv + (srv === 1 ? ' serving' : ' servings') + '</output>' +
      '<button type="button" class="inc" data-srv="1" aria-label="More servings">+</button>' +
      '</div></div>' +
      '<div class="columns">' +
      '<section class="col-ingredients"><h3>Ingredients</h3><div class="groups">' + ing + '</div></section>' +
      '<section class="col-steps"><h3>Instructions</h3><div class="groups">' + steps + '</div></section>' +
      '</div>' +
      (r.source ? '<footer class="recipe__source">' + sourceHTML(r.source) + '</footer>' : '') +
      '</div></article>' +
      (sugg.length ? '<section class="more" aria-labelledby="more-title"><h2 id="more-title">You might also like</h2><div class="grid">' +
        sugg.map(function (x) { return cardHTML(x, true); }).join('') + '</div></section>' : '');
  }

  // ---------- routing ----------
  function route() {
    var m = location.hash.match(/^#\/recipe\/(.+)$/);
    var r = m && window.RECIPES.find(function (x) { return slug(x.name) === m[1]; });
    if (r) {
      if (state.lastSlug !== m[1]) state.servings = null;
      state.lastSlug = m[1];
      renderRecipe(r);
      window.scrollTo(0, 0);
      var t = document.getElementById('recipe-title');
      if (t) t.focus({ preventScroll: true });
    } else {
      var from = state.lastSlug;
      state.lastSlug = null;
      renderList(from ? 'a.card[href="#/recipe/' + from + '"]' : null);
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
    else if (b.dataset.srv) {
      var m = location.hash.match(/^#\/recipe\/(.+)$/);
      var r = window.RECIPES.find(function (x) { return slug(x.name) === m[1]; });
      var cur = state.servings || r.servings || 1;
      state.servings = Math.min(24, Math.max(1, cur + Number(b.dataset.srv)));
      renderRecipe(r);
      var again = app.querySelector('[data-srv="' + b.dataset.srv + '"]');
      if (again && !again.disabled) again.focus();
    }
  });

  // Brand link resets everything.
  document.querySelector('.brand').addEventListener('click', function () {
    state.category = 'All'; state.proteins = []; state.lastSlug = null;
    if (location.hash === '' || location.hash === '#') renderList();
  });

  window.addEventListener('hashchange', route);
  route();
})();
