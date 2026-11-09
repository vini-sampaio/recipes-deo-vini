# Vini & Deo Recipes

Personal recipe site. Plain HTML, CSS and JavaScript, no build step. Open `index.html` in a browser, or serve the folder (`npx serve .`).

## Files
- `index.html`: page shell (`<main id="app">`), loads fonts and scripts. There is no header: the brand, filters and EN/PT toggle render in the sidebar from `src/app.js`.
- `src/recipes.js`: all recipe data (`window.RECIPES`). Most changes happen here.
- `src/app.js`: rendering, filters, hash routing (`#/recipe/<slug>`), servings scaling, suggestions.
- `src/i18n.js`: interface text in English and Brazilian Portuguese (`window.I18N`) and Portuguese recipe versions (`window.RECIPES_PT`, keyed by the English name). The EN/PT toggle at the bottom of the home sidebar switches language; English is the default and the choice is saved in localStorage. Each language also sets `short` (its toggle label), `htmlLang` and `brandLines` (the two lines of the brand).
- `src/icons.js`: Lucide protein icons (inner SVG markup), stroke width 1.
- `src/tokens.css`: design tokens as CSS variables. `src/styles.css`: all component styles.
- `design-system/`: the Vini's Kitchen design system source (`tokens.json`, `README.md`).

## Recipe format
```js
{ name: 'Greek chicken bowls',        // sentence case, short
  category: 'Lunch · Dinner',          // label shown on the tag
  cats: ['Lunch', 'Dinner'],           // optional: several meals for filtering
  protein: 'Chicken',                  // label shown on the tag
  prots: ['Chicken', 'Fish'],          // optional: several proteins for filtering
  time: 25, servings: 4,               // minutes, base servings
  note: 'plus marinating',             // optional, appended to the time
  metaText: 'Build your own · 1 serving', // optional, replaces time/servings line
  image: 'images/greek-bowls.jpg',     // optional, otherwise the protein icon shows
  source: 'https://example.com/recipe', // optional, link to the original recipe
  ingredients: ['1 lb chicken', 'Marinade: 3 tbsp olive oil', ...],
  steps: ['Marinade: Combine ...', 'Grill the chicken ...', 'Side: Roast ...'] }
```
- Meals: Breakfast, Snack, Lunch, Dinner. Proteins: Chicken, Beef, Pork, Fish, Seafood, Eggs, Vegetarian.
- A `Prefix: ` on an ingredient or step puts it in a labeled section (Marinade, Sauce, Dressing, Side, Optional, To serve, "Carb, pick one"). In steps, Marinade/Dressing/Sauce come before the main "Meal" steps and other sections come after.
- Servings scaling only changes the number at the start of an ingredient (after any prefix). Write amounts first: "2 tbsp olive oil", not "Olive oil, 2 tbsp".
- Use grams instead of ounces. Translate recipes to English.
- Every recipe also needs a Brazilian Portuguese entry in `src/i18n.js` with `name`, `ingredients`, `steps` (and `note`/`metaText` if used). Keep amounts first, use `a` for ranges ("1 a 2"), `xíc.`, `col. (sopa)`, `col. (chá)`, and Portuguese section prefixes: Molho, Marinada, Molho da salada, Acompanhamento, Opcional, Para servir, "Carboidrato, escolha um". Temperatures in °C.

## Design rules (from the design system)
- Use the tokens in `src/tokens.css` for color, type, spacing and sizes, never raw hex or px values in new styles; add a token when one is missing. Keep text in `src/i18n.js` and recipe content in `src/recipes.js`, not in markup.
- Layout: a 300px sidebar card (`--sidebar-width`) beside the content. Home sidebar: brand, divider, filters, divider, EN/PT toggle. Recipe page: brand card with "You might also like" below it; on small screens the suggestions move under the recipe.
- Primary: `--green-700` for actions and selected chips. `--lime-400` is an accent and always takes `--ink` text.
- Page on `--surface-alt`, cards on `--surface` with `--radius-md` and `--shadow-card`.
- Headings in Instrument Serif Regular (`--font-display`, weight 400 only), body in Inter Light 300 (`--font-sans`, weight 300 only). The only italic is the ampersand in the brand. Sentence case everywhere.
- Icons: Lucide only, stroke width 1, no emoji.
- Never use em dashes in copy.

## Accessibility (keep these)
- Text contrast 4.5:1; control outlines 3:1 (`--border-strong`).
- Real `<button>` and `<a>` elements, visible focus ring, `aria-pressed` on filter chips.
- Opening a recipe moves focus to its title; going back returns focus to the card.
- Honor `prefers-reduced-motion`.
