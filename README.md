# CANY Data Portal — Codebase Guide

## Overview

The portal is five files (two of them HTML):

| File | Role |
|---|---|
| `datasets.json` | **Content** — what's written, the links, everything that varies by dataset |
| `index.html` / `dataset.html` | **Structure** — which boxes exist on the page, and their `id`s |
| `app.js` / `dataset.js` | **Behavior** — reads the JSON, builds HTML out of it, reacts to clicks |
| `style.css` | **Appearance** — colors, spacing, fonts, layout |

They pair up into two independent page/script sets, both reading the same JSON:

- **`index.html` + `app.js`** — the main page: catalog, search bar, and filters.
- **`dataset.html` + `dataset.js`** — what you get after clicking into a specific dataset: the About / Data / Related Content tabs.

---

## `datasets.json`

**Location:** `data/datasets.json`

This file is a **JSON array** — a list of objects, one per dataset on the portal. Each object holds content for *both* the catalog card and the full detail page. It's read independently by `app.js` (catalog page) and `dataset.js` (detail page) — each calls `fetch("./data/datasets.json")` on its own.

**If a field is missing, empty, or misspelled, this is the file to check** — it holds the content; the JS files just place it on the page.

> **Note:** the one exception is the Data Preview table on the detail page — that's built live from the actual CSV linked in `source.url`, not from this file.

### Example entry

```json
{
  "id": "under-custody",
  "title": "Under Custody",
  "description": "Monthly snapshot data of incarcerated individuals under custody starting June 2014.",
  "whatsincluded": "Longer paragraph(s) for the 'What's included' section of the About tab.",
  "howitsgenerated": "Paragraph(s) for the 'How this data is generated' section.",
  "limitations": "Paragraph(s) for the 'Limitations & guidelines for use' section.",
  "whypublish": "Paragraph(s) for the 'Why we publish this data' section.",
  "relatedlinks": [
    {
      "title": "CANY Prison Map",
      "description": "An interactive map of operational and recently closed prisons in New York State.",
      "url": "https://www.correctionalassociation.org/prison-map"
    }
  ],
  "agency": "DOCCS",
  "unit": "Individual",
  "tags": ["Population"],
  "universalTags": ["Individual-Level Records"],
  "updatedt": "2026-01-01",
  "source": {
    "type": "csv",
    "url": "https://canystorage.blob.core.windows.net/cany-data-portal/UNDER-CUSTODY-EXTRACT.CSV"
  },
  "sourceData": {
    "url": "https://canystorage.blob.core.windows.net/cany-data-portal/source-data-zip-files/DAILY-POP-CAPACITY_FAC_ZIP.zip"
  },
  "dashboard": {
    "pageUrl": "https://www.correctionalassociation.org/data/dashboard-under-custody"
  },
  "fields": [
    {
      "name": "FACILITY_NAME",
      "type": "string",
      "label": "Facility name based on the first two digits of the DOCCS facility code."
    }
  ]
}
```

### Field reference

