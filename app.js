/* =========================================================
   STATE
========================================================= */

let datasets = [];

/*multi select filters*/
const state = {
  search: "",
  agency: null,
  unit: null,
  tag: [],
  universalTag: []
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
  const searchInput = document.getElementById("search");

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", event => {
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
  state.universalTag = [];
  state.unit = null;

  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.value = "";
  }
}

/* =========================================================
   FILTERING AND SEARCH SCORING
========================================================= */

function getFilteredResults() {
  return datasets

    // Apply agency and tag filters.
    .filter(dataset => {
      if (
        state.agency &&
        dataset.agency !== state.agency
      ) {
        return false;
      }

      if (
        state.tag &&
        !getDatasetTags(dataset).includes(state.tag)
      ) {
        return false;
      }

      return true;
      if (
            state.unit && dataset.unit !== state.unit
        ) 
            return false;
    if (
        state.tag.length > 0 && !state.tag.every(t => getDatasetTags(dataset).includes(t))
        ) {
        return false;
        }
    if (
        state.universalTag.length > 0 && !state.universalTag.every(t => (dataset.universalTags || []).includes(t))
    ) {
        return false;
}

    })

    // Add a search score.
    .map(dataset => ({
      ...dataset,
      score: scoreDataset(dataset, state.search)
    }))

    // Remove datasets that do not match.
    .filter(dataset => dataset.score > 0)

    // Sort strongest matches first.
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return String(a.title || "").localeCompare(
        String(b.title || "")
      );
    });
}

function scoreDataset(dataset, query) {
  if (!query) {
    return 1;
  }

  //NEXT: this is where to add the multiple panels / cards?
  const title = String(dataset.title || "");
  const agency = String(dataset.agency || "");
  const description = String(dataset.description || "");
  const context = String(
    dataset.contextstatement || ""
  );

  //Handles missing tags
  const tags = getDatasetTags(dataset).join(" ");

  const searchableText = `
    ${title}
    ${agency}
    ${description}
    ${context}
    ${tags}
    //NEXT: universalTags?
  `.toLowerCase();

  let score = 0;

  if (title.toLowerCase().includes(query)) {
    score += 5;
  }

  if (agency.toLowerCase().includes(query)) {
    score += 3;
  }

  if (searchableText.includes(query)) {
    score += 1;
  }

  return score;
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

          <div class="details-notice-text">

            <strong>
              Dataset detail page
            </strong>

            <span>
              View methodology, limitations, field definitions,
              a data preview, and related resources.
            </span>

          </div>

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

state.universalTag.forEach(t => {
  activeFilters.push({
    type: "universalTag",
    value: t,
    label: `Universal Tag: ${t}`
  });
});

if (state.unit) {
  activeFilters.push({
    type: "unit",
    label: `Unit: ${state.unit}`
  });
}

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

  if (filterType === "universalTag") {
    state.universalTag = state.universalTag.filter(t => t !== value);
  }

  if (filterType === "unit") {
    state.unit = null;
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

const units = [...new Set(datasets.map(d => d.unit).filter(Boolean))].sort();
const universalTags = [...new Set(datasets.flatMap(d => d.universalTags || []))].sort();

function setUnit(value) {
  state.unit = (state.unit === value) ? null : value;
  renderAll();
}

function setTag(value) {
  state.tag = state.tag.includes(value)
    ? state.tag.filter(t => t !== value)
    : [...state.tag, value];
  renderAll();
}

function setUniversalTag(value) {
  state.universalTag = state.universalTag.includes(value)
    ? state.universalTag.filter(t => t !== value)
    : [...state.universalTag, value];
  renderAll();
}

//NEXT: add <div id="unitFilters"> and <div id="universalTagFilters"> to sidebar in index.html
renderFilterGroup("unitFilters", units, state.unit, setUnit);
renderFilterGroup("universalTagFilters", universalTags, state.universalTag, setUniversalTag);

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
  state.tag =
    state.tag === value
      ? null
      : value;

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