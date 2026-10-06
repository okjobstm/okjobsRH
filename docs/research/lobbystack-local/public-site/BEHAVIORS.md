# Public-site behaviors

## Navigation

- Sticky translucent header with blur and a scroll-linked bottom edge.
- Desktop grouped menus use native `details` disclosure with animated popovers.
- Mobile navigation becomes a full-width sheet below the header.
- Keyboard focus rings and native disclosure semantics are retained.

## Motion

- Fade-up, fade-in, slide-in-left, float and swap-in animations.
- Popover and sheet entrance animations use custom ease-out curves.
- Voice-demo rings, halo and pulse effects run continuously while applicable.
- `prefers-reduced-motion`, reduced-transparency and increased-contrast variants are retained.

## Interactive islands

- Pricing selection and billing controls update plan output in place.
- FAQ sections use animated accordions/disclosures.
- Missed-call calculator accepts inputs and updates revenue estimates.
- Cookie consent persists preferences locally and exposes a footer reopen action.
- Search uses the generated Pagefind index.
- Voice demo requests microphone access and calls the configured LobbyStack live-call endpoint; the copied interface is local, while that live service remains external.

## Responsive model

- Desktop: full navbar, multi-column section and footer layouts.
- Tablet: reduced column counts and spacing with the same content hierarchy.
- Mobile: menu sheet, stacked sections/cards, horizontally safe tables and touch-sized controls.
- Source breakpoints and generated media queries are preserved verbatim in the Astro CSS bundle.