| Field | Type | Required? | Where it shows up | Notes |
|---|---|---|---|---|
| `id` | string | Required | Used everywhere internally — never shown to users directly | The dataset's unique identifier. Must be unique across the whole file. Used to build the detail-page URL (`dataset.html?id=under-custody`) and as the lookup key `dataset.js` uses to find the right entry. Convention: lowercase, hyphen-separated (kebab-case), matching the dataset's title. |
| `title` | string | Required | Card heading (catalog page), page `<h1>` (detail page) | Plain text — no HTML. |
| `description` | string | Required | Card body text (catalog page), subtitle under the title (detail page) | Keep this to 1–2 sentences; it's meant to be a short summary, not the full "What's included" text. |
| `whatsincluded` | string | Recommended | About tab, section 01 | Sourced from the dataset's CANY dashboard page. Can be left `""` if not written yet — the section will just render empty, not error. |
| `howitsgenerated` | string | Recommended | About tab, section 02 | Same source/behavior as above. |
| `limitations` | string | Recommended | About tab, section 03 | Same source/behavior as above. |
| `whypublish` | string | Recommended | About tab, section 04 | Same source/behavior as above. |
| `relatedlinks` | array of objects | Optional | Related Content tab | Must be an array, even if empty (`[]`) — not a plain string. Each object needs `title` and `description`; `url` can be `""` if a link isn't confirmed yet — `dataset.js` will render that entry as bold plain text instead of a dead link rather than making it clickable. |
| `agency` | string | Required | Card badge, sidebar Agency filter, detail-page metadata | Currently either `"DOCCS"` or `"OMH"`. Whatever value goes here becomes a filter option automatically — no code change needed to add a new agency, just use it consistently across entries. |
| `unit` | string | Required | Sidebar Unit Type filter | The record's level of granularity — one row of the CSV represents either one `"Individual"` or one `"Facility"` (aggregate). |
| `tags` | array of strings | Required | Card tag chips, sidebar Tags filter | Dataset-specific tags — free-form, can differ per dataset. Use `[]` if there aren't any yet, not `null` or a string; the filtering code expects an array and will break otherwise. |
| `universalTags` | array of strings | Optional | Sidebar Universal Tags filter | The controlled set of cross-dataset categories: `"Individual-Level Records"`, `"Demographics Included"`, `"Point-in-Time Snapshot"`, `"Mental Health"`. Unlike `tags`, a dataset can belong to more than one of these at once, and most datasets belong to none — use `[]` (or omit it) if none apply. Stick to these exact four strings; a typo creates a new, near-duplicate filter option instead of matching the existing one. |
| `updatedt` | string | Required | Card metadata, detail-page metadata | Hardcoded date string (`YYYY-MM-DD`), manually updated for now — not pulled from the source file automatically. |
| `source.type` | string | Required | Not directly displayed; used to detect the file format | Currently always `"csv"`. |
| `source.url` | string | Required | "Download Data" button (1st action button) | The direct link to CANY's blob-hosted processed/cleaned CSV. Also the URL `dataset.js` fetches to build the Data-tab preview table. |
| `sourceData.url` | string | Optional | "Source Data" button (3rd action button) | Link to the raw, unprocessed source file (usually a ZIP obtained via FOIL), published separately from the cleaned CSV. Omit the whole `sourceData` object for datasets where CANY doesn't publish raw source data (e.g. `releases-from-custody`, `deaths-in-custody`) — the button hides itself automatically when this key is absent; don't set it to `""`. |
| `dashboard.pageUrl` | string | Optional | "View Dashboard" button (2nd action button) | Link to the dataset's live CANY dashboard page. Leave the whole `dashboard` object out if there's no dashboard page for that dataset. |
| `fields` | array of objects | Recommended | About tab, section 05 (Fields / Data Dictionary table) | One object per column in the source CSV, in the same order as the actual file so the table reads naturally. Each needs `name` (must exactly match the real CSV column header, including any typos in the source data — this is what the preview table matches against), `type` (`"string"`, `"date"`, `"integer"`, or `"number"`), and `label` (a plain-English description, written in our own words rather than copied from a data dictionary PDF). Use `[]` if the dictionary hasn't been converted yet. |

---

## HTML files

### `dataset.html`

The individual dataset page — where you land after clicking a card from the catalog. Pairs with `dataset.js` and `style.css`.

This file is mostly **empty containers with an `id`** — it defines *where* content goes, not what the content is; `dataset.js` places `datasets.json` content into those containers.

- **Section headers** ("What's included in this dataset", "How this data is generated", the "01"/"02" numbers, "Data Preview", tab labels like "About") are hardcoded directly in this file.
- **Everything inside a numbered section's `<p>` or table** comes from `datasets.json` — edit the data, not this file.

#### The tab system

The three `<section>` elements (`about`, `data`, `related`) all exist in the HTML at once — tab-switching doesn't load new content, it just toggles which section is visible, using the `hidden` attribute and the `.active` class (styled in `style.css`).

**To add another tab:**
1. A new `<button class="tab" data-tab="yourNewId" ...>` in `<nav class="dataset-tabs">`
2. A new `<section id="yourNewId" class="tab-content" hidden>` with matching `aria-labelledby`

No JS changes needed — `bindTabs()` / `activateTab()` work off the `data-tab` ↔ section-`id` match generically, not a hardcoded list of tab names.

#### Code structure

