# Layout architecture

- Astro file-based routing in `src/pages` with a shared `main.astro` layout.
- React is used only for interactive islands; most page structure renders to static HTML.
- Tailwind CSS 4 produces a single source-controlled responsive system.
- Containers use centered max widths and six-unit side padding, with multi-column grids collapsing at source breakpoints.
- The copied documents are served directly and therefore do not inherit Okjobs' Next.js root layout, fonts or global CSS.
