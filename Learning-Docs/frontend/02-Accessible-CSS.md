# 🎨 Learning: Accessible & Vanilla CSS

## What is it?
For this project, we explicitly avoided heavy CSS frameworks (like Tailwind or Bootstrap) and complex animation libraries. Instead, we used **Vanilla CSS** with a heavy focus on **CSS Variables** (`:root`) and **Accessibility (a11y)**.

## Why did we use it in the CTC App?
You requested an interface that is "simple, clear, readable for even under-educated people" and completely mobile-compatible without vivid colors.
- **CSS Variables (`--primary-color`)**: Instead of hardcoding colors like `#1a365d` everywhere, we define them once in `:root`. If we ever need to change the brand color, we change it in one place, and the whole app updates.
- **Accessibility (a11y)**: 
  - We used a high-contrast palette (Navy Blue on Light Gray).
  - We made the base font size large (`18px`).
  - We made all buttons and inputs at least `48px` tall (specifically `56px` in our code) because Apple and Google's mobile guidelines state that touch targets must be large enough for a thumb to tap easily.
- **Vanilla CSS**: Keeping it vanilla means less JavaScript payload for the user to download, making the app faster on slow 3G/4G networks.

## How the Code Works
Take a look at `index.css`:
```css
:root {
  --primary-color: #1a365d;
  --spacing-md: 16px;
  /* ... */
}

.btn-primary {
  background-color: var(--primary-color);
  min-height: 56px; /* Massive touch target */
  padding: var(--spacing-md);
}
```
We use these classes (`.btn-primary`, `.input-group`, `.card`) across all our React components (`Home.jsx`, `Login.jsx`, etc.). Because they are globally defined in `index.css`, we don't have to rewrite the styling logic for every new page.

## How to Learn It
1. **CSS Variables**: Check out MDN's guide on [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties).
2. **Accessibility**: Read the [Web Content Accessibility Guidelines (WCAG) summary](https://www.w3.org/WAI/standards-guidelines/wcag/). Focus on contrast ratios and interactive element sizing.
3. **Mobile-First CSS**: Learn about CSS Flexbox (`display: flex`) which we used heavily to stack elements vertically and center them gracefully. Flexbox Froggy is a great game to learn this.
