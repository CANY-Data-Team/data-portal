
/* =========================================================
   STATE
========================================================= */

let datasets = [];

const state = {
  search: "",
  agency: null,
  unit: null,
  tag: []
};

/* =========================================================
   BOOTSTRAP
========================================================= */

init();

function init() {
  loadData();
  bindEvents();
}

/* =========================================================
   DATA LOADING
========================================================= */

async function loadData() {
  const res = await fetch("./data/datasets.json");
  datasets = await res.json();

  renderAll();
}

/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {
  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.search = e.target.value.toLowerCase();
      renderResults();
    });
  }

  const clearBtn = document.getElementById("clear-all");

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetState();
      renderAll();
    });
  }
}

/* =========================================================
   STATE MANAGEMENT
========================================================= */

function resetState() {
  state.search = "";
  state.agency = null;
  state.tag = [];
  state.unit = null;

  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";
}

/* =========================================================
   FILTERING + SCORING
========================================================= */

function getFilteredResults() {
  return datasets
    .filter(d => {
      if (state.agency && d.agency !== state.agency) return false;
      if (state.unit && d.unit !== state.unit) return false;
      if (state.tag.length > 0 && !state.tag.every(t => d.tags.includes(t))) return false;

      return true;
    })
    .map(d => ({
      ...d,
      score: scoreDataset(d, state.search)
    }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);
}

function scoreDataset(d, query) {
  if (!query) return 1;

  const text = (
    d.title + " " +
    d.description + " " +
    d.contextstatement + " " +
    d.tags.join(" ")
  ).toLowerCase();

  let score = 0;

  if (d.title.toLowerCase().includes(query)) score += 5;
  if (d.agency.toLowerCase().includes(query)) score += 3;
  if (text.includes(query)) score += 1;

  return score;
}

/* =========================================================
   RENDER PIPELINE
========================================================= */

function renderAll() {
  renderResults();
  renderFilters();
}

function renderResults() {
  const results = getFilteredResults();

  const meta = document.getElementById("resultsMeta");
  if (meta) meta.innerText = `${results.length} dataset(s)`;

  const container = document.getElementById("datasetList");
  if (!container) return;

  container.innerHTML = "";

  results.forEach(d => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <a href="dataset.html?id=${d.id}">
        <h2>${d.title}</h2>
      </a>

      <p>${d.description}</p>

      <div class="agency">
        Agency: ${d.agency}
      </div>

      <div class="updatedt">
        Updated: ${d.updatedt}
      </div>

      <div class="tags">
      Tags:
        ${d.tags.map(t => `<span class="tag">${t}</span>`).join(" | ")}
      </div>
    `;

    container.appendChild(el);
  });
}

/* =========================================================
   FILTER RENDERING
========================================================= */

function renderFilters() {
/*insert universal tags here?*/
  const agencies = [...new Set(datasets.map(d => d.agency))];
  const tags = [...new Set(datasets.flatMap(d => d.tags))];
  const units = [...new Set(datasets.map(d => d.unit))]; 

  renderFilterGroup("agencyFilters", agencies, state.agency, setAgency);
  renderFilterGroup("unitFilters", units, state.unit, setUnit);
  renderFilterGroup("tagFilters", tags, state.tag, setTag);

}

function renderFilterGroup(containerId, items, activeValue, handler) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isActive = (item) => Array.isArray(activeValue)
    ? activeValue.includes(item)
    : activeValue === item;

  container.innerHTML = items.map(item => `
    <div class="filter-item ${isActive(item) ? "active" : ""}"
         data-value="${item}">
      ${item}
    </div>
  `).join("");

  container.querySelectorAll(".filter-item").forEach(el => {
    el.addEventListener("click", () => {
      handler(el.dataset.value);
    });
  });
}

/* =========================================================
   FILTER ACTIONS
========================================================= */

function setAgency(value) {
  state.agency = (state.agency === value) ? null : value;
  renderAll();
}

function setUnit(value) {
  state.unit = (state.unit === value) ? null : value;
  renderAll();
}

function setTag(value) {
  if (state.tag.includes(value)) {
    state.tag = state.tag.filter(t => t !== value);   // remove if already selected
  } else {
    state.tag = [...state.tag, value];                // add if not selected
  }
  renderAll();
}
/* =========================================================
   INITIAL RENDER
========================================================= */

renderAll();