# Vini & Deo Recipes

Personal recipe site. Plain HTML, CSS and JavaScript, no build step. Open `index.html` in a browser, or serve the folder (`npx serve .`).

## Files
- `index.html`: page shell (header, `<main id="app">`), loads fonts and scripts.
- `src/recipes.js`: all recipe data (`window.RECIPES`). Most changes happen here.
- `src/app.js`: rendering, filters, hash routing (`#/recipe/<slug>`), servings scaling, suggestions.
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
  ingredients: ['1 lb chicken', 'Marinade: 3 tbsp olive oil', ...],
  steps: ['Marinade: Combine ...', 'Grill the chicken ...', 'Side: Roast ...'] }
```
- Meals: Breakfast, Snack, Lunch, Dinner. Proteins: Chicken, Beef, Pork, Fish, Seafood, Eggs, Vegetarian.
- A `Prefix: ` on an ingredient or step puts it in a labeled section (Marinade, Sauce, Dressing, Side, Optional, To serve, "Carb, pick one"). In steps, Marinade/Dressing/Sauce come before the main "Meal" steps and other sections come after.
- Servings scaling only changes the number at the start of an ingredient (after any prefix). Write amounts first: "2 tbsp olive oil", not "Olive oil, 2 tbsp".
- Use grams instead of ounces. Translate recipes to English.

## Design rules (from the design system)
- Use the CSS variables in `src/tokens.css`, never raw hex in new styles.
- Primary: `--green-700` for actions and selected chips. `--lime-400` is an accent and always takes `--ink` text.
- Page on `--surface-alt`, cards on `--surface` with `--radius-md` and `--shadow-card`.
- Headings in Poppins (`--font-display`), body in Source Sans 3 (`--font-sans`). Sentence case everywhere.
- Icons: Lucide only, stroke width 1, no emoji.
- Never use em dashes in copy.

## Accessibility (keep these)
- Text contrast 4.5:1; control outlines 3:1 (`--border-strong`).
- Real `<button>` and `<a>` elements, visible focus ring, `aria-pressed` on filter chips.
- Opening a recipe moves focus to its title; going back returns focus to the card.
- Honor `prefers-reduced-motion`.
