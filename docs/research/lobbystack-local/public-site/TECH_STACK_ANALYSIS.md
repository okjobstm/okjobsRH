# Technical stack analysis

## LobbyStack public site

- Astro 7 static site generation.
- React 19 islands.
- Tailwind CSS 4, shadcn-style primitives and Lucide icons.
- Astro Content collections for 26 blog posts and five changelog entries per locale.
- Four locales: English at the root, plus French, Spanish and Serbian prefixes.
- Pagefind for static search; generated sitemap, feed, OpenAPI and discovery endpoints.

## Okjobs

- Next.js 15 App Router, React 19 and strict TypeScript.
- Tailwind CSS 4 with application-specific tokens.
- Supabase Google authentication protecting `/admin/**`.
- Public tokenized candidate flows under `/apply/**`.

## Integration choice

Embedding the compiled Astro documents gives stronger fidelity and isolation than porting `.astro` templates to React. Exact rewrites keep original public URLs while an explicit deny list protects Okjobs authentication, private application, APIs and candidate routes.
