# To Do Capture website

Independent bilingual homepage for the [Microsoft To Do browser extension](https://github.com/WayneGongCN/microsoft-todo-browser-ext).

Production: **https://microsoft-todo-capture-site.vercel.app**

## Development

Node.js 22 or later. The production site has no runtime dependencies and serves static HTML, CSS and JavaScript.

```sh
npm ci
npm run build
npm run dev
```

Local preview: http://127.0.0.1:4178. Edit localized copy in `src/content.mjs`, page structure in `src/render.mjs`, and presentation/interaction in `src/assets/`. Run the build again after editing.

```sh
npx playwright install chromium
npm run check
```

Checks cover static SEO metadata, localized content, analytics data filtering, the interactive demo, narrow layouts, accessibility, consent and Global Privacy Control. `node scripts/generate-og.mjs` regenerates the committed 1200 × 630 sharing image.

## Product state and publication

This site deliberately describes V2 as in development. Its demo uses local sample data and never logs in or creates tasks. No install/download CTA, rating or release date is invented. Update copy in both languages when the extension is verified and released. Keep the extension repository separate from this website.

Vercel builds `main` with `npm run build` and serves `dist/`. `vercel.json` declares the output, security headers and immutable caching for content-fingerprinted assets. Preview builds emit `noindex,nofollow` and a disallowing robots file. Production builds are indexable. When changing the production domain, update `src/config.mjs` and redeploy so the canonical, hreflang, sitemap, Open Graph and analytics host stay consistent.

Routes: `/`, `/zh/`, `/privacy/`, `/zh/privacy/`. Unknown paths return HTTP 404. All main content is present without JavaScript. Reciprocal `en`, `zh-CN` and `x-default` alternates are paired with self-referencing canonicals; schema.org metadata describes the site and the app’s development state. The sitemap contains only real production routes. Search discovery and ranking are controlled by search engines; deployment does not prove index inclusion.

## Analytics

The original homepage stream is retained: GA4 property `298798570`, stream `3193804945`, measurement ID `G-QR2Z39S77X`. It is distinct from the extension’s own GA resource.

Analytics load only after opt-in on the configured production hostname. Preview/local visits do not collect. Global Privacy Control overrides a previous opt-in. Visitors can withdraw from the footer. Advertising features are disabled. Manual page views are sent once per page; analytics URLs exclude query strings/fragments and referrers contain only the origin.

| Event | Parameters | Meaning |
| --- | --- | --- |
| `page_view` | `site_language`, `page_type` | One consented page view |
| `project_click` | `cta_location` | Interest in the GitHub project, not an installation |
| `website_source_click` | `cta_location` | Website source click |
| `demo_open` | `cta_location` | Hero demo link click |
| `demo_mode_select` | `capture_type` | Page, selection or link preview |
| `demo_complete` | `capture_type` | Demonstration completed, not a real task saved |
| `faq_expand` | `faq_id` | One of five predefined FAQ questions opened |
| `language_switch` | `target_language` | Language navigation |

Every interaction also includes `site_language`, `page_type` and a cleaned page location. Parameters are allowlisted fixed values. No notes, selections, task titles, user IDs or Microsoft account information are sent. No events are replayed from before consent. `_ga` cookies are cleared on withdrawal.

Custom parameters must be registered as event-scoped dimensions in GA4 to use them in standard explorations: `site_language`, `page_type`, `capture_type`, `cta_location`, `faq_id`, `target_language`. Registration requires Analytics Editor access and an edit-scoped OAuth connection. Event collection and event-name reports work without dimension registration. Do not mark `demo_complete` as an installation conversion.

For DebugView, a consented production visit may use `?analytics_debug=1`; this parameter is stripped from the reported page address. Browser test fixtures intercept Google requests so CI does not add real traffic. The existing stream’s automatic enhanced-measurement settings should be checked when changing navigation behavior to avoid history-based duplicate page views.

## License

MIT. Microsoft and Microsoft To Do are trademarks of Microsoft. This independent project is not affiliated with or endorsed by Microsoft.