```
<header class="dataset-top">
  ← Back link
  Title / description / metadata (agency, updated date)
  3 action buttons: Download Data | View Dashboard | Source Data
  3 tabs: About | Data | Related Content
</header>

<section id="about">    ← visible by default
  01 What's included
  02 How this data is generated
  03 Limitations & guidelines for use
  04 Why we publish this data
  05 Fields / Data Dictionary (table)
</section>

<section id="data">     ← hidden until "Data" tab is clicked
  Data Preview (table)
</section>

<section id="related">  ← hidden until "Related Content" tab is clicked
  Related links list
</section>
```

#### Every element with an `id`, and what fills it

| HTML `id` | Filled by (`dataset.js` function) | From (`datasets.json` field) |
|---|---|---|
| `title` | `renderDataset()` | `title` |
| `description` | `renderDataset()` | `description` |
| `agency` | `renderDataset()` | `agency` |
| `updatedt` | `renderDataset()` | `updatedt` |
| `download` (Download Data button) | `renderActionLinks()` → `setActionLink()` | `source.url` |
| `dashboard-link` (View Dashboard button) | `renderActionLinks()` → `setActionLink()` | `dashboard.pageUrl` |
| `source-data-download` (Source Data button) | `renderActionLinks()` → `setActionLink()` | `sourceData.url` |
| `whatsincluded` | `renderDataset()` | `whatsincluded` |
| `howitsgenerated` | `renderDataset()` | `howitsgenerated` |
| `limitations` | `renderDataset()` | `limitations` |
| `whypublish` | `renderDataset()` | `whypublish` |
| `fields` (table) | `renderFieldsTable()` | `fields` array |
| `preview` (table) | `renderPreviewTable()`, via `loadPreview()` | fetched live from `source.url` — **not** `datasets.json` |
| `relatedlinks` | `renderRelatedLinks()` | `relatedlinks` array |

---

### `index.html`

The main catalog page. Pairs with `app.js` and `style.css`.

Same pattern as `dataset.html` — mostly empty containers with an `id`.

