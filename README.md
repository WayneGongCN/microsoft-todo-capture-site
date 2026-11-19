# To Do Capture website

To Do Capture is an independent, open-source extension for Chrome and Edge that saves webpages, selected text, and links to Microsoft To Do. This repository contains its English and Simplified Chinese homepages and privacy policies. Both homepages link to the Chrome Web Store, Microsoft Edge Add-ons, and the latest GitHub release for manual installation. [Extension source](https://github.com/WayneGongCN/microsoft-todo-browser-ext)

- Primary domain · [todo-ext.waynegong.com](https://todo-ext.waynegong.com/)
- Site pages · `/`, `/zh/`, `/privacy/`, `/zh/privacy/`

## Deployment

Every push to `main` runs the [Publish website workflow](.github/workflows/publish-site.yml). It installs dependencies, builds and tests the production site, then publishes `dist/` to the `microsoft-todo-capture-site` Cloudflare Worker. You can also run the workflow manually from `main` in GitHub Actions.

Configure these repository settings under **Settings → Secrets and variables → Actions**.

- Set the `CLOUDFLARE_ACCOUNT_ID` Actions variable to the account that owns the Worker and the custom domain.
- Set the `CLOUDFLARE_API_TOKEN` Actions secret to a token authorized to deploy the existing Worker.

The workflow uploads a Worker version and deploys it to 100% of traffic. Manage the production custom domain in Cloudflare. [`wrangler.jsonc`](wrangler.jsonc) records the domain and configures `404.html` for missing paths. [`public/_headers`](public/_headers) sets the security and cache headers.

The primary domain is configured in [`src/config.mjs`](src/config.mjs) and used for canonical URLs, language alternates, Open Graph metadata, and the sitemap. If the domain changes, update both repository configs and the custom domain in Cloudflare, then redeploy. Keep the Google Search Console verification tag in [`scripts/build.mjs`](scripts/build.mjs) and submit the new `/sitemap.xml` after verifying the new property. Bing Webmaster Tools can import the verified property from Search Console.

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

Checks cover static SEO metadata, localized content, installation links, narrow layouts, accessibility, analytics preferences and Global Privacy Control. `node scripts/generate-og.mjs` regenerates the committed 1200 × 630 sharing image.

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

The website reports to GA4 property `298798570`, stream `3193804945`, measurement ID `G-QR2Z39S77X`. Analytics is on by default on the production domain. Preview and local visits skip collection. The site honors Global Privacy Control and saved opt-outs. Visitors can turn analytics off in the footer. The site sends one manual page view per page, keeps Analytics cookie storage denied, and disables advertising features. Reported URLs omit query strings and fragments, and referrers contain only the origin. GA4 reporting of cookieless signals depends on the property's reporting identity and modeling eligibility.

| Event | Parameters | Meaning |
| --- | --- | --- |
| `page_view` | `site_language`, `page_type` | One page view while analytics is on |
| `install_chrome_click` | `cta_location` | Click to open the Chrome Web Store listing |
| `install_edge_click` | `cta_location` | Click to open the Microsoft Edge Add-ons listing |
| `install_manual_click` | `cta_location` | Click to open the GitHub release for manual installation |
| `project_click` | `cta_location` | Interest in the GitHub project, not an installation |
| `website_source_click` | `cta_location` | Website source click |
| `language_switch` | `target_language` | Language navigation |

Every interaction also includes `site_language`, `page_type` and a cleaned page location. Parameters are allowlisted fixed values. No notes, selections, task titles, user IDs or Microsoft account information are sent. Events that happen while analytics is off are skipped. The site removes `_ga` cookies written by earlier versions.

Mark the three `install_*_click` events as GA4 key events using the once-per-event counting method. Use the [Chrome Web Store install report](https://developer.chrome.com/docs/webstore/metrics/#installs-and-uninstalls) and [Microsoft Edge Add-ons analytics dashboard](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/extensions-analytics) for actual store installations. The manual download event counts visits to the release link.

Custom parameters must be registered as event-scoped dimensions in GA4 to use them in standard explorations: `site_language`, `page_type`, `cta_location`, `target_language`. Registration requires Analytics Editor access and an edit-scoped OAuth connection. Event collection and event-name reports work without dimension registration.

The `?analytics_debug=1` flag sets `debug_mode` and is stripped from the reported page address. Browser test fixtures intercept Google requests so CI does not add real traffic. Keep automatic page history, site search and other enhanced events disabled in the website data stream. The site defines its own page views and interactions.

## License

MIT. Microsoft and Microsoft To Do are trademarks of Microsoft. This independent project is not affiliated with or endorsed by Microsoft.
