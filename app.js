let datasets = [];
let state = {
  search: "",
  category: null,
  tag: null
};

fetch("./data/datasets.json")
  .then(r => r.json())
  .then(data => {
    datasets = data;
    render();
    buildFilters();
  });

document.getElementById("search").addEventListener("input", (e) => {
  state.search = e.target.value.toLowerCase();
  render();
});

function scoreDataset(d, query) {
  let score = 0;

  if (!query) return 1;

  const text = (
    d.title + " " +
    d.description + " " +
    d.tags.join(" ")
  ).toLowerCase();

  if (d.title.toLowerCase().includes(query)) score += 5;
  if (d.category.toLowerCase().includes(query)) score += 3;
  if (text.includes(query)) score += 1;

  return score;
}

function render() {
  let results = datasets
    .filter(d => {
      if (state.category && d.category !== state.category) return false;
      if (state.tag && !d.tags.includes(state.tag)) return false;
      return true;
    })
    .map(d => ({
      ...d,
      score: scoreDataset(d, state.search)
    }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);

  document.getElementById("resultsMeta").innerText =
    `${results.length} datasets`;

  const container = document.getElementById("datasetList");
  container.innerHTML = "";

  results.forEach(d => {
    const el = document.createElement("div");
    el.className = "card";

    el.innerHTML = `
      <a href="dataset.html?id=${d.id}">
        <h2>${d.title}</h2>
      </a>

      <p>${d.description}</p>

      <div class="meta">
        ${d.category} • Updated ${d.updated}
      </div>

      <div class="tags">
        ${d.tags.map(t => `<span class="tag">${t}</span>`).join(" ")}
      </div>
    `;

    container.appendChild(el);
  });
}

function buildFilters() {
  const categories = [...new Set(datasets.map(d => d.category))];
  const tags = [...new Set(datasets.flatMap(d => d.tags))];

  document.getElementById("categoryFilters").innerHTML =
    categories.map(c =>
      `<button onclick="setCategory('${c}')">${c}</button>`
    ).join("");

  document.getElementById("tagFilters").innerHTML =
    tags.map(t =>
      `<button onclick="setTag('${t}')">${t}</button>`
    ).join("");
}

window.setCategory = (c) => {
  state.category = c;
  render();
};

window.setTag = (t) => {
  state.tag = t;
  render();
};