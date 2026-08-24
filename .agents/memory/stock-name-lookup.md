---
name: Stock name lookup
description: Reliability rules for resolving company names and ticker symbols through Yahoo search before Finviz analysis.
---

Resolve every search term against exact ticker and company-name matches before treating short alphabetic input as a ticker. Names such as Apple, Tesla, and Meta otherwise look syntactically like valid symbols.

**Why:** Yahoo Finance search returned HTTP 429 from the Replit environment with a generic client, while an identified User-Agent succeeded. The analysis page also launches data, chart, and trend requests together, so duplicate unresolved lookups can create avoidable rate-limit pressure.

**How to apply:** Send an identified User-Agent, cache results, share concurrent in-flight lookups, prioritize exact symbol matches followed by exact/prefix company-name matches, and preserve a syntactically valid ticker as the outage fallback.