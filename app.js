let datasets = [];
let filtered = [];

fetch("./data/datasets.json")
  .then(res => res.json())
  .then(data => {
    datasets = data;
    filtered = data;
    render();
  });

document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();

  filtered = datasets.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q)
  );

  render();
});

function render() {
  const container = document.getElementById("datasetList");
  container.innerHTML = "";

  filtered.forEach(d => {
    const el = document.createElement("div");
    el.className = "dataset-card";

    el.innerHTML = `
      <div class="dataset-title">
        <a href="dataset.html?id=${d.id}">${d.title}</a>
      </div>
      <div>${d.description}</div>
      <div class="meta">
        Category: ${d.category} | Updated: ${d.updated}
      </div>
    `;

    container.appendChild(el);
  });
}