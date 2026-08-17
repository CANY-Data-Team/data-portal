/* =========================================================
   STATE
========================================================= */

let datasets = [];

/*multi select filters*/
const state = {
  search: "",
  agency: null,
  tag: [],
};

/* =========================================================
   START APPLICATION
========================================================= */

init();

function init() {
  bindEvents();
  loadData();
}

/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {
  try {
    const response = await fetch("./data/datasets.json");

    if (!response.ok) {
      throw new Error(
        `Unable to load datasets: ${response.status}`
      );
    }

    datasets = await response.json();

    renderAll();
  } catch (error) {
    console.error("Dataset loading error:", error);
    renderLoadError();
  }
}

/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {
  bindSearch();
  bindClearButtons();
  bindMobileFilterToggle();
}

function bindSearch() {

/// Find the HTML element with id="search":
  const searchInput = document.getElementById("search");

/// If element does not exist, stop this function so JavaScript does not produce an error.
  if (!searchInput) {
    return;
  }
/// Attaches an event listener to the search box (searchInput); "input" means the listener runs every time the search-box value changes
  searchInput.addEventListener("input", event => {

/// takes the current value from the search box and stores it in your program’s state object.    
    state.search = event.target.value
      .trim()
      .toLowerCase();

    renderResults();
    renderActiveFilters();
  });
}

function bindClearButtons() {
  const clearButtonIds = [
    "clear-all",
    "clear-all-results"
  ];

  clearButtonIds.forEach(buttonId => {
    const button = document.getElementById(buttonId);

    if (!button) {
      return;
    }

    button.addEventListener("click", event => {
      event.preventDefault();

      resetState();
      renderAll();
    });
  });
}

function bindMobileFilterToggle() {
  const toggleButton = document.getElementById(
    "mobile-filter-toggle"
  );

  const filterContent = document.getElementById(
    "filter-content"
  );

  if (!toggleButton || !filterContent) {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const isExpanded =
      toggleButton.getAttribute("aria-expanded") === "true";

    toggleButton.setAttribute(
      "aria-expanded",
      String(!isExpanded)
    );

    filterContent.hidden = isExpanded;

    toggleButton.textContent = isExpanded
      ? "Show"
      : "Hide";
  });
}

/* =========================================================
   STATE MANAGEMENT
========================================================= */

function resetState() {
  state.search = "";
  state.agency = null;
  state.tag = [];


  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.value = "";
  }
}

/* =========================================================
   FILTERING AND SEARCH SCORING
=========================================================
getFilteredResults() starts with all datasets and returns a new array 
containing the datasets that match the current filters and search text, ordered by relevance. */

function getFilteredResults() {

  // Apply the agency and tag filters before running the search.
  const filteredDatasets = datasets
    .filter(dataset =>
      !state.agency ||
      dataset.agency === state.agency
    )

    .filter(dataset =>
      state.tag.length === 0 ||
      state.tag.some(t =>
        (dataset.tags || []).includes(t)
      )
    );

  // If there is no search query, return the filtered datasets alphabetically.
  if (!state.search) {

    // The return sends the final result back to the code that called the function.
    return [...filteredDatasets].sort((a, b) =>
      String(a.title || "").localeCompare(
        String(b.title || "")
      )
    );
  }

  // Configure Fuse to perform approximate matching.
  const fuse = new Fuse(filteredDatasets, {

    // Include Fuse's relevance score in each search result.
    includeScore: true,

    // A higher threshold allows less exact matches.
    threshold: 0.6,

    // Search for the query anywhere within each field.
    ignoreLocation: true,

    // Reduce the effect that different field lengths have on the score.
    ignoreFieldNorm: true,

    // Do not match a single query character.
    minMatchCharLength: 2,

    // Give title matches the greatest importance.
    keys: [
      { name: "title", weight: 0.85 },
      { name: "tags", weight: 0.08 },
      { name: "description", weight: 0.05 },
      { name: "agency", weight: 0.02 }
    ]
  });

  // Run the approximate search.
  const fuseResults = fuse.search(state.search);

  // Temporarily use this to inspect Fuse's results in the browser console.
  console.log("Search query:", state.search);
  console.log(
    "Datasets sent to Fuse:",
    filteredDatasets.map(dataset => dataset.title)
  );
  console.log("Fuse results:", fuseResults);

  // Return the matching datasets from strongest to weakest.
  return fuseResults.map(result => ({

    // Copy all properties from the original dataset.
    ...result.item,

    // Add Fuse's relevance score.
    // A lower Fuse score represents a stronger match.
    score: result.score
  }));
}

