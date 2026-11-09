# Vini's Kitchen

A personal recipe book. The look takes inspiration from HelloFresh: fresh greens, lots of white space, rounded cards and friendly, plain-spoken copy. It uses its own name and no HelloFresh logos or assets.

## Content fundamentals
- Recipe names are short and appetizing: "Garlic Butter Chicken", not "Recipe #4".
- Meta reads at a glance: "25 min · 2 servings".
- Speak like a friend in the kitchen. Sentence case everywhere.

## Visual foundations
- Primary color is `green-700`; use it for actions and selected filters. `lime-400` is an accent only, always with `ink` text.
- Page sits on `surface-alt`, cards on `surface` with `radius-md` and `shadow-card`.
- Headings use the display family (Instrument Serif, Regular only), body uses Inter Light (300), both from Google Fonts. The only italic is the ampersand in the brand.
- There is no top bar. Both pages have a sidebar card (`sidebar-width`, 300px) on the left: on the home page it holds the brand, the filters and the EN/PT toggle, split by thin `border` dividers; on a recipe page it holds the brand, with "You might also like" below it. On small screens everything stacks, and the suggestions move under the recipe.
- Use the tokens for color, type, spacing and sizes instead of raw values, and add a token when one is missing.

## Organizing recipes
- **Meal category** (single select): All, Breakfast, Snack, Lunch, Dinner.
- **Protein** (multi select chips): Chicken, Beef, Pork, Fish, Seafood, Eggs, Vegetarian.
- Both filters combine. See the RecipesPage component for the full page.

## Iconography
No icon set yet; food photos carry the visuals. A missing photo shows a `lime-100` tile with the recipe's initial.
