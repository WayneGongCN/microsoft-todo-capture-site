# To Do Capture website

Independent bilingual homepage for the [Microsoft To Do browser extension](https://github.com/WayneGongCN/microsoft-todo-browser-ext).

Production: **https://todo-ext.waynegong.com**

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

Checks cover static SEO metadata, localized content, the installation link, narrow layouts, accessibility, consent and Global Privacy Control. `node scripts/generate-og.mjs` regenerates the committed 1200 × 630 sharing image.

## Chrome Web Store assets

Use [`store-assets/`](store-assets/) as the source for store listing uploads and extension icons. The storefront uses one set of promotional images and can display screenshots by manifest locale. See [Chrome Web Store image guidelines](https://developer.chrome.com/docs/webstore/images).

| Dashboard field | File | Size |
| --- | --- | --- |
| Store icon | [todo-128.png](store-assets/icons/todo-128.png) | 128 × 128 |
| Small promo tile | [small-tile.png](store-assets/promotional/small-tile.png) | 440 × 280 |
| Marquee promo tile | [marquee.png](store-assets/promotional/marquee.png) | 1400 × 560 |
| Global screenshots | [English capture and settings](store-assets/screenshots/en/) | 1280 × 800 |
| Localized screenshots for Simplified Chinese | [`zh_CN` capture](store-assets/screenshots/zh_CN/) | 1280 × 800 |

The canonical brand mark is [`public/favicon.svg`](public/favicon.svg). Run `npm run store:assets` after changing the mark or the promotional layout in [`scripts/generate-store-assets.mjs`](scripts/generate-store-assets.mjs). The command uses Playwright Chromium and refreshes the 16, 24, 32, 48 and 128 px extension icons and both promo tiles. The 128 px export contains a 96 px mark with 16 px transparent padding on each side.

Update screenshots from the matching extension build using sample data. Keep them in display order by filename and export them as 24-bit RGB PNGs. The current screenshots show the capture and settings UI in the 2.0.1 release candidate. Store uploads use the files from this directory, which lives outside the website's public build.

## Product state and publication

The English and Chinese homepages describe the three capture modes and link to the Chrome Web Store listing. Update `extensionVersion` in `src/config.mjs` after verifying a new store release.

Vercel builds the site with `npm run build` and serves `dist/`. `vercel.json` declares the output, security headers and immutable caching for content-fingerprinted assets. Preview builds emit `noindex,nofollow` and a disallowing robots file. Production builds are indexable. When changing the production domain, update `src/config.mjs` and redeploy so the canonical, hreflang, sitemap, Open Graph and analytics host stay consistent.

Routes: `/`, `/zh/`, `/privacy/`, `/zh/privacy/`. Unknown paths return HTTP 404. All main content is present without JavaScript. Reciprocal `en`, `zh-CN` and `x-default` alternates are paired with self-referencing canonicals. Schema.org metadata includes the extension version and installation URL. The sitemap contains only real production routes. Search discovery and ranking are controlled by search engines; deployment does not prove index inclusion.

The Vercel production homepage publishes the Google Search Console ownership tag. Keep it in `scripts/build.mjs` for ongoing verification. Bing Webmaster Tools imports the verified site and its sitemap through the existing Search Console connection. If the production hostname changes, verify the new URL-prefix property, submit its `/sitemap.xml`, and import the new property into Bing.

## Analytics

The original homepage stream is retained: GA4 property `298798570`, stream `3193804945`, measurement ID `G-QR2Z39S77X`. It is distinct from the extension’s own GA resource.

Analytics load only after opt-in on the custom domain and the original Vercel hostname. Preview/local visits do not collect. Global Privacy Control overrides a previous opt-in. Visitors can withdraw from the footer. Advertising features are disabled. Manual page views are sent once per page; analytics URLs exclude query strings/fragments and referrers contain only the origin.

| Event | Parameters | Meaning |
| --- | --- | --- |
| `page_view` | `site_language`, `page_type` | One consented page view |
| `project_click` | `cta_location` | Interest in the GitHub project, not an installation |
| `website_source_click` | `cta_location` | Website source click |
| `language_switch` | `target_language` | Language navigation |

Every interaction also includes `site_language`, `page_type` and a cleaned page location. Parameters are allowlisted fixed values. No notes, selections, task titles, user IDs or Microsoft account information are sent. No events are replayed from before consent. `_ga` cookies are cleared on withdrawal.

Custom parameters must be registered as event-scoped dimensions in GA4 to use them in standard explorations: `site_language`, `page_type`, `cta_location`, `target_language`. Registration requires Analytics Editor access and an edit-scoped OAuth connection. Event collection and event-name reports work without dimension registration.

For DebugView, a consented production visit may use `?analytics_debug=1`; this parameter is stripped from the reported page address. Browser test fixtures intercept Google requests so CI does not add real traffic. Keep automatic page history, site search and other enhanced events disabled in the website data stream. The site defines its own page views and interactions.

### Extension events

The Vercel function at `/api/extension-analytics/` accepts opt-in events from the extension and forwards them to GA4 property `385775162`, stream `5470384182` (`G-Q2114CB24F`). Set `GA_EXTENSION_API_SECRET` as a sensitive Vercel environment variable for this project. Generate it in that stream’s Measurement Protocol API secrets settings. The function accepts the store extension origin in production and the development extension origin in Preview. To use a branch-scoped Preview secret, deploy that Git branch. An unconfigured function returns 503.

The relay forwards `extension_open` (with `surface`) and `task_created`, the extension version, a random client ID, and the session ID. It validates the event and discards additional fields before sending anything to GA4.

## License

MIT. Microsoft and Microsoft To Do are trademarks of Microsoft. This independent project is not affiliated with or endorsed by Microsoft.
