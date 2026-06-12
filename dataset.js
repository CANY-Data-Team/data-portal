const id = new URLSearchParams(window.location.search).get("id");

fetch("./data/datasets.json")
  .then(r => r.json())
  .then(data => {

    const d = data.find(x => x.id === id);

    document.getElementById("title").innerText = d.title;
    document.getElementById("desc").innerText = d.description;

    document.getElementById("meta").innerHTML = `
      <p><b>Category:</b> ${d.category}</p>
      <p><b>Updated:</b> ${d.updated}</p>
    `;

    document.getElementById("download").href = d.source.url;

    renderFields(d.fields);

    loadPreview(d.source.url);
  });

function renderFields(fields) {
  const table = document.getElementById("fields");

  table.innerHTML = fields.map(f => `
    <tr>
      <td>${f.name}</td>
      <td>${f.label}</td>
      <td>${f.type}</td>
    </tr>
  `).join("");
}

function loadPreview(url) {
  fetch(url)
    .then(r => r.text())
    .then(csv => {

      const rows = csv.split("\n").slice(0, 6);

      document.getElementById("preview").innerHTML =
        `<pre>${rows.join("\n")}</pre>`;
    });
}