# Google Analytics setup

The site is prepared for Google Analytics 4 (GA4) but ships switched **off**. With no Measurement ID configured there is no
banner, no cookie, and no request to Google.

## How it behaves

| Situation | What happens |
| --- | --- |
| No Measurement ID in the environment file | Nothing: no banner, no script, no cookies |
| ID set, visitor has not chosen | Consent banner shown. Google is **not** contacted |
| Visitor clicks **Reject analytics** | Google is never contacted. Choice is remembered |
| Visitor clicks **Accept analytics** | `gtag.js` loads, a `page_view` is sent on every route change |
| Visitor later opens **Cookie settings** and rejects | Sending stops and the `_ga*` cookies are deleted |
| Browser sends the Global Privacy Control signal | Treated as "rejected" and the banner is not shown. The visitor can still opt in through **Cookie settings** |

Advertising features are off: `allow_google_signals` and `allow_ad_personalization_signals` are `false`, and consent mode
sets `ad_storage`, `ad_user_data` and `ad_personalization` to `denied`.

## Switching it on

1. In Google Analytics create a **GA4 property** and a **Web data stream** for `https://www.footlook.co.za`.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Paste it into `gaMeasurementId` in `src/environments/environment.production.ts`.
4. Build and deploy as usual.

Only an ID matching `G-` followed by letters/digits is accepted; anything else leaves analytics off.

## Settings to change in the GA admin (they back the promises in the Privacy Policy)

- **Admin > Data collection and modification > Data retention**: set event data retention to **14 months** (the Privacy Policy says "no longer than 14 months").
- **Admin > Data collection and modification > Data collection**: leave **Google signals** off.
- **Admin > Data sharing settings**: untick the optional sharing options you do not need.
- **Admin > Data streams > Enhanced measurement**: turn off **Page views based on browser history events**. The app already sends its own `page_view` on route changes and this would double-count.
- Optional: filter out your own traffic (**Admin > Data filters > Internal traffic**).

## Testing

1. Put your ID in `environment.ts`, run `npm start`, open the site and click **Accept analytics**.
2. In GA open **Admin > DebugView** (or use the "GA Debugger" browser extension). You should see one `page_view` per page you visit.
3. Click **Cookie settings > Reject analytics** and confirm no more events arrive and the `_ga` cookies are gone.

## Later: making the site searchable

- Verify the domain in **Google Search Console** (a DNS TXT record on `footlook.co.za` is the least intrusive way) and submit the sitemap once you have one.
- If you add a Content-Security-Policy header, allow `https://www.googletagmanager.com` and `https://*.google-analytics.com` for scripts and connections.

## Code map

- `src/app/core/services/consent.service.ts`: remembers the choice (`localStorage` key `footlook-cookie-consent`, the same one the Cookie Policy names).
- `src/app/core/services/analytics.service.ts`: loads GA only after consent, sends page views, handles withdrawal.
- `src/app/shared/components/cookie-banner/`: the banner and the floating "Cookie settings" button.
