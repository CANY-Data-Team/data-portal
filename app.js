
/* =========================================================
   STATE
========================================================= */

let datasets = [];
// This is an 'array'; equivalent to a list 

const state = {
  search: "",
  agency: null,
  tag: null
};
// This is an object; update property by state.search = "hello"

/* =========================================================
   BOOTSTRAP
========================================================= */

init(); // Calls the init function to start setting up the webpage

function init() { // Defines the init function; this code runs whenever init() is called
  loadData();     // Calls loadData() to retrieve the dataset and display its contents
  bindEvents();   // Calls bindEvents() to make the page respond to user actions
}                // Ends the init function

/* =========================================================
   DATA LOADING
========================================================= */

async function loadData() { 
  // Defines an asynchronous function named loadData.
  // "async" allows the function to use "await."

  const res = await fetch("./data/datasets.json"); 
  // Requests the datasets.json file.
  // "await" pauses this function until the response arrives.
  // The response is stored in the constant named res.

  datasets = await res.json(); 
  // Reads the response and converts the JSON into JavaScript data.
  // "await" pauses until that conversion is complete.
  // The converted data is assigned to the previously declared datasets variable.

  renderAll(); 
  // Calls renderAll() after the data is ready.
  // This displays or updates the webpage using the loaded datasets.
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

// Defines a function that filters and ranks the datasets.
function getFilteredResults() {

  // Returns the final array produced by the filtering, mapping, and sorting steps.
  return datasets

    // Starts by filtering datasets according to the selected agency and tag.
    .filter(d => {

      // If an agency is selected and the dataset has a different agency,
      // removes the dataset from the results.
      if (state.agency && d.agency !== state.agency) return false;

      // If a tag is selected and the dataset does not include that tag,
      // removes the dataset from the results.
      if (state.tag && !d.tags.includes(state.tag)) return false;

      // Keeps the dataset if it passes both filter checks.
      return true;
    })

    // Creates a new version of every remaining dataset object.
    .map(d => ({

      // Copies all properties from the original dataset into the new object.
      ...d,

      // Adds a score property based on how well the dataset matches the search.
      score: scoreDataset(d, state.search)
    }))

    // Keeps only datasets with a search-match score greater than zero.
    .filter(d => d.score > 0)

    // Sorts the datasets from the highest score to the lowest score.
    .sort((a, b) => b.score - a.score);
}


/* Although it looks like it returns datasets immediately, JavaScript treats the connected lines as one long expression: 
return datasets.filter(...).map(...).filter(...).sort(...);
The process is: 

datasets
   ↓
.filter()   removes datasets with the wrong agency or tag
   ↓
.map()      adds a search score to each remaining dataset
   ↓
.filter()   removes datasets with a score of 0
   ↓
.sort()     orders datasets from highest to lowest score
   ↓
return      sends the final array back


*/
function scoreDataset(d, query) {
  // If the search box is empty, give every dataset a score of 1.
  // This prevents all datasets from being removed later by:
  // .filter(d => d.score > 0)
  if (!query) return 1;

  // Combine several dataset fields into one searchable string.
  const text = (
    d.title + " " +
    d.description + " " +
    d.contextstatement + " " +

    // d.tags is an array, such as:
    // ["prisons", "population"]
    // .join(" ") turns it into:
    // "prisons population"
    d.tags.join(" ")
  )

  // Convert the combined text to lowercase so the search
  // does not depend on capitalization.
  .toLowerCase();

  // Start this dataset's search score at zero.
  let score = 0;

  // If the query appears in the dataset title, add 5 points.
  if (d.title.toLowerCase().includes(query)) {
    score += 5;
  }

  // If the query appears in the agency name, add 3 points.
  if (d.agency.toLowerCase().includes(query)) {
    score += 3;
  }

  // If the query appears anywhere in the combined text,
  // add 1 additional point.
  if (text.includes(query)) {
    score += 1;
  }

  // Send the final score back to the code that called this function.
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