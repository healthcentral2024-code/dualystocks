---
name: SEC earnings dates
description: Reliable source and access requirements for the most recent earnings-report date.
---

Use the latest SEC 8-K or 8-K/A filing containing Item 2.02 as the official date of the most recent reported earnings. Do not substitute a fiscal quarter end date for the announcement date.

**Why:** Public market-data endpoints tested for this project either exposed only the next expected report or required a private browser session. SEC EDGAR provides the actual filed earnings release, but returns an HTML rejection page when the User-Agent does not identify the app with its public contact.

**How to apply:** Resolve ticker to CIK from the SEC ticker file, inspect recent submissions for Item 2.02, send a descriptive User-Agent using the app's published support contact, cache both the ticker map and per-ticker result, and fail softly when no qualifying filing exists.