# To Do Capture website

To Do Capture is an independent, open-source extension for Chrome and Edge that saves webpages, selected text, and links to Microsoft To Do. This repository contains its English and Simplified Chinese homepages, privacy policies, and analytics relay. Both homepages link to the Chrome Web Store, Microsoft Edge Add-ons, and the latest GitHub release for manual installation. [Extension source](https://github.com/WayneGongCN/microsoft-todo-browser-ext)

- Primary domain · [todo-ext.waynegong.com](https://todo-ext.waynegong.com/)
- Original Vercel domain · [microsoft-todo-capture-site.vercel.app](https://microsoft-todo-capture-site.vercel.app/)
- Site pages · `/`, `/zh/`, `/privacy/`, `/zh/privacy/`

## Deployment

Import this GitHub repository into Vercel and use `main` as the production branch. [`vercel.json`](vercel.json) sets `npm run build` as the build command, `dist/` as the output directory, and the security and cache headers. Vercel also deploys [`api/extension-analytics.js`](api/extension-analytics.js) as a serverless function. Preview builds use `noindex,nofollow` and block crawling in `robots.txt`. [Vercel GitHub deployment guide](https://vercel.com/docs/git/vercel-for-github)

The primary domain is configured in [`src/config.mjs`](src/config.mjs) and used for canonical URLs, language alternates, Open Graph metadata, and the sitemap. If the domain changes, update that config and the Vercel domain assignment, then redeploy. Keep the Google Search Console verification tags in [`scripts/build.mjs`](scripts/build.mjs) and submit the new `/sitemap.xml` after verifying the new property. Bing Webmaster Tools can import the verified property from Search Console.

## Development

Use Node.js 22 or later. The site builds to static HTML, CSS, and JavaScript.

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

Checks cover static SEO metadata, localized content, installation links, narrow layouts, accessibility, consent and Global Privacy Control. `node scripts/generate-og.mjs` regenerates the committed 1200 × 630 sharing image.

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

## Analytics

### Website events

The website reports to GA4 property `298798570`, stream `3193804945`, measurement ID `G-QR2Z39S77X`. Analytics load after visitor opt-in on either production domain. Preview and local visits skip collection. Global Privacy Control overrides a previous opt-in, and visitors can withdraw from the footer. The site sends one manual page view per page and disables advertising features. Reported URLs omit query strings and fragments, and referrers contain only the origin.

| Event | Parameters | Meaning |
| --- | --- | --- |
| `page_view` | `site_language`, `page_type` | One consented page view |
| `install_chrome_click` | `cta_location` | Click to open the Chrome Web Store listing |
| `install_edge_click` | `cta_location` | Click to open the Microsoft Edge Add-ons listing |
| `install_manual_click` | `cta_location` | Click to open the GitHub release for manual installation |
| `project_click` | `cta_location` | Interest in the GitHub project, not an installation |
| `website_source_click` | `cta_location` | Website source click |
| `language_switch` | `target_language` | Language navigation |

Every interaction also includes `site_language`, `page_type` and a cleaned page location. Parameters are allowlisted fixed values. No notes, selections, task titles, user IDs or Microsoft account information are sent. No events are replayed from before consent. `_ga` cookies are cleared on withdrawal.

Mark the three `install_*_click` events as GA4 key events using the once-per-event counting method. They measure clicks to installation destinations.

Custom parameters must be registered as event-scoped dimensions in GA4 to use them in standard explorations: `site_language`, `page_type`, `cta_location`, `target_language`. Registration requires Analytics Editor access and an edit-scoped OAuth connection. Event collection and event-name reports work without dimension registration.

For DebugView, a consented production visit may use `?analytics_debug=1`; this parameter is stripped from the reported page address. Browser test fixtures intercept Google requests so CI does not add real traffic. Keep automatic page history, site search and other enhanced events disabled in the website data stream. The site defines its own page views and interactions.

### Extension events

When users enable usage analytics in the Chrome Web Store version, the extension sends `extension_open` and successful `task_created` events to `/api/extension-analytics/` on the original Vercel domain. The relay forwards validated events to GA4 property `385775162`, stream `5470384182` (`G-Q2114CB24F`). It accepts the extension version, a random installation ID, the session ID, and the screen (`surface`) for open events. Task contents, browsing data, and Microsoft account details stay outside the analytics payload. The Microsoft Edge Add-ons version skips usage analytics. [Privacy policy](https://todo-ext.waynegong.com/privacy/)

Set `GA_EXTENSION_API_SECRET` in the Vercel environment that needs the relay. Generate the secret in the extension stream’s GA4 Measurement Protocol settings. Production accepts the Chrome Web Store extension origin, while Preview accepts the development extension origin. Valid events receive HTTP 503 when the secret is missing.

## License

MIT. Microsoft and Microsoft To Do are trademarks of Microsoft. This independent project is not affiliated with or endorsed by Microsoft.