/* =========================================================
   RENDER PIPELINE
========================================================= */

function renderAll() {
  renderResults();
  renderFilters();
  renderActiveFilters();
}

/* =========================================================
   DATASET RESULTS
========================================================= */
   /* renderResults() gets the filtered datasets, updates the results count, and clears the old dataset cards from the page. 
    If there are matches, it creates and displays a card for each dataset; otherwise, it displays an empty-results message.*/


function renderResults() {


  const results = getFilteredResults();
  const container = document.getElementById("datasetList");

  renderResultsCount(results.length);

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (results.length === 0) {
    renderEmptyResults(container);
    return;
  }

  results.forEach(dataset => {
    const card = createDatasetCard(dataset);
    container.appendChild(card);
  });
}

function renderResultsCount(numberOfResults) {
  const resultsMeta = document.getElementById(
    "resultsMeta"
  );

  if (!resultsMeta) {
    return;
  }

  const resultWord =
    numberOfResults === 1
      ? "result"
      : "results";

  resultsMeta.innerHTML = `
    <strong>${numberOfResults}</strong>
    ${resultWord}
  `;
}

/* =========================================================
   CREATE DATASET CARD
========================================================= */

function createDatasetCard(dataset) {
  const card = document.createElement("article");

  card.className = "catalog-card";

  const datasetURL =
    `dataset.html?id=${encodeURIComponent(dataset.id)}`;

  const title = escapeHTML(
    dataset.title || "Untitled dataset"
  );

  const description = escapeHTML(
    dataset.description || "No description available."
  );

  const agency = escapeHTML(
    dataset.agency || "Agency not specified"
  );

  const updatedDate = formatDate(dataset.updatedt);
  const format = getDatasetFormat(dataset);
  const tags = getDatasetTags(dataset);

  const fieldCount = Array.isArray(dataset.fields)
    ? dataset.fields.length
    : null;

  const coverageMarkup = dataset.coverage
    ? `
      <div class="metadata-item">
        <dt>Coverage</dt>
        <dd>${escapeHTML(dataset.coverage)}</dd>
      </div>
    `
    : "";

  const fieldCountMarkup = fieldCount !== null
    ? `
      <div class="metadata-item">
        <dt>Fields</dt>
        <dd>${fieldCount}</dd>
      </div>
    `
    : "";

  const formatMarkup = format
    ? `
      <div class="metadata-item">
        <dt>Format</dt>
        <dd>${escapeHTML(format)}</dd>
      </div>
    `
    : "";

  const tagMarkup = createTagMarkup(tags);

  const actionLinksMarkup =
    createCatalogActionLinks(dataset);

  card.innerHTML = `
    <!-- Dataset card header -->

    <header class="catalog-card-header">

      <div
        class="catalog-dataset-icon"
        aria-hidden="true"
      >
        ▦
      </div>

      <a
        class="catalog-card-title"
        href="${datasetURL}"
      >
        ${title}
      </a>

      <div class="catalog-card-badges">

        <span class="type-badge">
          Dataset
        </span>

        <span class="agency-badge">
          ${agency}
        </span>

      </div>

    </header>

    <!-- Dataset card body -->

    <div class="catalog-card-body">

      <div class="catalog-card-description">

        <p>
          ${description}
        </p>

        <!-- Explanation of the detail page -->

        
        <div class="dataset-details-notice">
    

          <a
            class="dataset-details-link"
            href="${datasetURL}"
          >
            Explore dataset

            <span aria-hidden="true">
              →
            </span>
          </a>

        </div>
        

        <!-- Direct resource links -->

        <div class="catalog-card-actions">
          ${actionLinksMarkup}
        </div>

      </div>

      <!-- Dataset metadata -->

      <dl class="catalog-card-metadata">

        <div class="metadata-item">
          <dt>Last updated</dt>
          <dd>${updatedDate}</dd>
        </div>

        ${fieldCountMarkup}
        ${coverageMarkup}
        ${formatMarkup}

      </dl>

    </div>

    <!-- Dataset tags -->

    <footer class="catalog-card-footer">

      <span class="tags-label">
        Tags
      </span>

      <div class="catalog-card-tags">
        ${tagMarkup}
      </div>

    </footer>
  `;

  bindCardTagButtons(card);

  return card;
}

