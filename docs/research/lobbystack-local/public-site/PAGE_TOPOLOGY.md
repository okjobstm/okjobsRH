# Page topology

## Shared shell

1. Skip link.
2. Sticky translucent navbar with desktop navigation, grouped popovers, GitHub link, login CTA and signup CTA.
3. Route-specific content.
4. Footer with product/resources/company columns, language switcher, legal links and cookie-preference trigger.
5. Cookie consent sheet.

## Page families

- Home: hero, voice demo, product proof, workflow, use cases, pricing preview, FAQ and CTA.
- Features: feature hero, feature wall, included-on-every-plan grid and CTA.
- Pricing: pricing controls/cards, comparisons, FAQ and CTA.
- Solutions index and detailed solution pages: stacked hero, proof sections, call timelines/diagrams, FAQ and CTA.
- Trades and generated SEO landing pages: reusable localized SEO template with trade-specific copy and imagery.
- Blog index and posts: card index and long-form article template.
- Changelog: localized entry feed.
- Calculator: missed-call revenue calculator, result cards and FAQ.
- Affiliate program: benefits, process, FAQ and CTA.
- About, API docs, search and legal pages.
- Localized equivalents under `/fr`, `/es` and `/sr`.

## Layering and flow

- The navbar is sticky at the top and establishes the highest normal-page layer.
- Navigation popovers and the mobile sheet overlay page content.
- Main sections remain in normal document flow with responsive max-width containers.
- Cookie controls are fixed above page content.
- Interactive React islands hydrate independently inside otherwise static Astro documents.
