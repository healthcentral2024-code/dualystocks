---
name: Finviz Elite integration
description: Quirks of the Finviz Elite CSV export used by TradeSage (redirects, filter syntax, non-CSV 200s)
---

- Endpoint: `elite.finviz.com/export.ashx` with `auth=` token; it 301-redirects, so always follow redirects (`curl -L`, `fetch redirect: "follow"`).
- Returns CSV; column headers like `Analyst Recom`, `Insider Transactions`, `Target Price`, `Index`. Request columns via `c=0..120`.
- Can return HTML/text with HTTP 200 on auth/quota errors — validate the header row contains `Ticker` before parsing.
- Screener filters (`f=`) verified: `idx_sp500/idx_ndx/idx_dji`, `exch_nyse/exch_nasd/exch_amex`, custom cap ranges in billions `cap_0to0.5`, `cap_0.5to1`, `cap_0.5to`/`cap_1to` (open-ended lower bound), `an_recom_*`, `sh_insidertrans_pos/neg`, `targetprice_aN`. `cap_o0.5`, `cap_o1`, and `cap_u0.5` do NOT work (silently ignored — verified 2026-08: min-cap sort returned $60K caps).
- **Why:** re-deriving filter syntax by trial costs API calls; broken filters silently return the full universe instead of erroring.
- **How to apply:** when adding screener presets/filters, test each `f=` code with curl first — an unfiltered result set means the code is invalid.

## Historical data (quote_export.ashx)
- Daily CSV `Date,Open,High,Low,Close,Volume`, `Date` as MM/DD/YYYY; validate header starts with "Date".
- Rate-limits with HTTP 429 under burst fan-out (e.g. 15 tickers at once). Keep concurrency <=2, cache per ticker (~1h), and negative-cache failures (short ~1min backoff for 429, longer for hard failures) or one burst poisons subsequent requests.

- Never cache empty screener result lists: a transient Finviz failure/429 can yield zero rows, and caching that shows "no results" for the whole TTL even when the filter combo has matches. Cache only non-empty results (or validate before caching).
- Standard price codes stop at `sh_price_o100`; no `o150` exists. Elite custom-range syntax works: `sh_price_150to` (open-ended lower bound), verified min 150.04. Always verify new filter codes by checking min/max of results (invalid codes silently return everything).
- Analyst-recom custom ranges (`an_recom_1to2` etc.) do NOT work in export.ashx (silently return the universe) even though the Elite web UI offers custom ranges. Only named codes work: `an_recom_strongbuy/buybetter/buy/holdbetter/hold/holdworse/...` (holdworse verified).
- quote_export.ashx timeframes: `p=m|w|d|h` all work on Elite (`h` rows have "MM/DD/YYYY HH:MM AM" datetimes, ~2 months of hourly data; `i60` returns daily, not hourly). Fetch frames sequentially and cache the combined result — 4 fetches/ticker amplifies 429s.