/* =========================================================
   CATALOG CARD ACTION LINKS
========================================================= */

function createCatalogActionLinks(dataset) {
//checking if dashboard url exists

  const dashboardURL =
    dataset.dashboard?.pageUrl ||
    dataset.dashboard?.embedUrl;

  const dataDownloadURL = dataset.source?.url;
  const sourceDataURL = dataset.sourceData?.url;

  const links = [];

  if (dashboardURL) {
    links.push(`
      <a
        class="catalog-action-link dashboard-action"
        href="${escapeHTML(dashboardURL)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Dashboard

        <span aria-hidden="true">
          ↗
        </span>
      </a>
    `);
  }

  if (dataDownloadURL) {
    links.push(`
      <a
        class="catalog-action-link download-action"
        href="${escapeHTML(dataDownloadURL)}"
        download
      >
        <span aria-hidden="true">
          ↓
        </span>

        Download Data
      </a>
    `);
  }

  if (sourceDataURL) {
    links.push(`
      <a
        class="catalog-action-link source-action"
        href="${escapeHTML(sourceDataURL)}"
        download
      >
        <span aria-hidden="true">
          ↓
        </span>

        Source Data
      </a>
    `);
  }

  return links.join("");
}

/* =========================================================
   TAG MARKUP
========================================================= */

function createTagMarkup(tags) {
  if (!tags.length) {
    return `
      <span class="no-tags">
        No tags available
      </span>
    `;
  }

  return tags
    .map(tag => {
      return `
        <button
          type="button"
          class="dataset-tag"
          data-tag="${escapeHTML(tag)}"
          aria-label="Filter by ${escapeHTML(tag)}"
        >
          ${escapeHTML(tag)}
        </button>
      `;
    })
    .join("");
}

function bindCardTagButtons(card) {
  const tagButtons = card.querySelectorAll(
    ".dataset-tag"
  );

  tagButtons.forEach(button => {
    button.addEventListener("click", () => {
      setTag(button.dataset.tag);
    });
  });
}

/* =========================================================
   ACTIVE FILTER PILLS
========================================================= */

function renderActiveFilters() {
  const container = document.getElementById(
    "activeFilters"
  );

  const clearResultsLink = document.getElementById(
    "clear-all-results"
  );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const activeFilters = [];

  if (state.agency) {
    activeFilters.push({
      type: "agency",
      label: `Agency: ${state.agency}`
    });
  }

  state.tag.forEach(t => {
  activeFilters.push({
    type: "tag",
    value: t,
    label: `Tag: ${t}`
  });
});


  if (state.search) {
    activeFilters.push({
      type: "search",
      label: `Search: ${state.search}`
    });
  }

  activeFilters.forEach(filter => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "active-filter-pill";

    button.innerHTML = `
      <span>
        ${escapeHTML(filter.label)}
      </span>

      <span
        class="remove-filter-icon"
        aria-hidden="true"
      >
        ×
      </span>
    `;

    button.setAttribute(
      "aria-label",
      `Remove ${filter.label} filter`
    );

    button.addEventListener("click", () => {
      removeActiveFilter(filter.type, filter.value);
    });

    container.appendChild(button);
  });

  if (clearResultsLink) {
    clearResultsLink.hidden =
      activeFilters.length === 0;
  }
}