- **Page title, hero description, section headings** ("Filters", "Catalog", "Browse available public datasets...", the search placeholder text) are hardcoded directly in this file.
- **Filter option lists, dataset cards, result counts, active-filter pills** are all built by `app.js` from `datasets.json` — edit the data (or the render functions, if it's a layout/formatting issue), not this file.

#### Code structure

```
<header class="catalog-hero">
  Page title + description
</header>

<div class="catalog-layout">

  <aside class="catalog-sidebar">
    Filters heading + Show/Hide toggle
    Agencies filter list
    Tags filter list
    Clear all filters link
  </aside>

  <main class="catalog-main">
    Catalog title + search box
    Results count + active-filter pills + Clear all
    Dataset card list
  </main>

</div>
```

#### Every element with an `id`, and what fills it

| HTML `id` | Filled/handled by (`app.js` function) | Notes |
|---|---|---|
| `mobile-filter-toggle` | `bindMobileFilterToggle()` | Show/Hide button for the sidebar on narrow screens. Toggles `aria-expanded` and the `hidden` attribute on `filter-content`. |
| `filter-content` | (target of the toggle above) | Wraps the whole filter section so it can be hidden as one block. |
| `agencyFilters` | `renderFilters()` → `renderFilterGroup()` | Built from the unique `agency` values across every entry in `datasets.json` — not hardcoded. Clicking an option calls `setAgency(value)`. |
| `tagFilters` | `renderFilters()` → `renderFilterGroup()` | Built from every dataset's `tags` array, deduplicated. Clicking calls `setTag(value)`. |
| `clear-all` | `bindClearButtons()` | Resets all filters and search back to empty. |
| `search` | `bindSearch()` | Updates `state.search` on every keystroke, then re-renders results and active-filter pills. |
| `resultsMeta` | `renderResultsCount()` | The "N results" text above the card list. |
| `activeFilters` | `renderActiveFilters()` | The removable pill for each currently-active filter/search term. Each pill's × button calls `removeActiveFilter(type, value)`. |
| `clear-all-results` | `bindClearButtons()` | Same reset behavior as `clear-all`; automatically hidden when no filters are active (`renderActiveFilters()` controls its `hidden` state). |
| `datasetList` | `renderResults()` → `createDatasetCard()` per dataset | The actual list of dataset cards. If nothing matches, renders `renderEmptyResults()` instead; if the fetch itself fails, `renderLoadError()`. |

---

## JavaScript files

### `app.js`

The behavior layer for the catalog page — pairs with `index.html` and `datasets.json`.

- `createCatalogActionLinks()` only shows a button if the matching field actually exists on that dataset — if there's no `dashboard` object, `dashboardURL` is `undefined`, and that block just doesn't add the link. The three buttons (Dashboard / Download Data / Source Data) come entirely from the optional fields filled in on each `datasets.json` entry.
- A dataset has exactly **one** `agency` and **one** `unit`, but can carry **multiple** `tags`.

Code in this file generally follows one loop:

```
user does something (types, clicks a filter, clicks a tag)
        ↓
a small handler function updates `state`
        ↓
renderAll() is called
        ↓
renderAll() re-draws: results, filter lists, and active-filter pills
```

**Startup sequence:**

```js
init();

function init() {
  bindEvents();   // attach all click/input listeners — runs before data exists
  loadData();     // fetch datasets.json, then call renderAll() once it's in
}
```

#### Event binding

| Function | What it does |
|---|---|
| `bindEvents()` | Calls the three binders below, once, on startup. |
| `bindSearch()` | Listens for input on `#search`; updates `state.search` and re-renders results + pills on every keystroke. |
| `bindClearButtons()` | Wires up **both** `#clear-all` (sidebar) and `#clear-all-results` (above the card list) to the same full reset. |
| `bindMobileFilterToggle()` | Toggles `#filter-content`'s visibility and the toggle button's label/`aria-expanded`, for narrow screens. |

#### Filtering and search

| Function | What it does |
|---|---|
| `getFilteredResults()` | The core pipeline: filters `datasets` by `agency` → `unit` → `tag` (must match *all* selected tags) → `universalTag` (same, all must match) → then scores by search relevance → drops zero-score results → sorts by score, tie-broken alphabetically by title. |
| `scoreDataset(dataset, query)` | Returns `1` if there's no search query (everything "matches" when not searching). Otherwise: `+5` for a title match, `+3` for an agency match, `+1` for a match anywhere else (description, context statement, tags). |

#### Rendering

| Function | Fills / affects |
|---|---|
| `renderAll()` | Calls `renderResults()`, `renderFilters()`, `renderActiveFilters()` — the one function to call after any state change. |
| `renderResults()` | `#datasetList` — builds one card per filtered/sorted dataset, or falls back to `renderEmptyResults()` if nothing matches. |
| `renderResultsCount()` | `#resultsMeta` — the "N results" text. |
| `createDatasetCard(dataset)` | Builds a single `<article class="catalog-card">`, including title, description, badges, metadata, action links, and tags. |
| `createCatalogActionLinks(dataset)` | The Dashboard / Download Data / Source Data links shown on each card. |
| `createTagMarkup(tags)` | The tag chip buttons in each card's footer. |
| `bindCardTagButtons(card)` | Wires each card's tag chips to `setTag()` — clicking a tag chip *on a card* filters the whole page by that tag, same as clicking it in the sidebar. |
| `renderActiveFilters()` | `#activeFilters` — a removable pill per active filter/search term. |
| `renderFilters()` | Computes the option lists for all four filter groups and calls `renderFilterGroup()` for each. |
| `renderFilterGroup()` | Generic button-list renderer, shared by all four filter types (agency/unit/tag/universalTag). |
| `renderEmptyResults(container)` | Shown inside `#datasetList` when filters/search match zero datasets. |
| `renderLoadError()` | Shown when `fetch("./data/datasets.json")` itself fails. |

#### Small helpers

| Function | Purpose |
|---|---|
| `getDatasetTags(dataset)` | Returns `dataset.tags` if it's really an array, otherwise `[]` — guards against a dataset entry where `tags` is missing, so the rest of the code never has to null-check it. |
| `getDatasetFormat(dataset)` | Looks for `dataset.format`, then `dataset.source.type`, then `dataset.source.format`, returning whichever is found first, uppercased. |
| `formatDate(dateValue)` | Turns `"2026-01-01"` into `"January 1, 2026"` for display; falls back to showing the raw value if it can't be parsed as a date. |
| `escapeHTML(value)` | Escapes `& < > " '` before inserting untrusted text into `innerHTML` — every user-facing string built from `datasets.json` should be passed through this before being interpolated into a template string, to prevent a malicious/malformed value from injecting HTML. |

---

### `dataset.js`

The behavior layer for the single-dataset detail page — pairs with `dataset.html` and `datasets.json`.

**Startup sequence:**

```js
initDatasetPage();

function initDatasetPage() {
  bindTabs();                       // tab clicks work immediately, before data loads
  const id = getDatasetIdFromURL(); // read ?id=... from the current URL
  loadDataset(id);                  // fetch datasets.json, find the matching entry, render it
}
```

#### Entry point & data loading

| Function | What it does |
|---|---|
| `initDatasetPage()` | Runs once on load: binds tabs, reads the URL, kicks off loading. |
| `getDatasetIdFromURL()` | Pulls the `id` query parameter (`?id=under-custody`) via `URLSearchParams`. |
| `loadDataset(id)` | Fetches all datasets, finds the one whose `id` matches, and either renders it or calls `renderNotFound(id)`. Also kicks off `loadPreview()` separately, for the live CSV preview. |
| `fetchDatasets()` | The raw `fetch("./data/datasets.json")` call. |

#### Tab switching

| Function | What it does |
|---|---|
| `bindTabs()` | Attaches a click listener to every `.tab` button, once, on page load. |
| `activateTab(tabName)` | Matches a button's `data-tab` attribute against a `.tab-content` section's `id`; toggles `.active`/`aria-selected` on the button and `.active`/`hidden` on the section. Fully generic — adding a new tab needs no changes here, just a matching button + section pair in the HTML (see the `dataset.html` section above). |

#### Rendering the dataset

| Function | Fills / affects |
|---|---|
| `renderDataset(d)` | The main dispatcher — sets `title`, `description`, `whatsincluded`, `howitsgenerated`, `limitations`, `whypublish`, `agency`, `updatedt`, then calls `renderActionLinks(d)`, `renderRelatedLinks(d.relatedlinks)`, and `renderFieldsTable(d.fields)`. |
| `renderActionLinks(d)` | Calls `setActionLink()` three times, once per button. |
| `setActionLink(id, url)` | Shared logic for all three action buttons: if `url` is truthy, sets `href` and un-hides the button; if not, hides it entirely rather than leaving a dead `href="#"` link. |
| `renderRelatedLinks(links)` | Builds the Related Content tab from the `relatedlinks` array — real `<a target="_blank">` tags when a link has a `url`, bolded plain text (no dead link) when it doesn't. Shows "No related resources listed." if the array is empty or missing. |
| `renderFieldsTable(fields)` | Builds the Fields/Data Dictionary table — one row per `{name, type, label}` object. |
| `renderNotFound(id)` | Replaces the entire `<body>` with a "Dataset not found" message if no entry in `datasets.json` matches the URL's `id`. |

#### Data preview pipeline

This is the part of the page that doesn't come from `datasets.json` at all — it downloads and parses the *actual CSV* linked in `source.url`, live in the browser:

| Function | What it does |
|---|---|
| `loadPreview(url)` | Orchestrates the whole pipeline below, ending in `renderPreviewTable()`. |
| `fetchPreviewText(url)` | Requests only the **first ~50KB** of the file via a `Range: bytes=0-50000` header — avoids downloading a multi-megabyte CSV just to show 10 rows. Falls back to `fetchText()` (a full download) if the server doesn't honor the Range request. |
| `fetchText(url)` | A plain, full-file fetch — used as the fallback above. |
| `cleanText(text)` | Strips a leading byte-order-mark and normalizes Windows line endings (`\r\n` → `\n`) before parsing. |
| `detectDelimiter(text)` | Looks at the first line only, counts occurrences of `\|`, `,`, and `\t`, and picks whichever appears most — this is how the same code handles both comma-separated and pipe-separated CANY files without being told which is which. |
| `parseDelimited(text, delimiter)` | Splits into rows, then splits each row by the detected delimiter, dropping any row with only one resulting column (guards against stray blank lines). |
| `renderPreviewTable(rows)` | Builds the actual `<table>` — first row becomes `<th>` headers, the next 9 become `<td>` data rows, everything past row 10 is discarded. |

#### Small utilities

| Function | Purpose |
|---|---|
| `setText(id, value)` | `document.getElementById(id).innerText = value ?? ""` — safe against `null`/`undefined`, and safe against HTML injection since `innerText` never interprets tags. |
| `setHTML(id, html)` | Same idea but via `innerHTML`, for the two spots (`agency`, `updatedt`) that need actual markup (a `<b>` tag) rather than plain text. |