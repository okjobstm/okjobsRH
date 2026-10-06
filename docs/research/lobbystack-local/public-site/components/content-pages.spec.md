# Content page families specification

## Overview

- Targets: home, features, pricing, solutions, SEO/trade pages, blog, changelog, about, docs, legal and affiliate pages.
- Interaction model: primarily static documents with hover/focus states and disclosure islands.

## Structure and content

- The original Astro templates, localized source copy, content collections and generated page hierarchy are the source of truth.
- No text, color, spacing or section order is transformed during import.

## Styles

- All exact styles remain in the generated hashed CSS bundles under `/_astro/`.
- Long-form pages preserve legal/blog/changelog typography, responsive tables and max-width rules.

## Assets

- All source public assets and generated optimized assets are copied into the standalone bundle.

## Responsive behavior

- The source desktop, tablet and mobile media queries are shipped unchanged.
