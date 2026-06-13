
/* =========================================================
   STATE
========================================================= */

let datasets = [];

const state = {
  search: "",
  agency: null,
  tag: null
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
  state.tag = null;

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
      if (state.tag && !d.tags.includes(state.tag)) return false;
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
  const agencies = [...new Set(datasets.map(d => d.agency))];
  const tags = [...new Set(datasets.flatMap(d => d.tags))];

  renderFilterGroup("agencyFilters", agencies, state.agency, setAgency);
  renderFilterGroup("tagFilters", tags, state.tag, setTag);
}

function renderFilterGroup(containerId, items, activeValue, handler) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="filter-item ${activeValue === item ? "active" : ""}"
         data-value="${item}">
      ${item}
    </div>
  `).join("");

  // event delegation (cleaner than inline onclick)
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

function setTag(value) {
  state.tag = (state.tag === value) ? null : value;
  renderAll();
}

/* =========================================================
   INITIAL RENDER
========================================================= */

renderAll();