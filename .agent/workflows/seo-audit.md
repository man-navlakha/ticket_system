---
description: Perform a basic SEO audit and maintenance check
---

# SEO Audit Workflow

This workflow checks for essential SEO elements in the Next.js application.

## 1. Check Metadata
Ensure `app/layout.js` (or page-specific layouts) contains:
- [ ] `title` (with template)
- [ ] `description` (unique per page if possible)
- [ ] `keywords`
- [ ] `openGraph` configuration
- [ ] `twitter` card configuration

## 2. Check Structural Elements
- [ ] `app/sitemap.js` exists and is up to date with new routes.
- [ ] `app/robots.js` exists and allows indexing of content pages.
- [ ] `app/favicon.ico` or `app/icon.png` is present.

## 3. Component & Content Audit
- [ ] **Images**: All `Image` components must have descriptive `alt` text.
- [ ] **Headings**: Only one `<h1>` per page. proper `<h2>` - `<h6>` hierarchy.
- [ ] **Semantic Tags**: Use `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` appropriately.

## 4. Structured Data (JSON-LD)
- [ ] Check `app/page.js` (and other key pages) for `<script type="application/ld+json">`.
- [ ] Validate structure using [Google's Rich Results Test](https://search.google.com/test/rich-results).

## 5. Performance (Core Web Vitals)
- [ ] Run `npm run build` to check for build errors.
- [ ] Use Chrome DevTools Lighthouse to check Performance score.