function removeActiveFilter(filterType, value) {
  if (filterType === "agency") {
    state.agency = null;
  }

  if (filterType === "tag") {
    state.tag = state.tag.filter(t => t !== value);
  }

  if (filterType === "search") {
    state.search = "";

    const searchInput = document.getElementById(
      "search"
    );

    if (searchInput) {
      searchInput.value = "";
    }
  }

  renderAll();
}

/* =========================================================
   SIDEBAR FILTERS
========================================================= */

function renderFilters() {
  const agencies = [
    ...new Set(
      datasets
        .map(dataset => dataset.agency)
        .filter(Boolean)
    )
  ].sort();


  const tags = [
    ...new Set(
      datasets.flatMap(dataset => {
        return getDatasetTags(dataset);
      })
    )
  ].sort();

  renderFilterGroup(
    "agencyFilters",
    agencies,
    state.agency,
    setAgency
  );

  renderFilterGroup(
    "tagFilters",
    tags,
    state.tag,
    setTag
  );
}

function renderFilterGroup(
  containerId,
  items,
  activeValue,
  handler
) {
  const isActive = (item) => Array.isArray(activeValue)
  ? activeValue.includes(item)
  : activeValue === item;

  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  container.innerHTML = "";

  items.forEach(item => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "filter-item";
    button.dataset.value = item;

    button.innerHTML = `
      <span
        class="filter-circle"
        aria-hidden="true"
      ></span>

      <span class="filter-item-label">
        ${escapeHTML(item)}
      </span>
    `;

    button.classList.toggle(
      "active",
      isActive(item)
    );

    button.setAttribute(
      "aria-pressed",
      String(isActive(item))
    );

    button.addEventListener("click", () => {
      handler(item);
    });

    container.appendChild(button);
  });
}

/* =========================================================
   FILTER ACTIONS
========================================================= */

function setAgency(value) {
  state.agency =
    state.agency === value
      ? null
      : value;

  renderAll();
}

function setTag(value) {
  state.tag = state.tag.includes(value)
    ? state.tag.filter(t => t !== value)
    : [...state.tag, value];
  renderAll();
}


/* =========================================================
   DATASET HELPERS
========================================================= */

function getDatasetTags(dataset) {
  return Array.isArray(dataset.tags)
    ? dataset.tags
    : [];
}

function getDatasetFormat(dataset) {
  if (dataset.format) {
    return String(dataset.format).toUpperCase();
  }

  if (dataset.source?.type) {
    return String(
      dataset.source.type
    ).toUpperCase();
  }

  if (dataset.source?.format) {
    return String(
      dataset.source.format
    ).toUpperCase();
  }

  return "";
}

/* =========================================================
   DATE FORMATTING
========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not specified";
  }

  const originalValue = String(dateValue);

  const normalizedValue =
    /^\d{4}-\d{2}-\d{2}$/.test(originalValue)
      ? `${originalValue}T00:00:00`
      : originalValue;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return escapeHTML(originalValue);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/* =========================================================
   EMPTY RESULTS
========================================================= */

function renderEmptyResults(container) {
  container.innerHTML = `
    <div class="empty-results">

      <h3>No datasets found</h3>

      <p>
        Try changing your search or clearing
        the selected filters.
      </p>

      <button
        type="button"
        class="empty-clear-button"
      >
        Clear all filters
      </button>

    </div>
  `;

  const clearButton = container.querySelector(
    ".empty-clear-button"
  );

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      resetState();
      renderAll();
    });
  }
}

/* =========================================================
   LOAD ERROR
========================================================= */

function renderLoadError() {
  const resultsMeta = document.getElementById(
    "resultsMeta"
  );

  const container = document.getElementById(
    "datasetList"
  );

  if (resultsMeta) {
    resultsMeta.textContent =
      "Datasets could not be loaded";
  }

  if (container) {
    container.innerHTML = `
      <div class="empty-results error-message">

        <h3>
          Unable to load the data catalog
        </h3>

        <p>
          Please refresh the page and try again.
        </p>

      </div>
    `;
  }
}

/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}