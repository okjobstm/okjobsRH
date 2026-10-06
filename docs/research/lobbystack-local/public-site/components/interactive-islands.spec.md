# Interactive islands specification

## Overview

- Targets: pricing, calculator, FAQ, cookie preferences, search and voice demo.
- Interaction model: click/input/time-driven React islands plus CSS animation.

## States and behaviors

- Astro-generated island bootstraps and hashed JavaScript chunks are preserved without conversion.
- Calculator and pricing state update locally without Okjobs application state.
- Cookie preferences use browser storage.
- Search reads the bundled Pagefind index.
- Voice UI retains microphone and call states; successful calls still depend on the external LobbyStack live-call service and CORS policy.

## Responsive and accessibility

- Source touch targets, focus states, reduced-motion behavior and breakpoint rules remain intact.
