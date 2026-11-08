# Vini's Kitchen

A personal recipe book. The look takes inspiration from HelloFresh: fresh greens, lots of white space, rounded cards and friendly, plain-spoken copy. It uses its own name and no HelloFresh logos or assets.

## Content fundamentals
- Recipe names are short and appetizing: "Garlic Butter Chicken", not "Recipe #4".
- Meta reads at a glance: "25 min · 2 servings".
- Speak like a friend in the kitchen. Sentence case everywhere.

## Visual foundations
- Primary color is `green-700`; use it for actions and selected filters. `lime-400` is an accent only, always with `ink` text.
- Page sits on `surface-alt`, cards on `surface` with `radius-md` and `shadow-card`.
- Headings use the display family (Poppins), body uses Source Sans 3, both from Google Fonts.

## Organizing recipes
- **Meal category** (single select): All, Breakfast, Snack, Lunch, Dinner.
- **Protein** (multi select chips): Chicken, Beef, Pork, Fish, Seafood, Eggs, Vegetarian.
- Both filters combine. See the RecipesPage component for the full page.

## Iconography
No icon set yet; food photos carry the visuals. A missing photo shows a `lime-100` tile with the recipe's initial.
