
/* =========================================================
   ENTRY POINT
========================================================= */

initDatasetPage();

function initDatasetPage() {
  const id = getDatasetIdFromURL();

  console.log("URL ID:", id);

  loadDataset(id);
}

/* =========================================================
   DATA LOADING
========================================================= */

async function loadDataset(id) {
  const data = await fetchDatasets();

  const dataset = data.find(d => d.id === id);

  console.log("DATASET FOUND:", dataset);

  if (!dataset) {
    renderNotFound(id);
    return;
  }

  renderDataset(dataset);
  loadPreview(dataset.source.url);
}

async function fetchDatasets() {
  const res = await fetch("./data/datasets.json");
  return await res.json();
}

/* =========================================================
   URL HELPERS
========================================================= */

function getDatasetIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

/* =========================================================
   RENDER: MAIN DATASET PAGE
========================================================= */

function renderDataset(d) {
  setText("title", d.title);
  setText("description", d.description);
  setText("whatsincluded", d.whatsincluded);
  setText("howitsgenerated", d.howitsgenerated);
  setText("limitations", d.limitations);
  setText("whypublish", d.whypublish);
  setText("relatedlinks", d.relatedlinks);

  setHTML("agency", `
    <p><b>Source Agency:</b> ${d.agency}</p>
  `);

  setHTML("updatedt", `
    <p><b>Updated:</b> ${d.updatedt}</p>
  `);

  const download = document.getElementById("download");
  if (download) download.href = d.source.url;

  renderFieldsTable(d.fields);
}

/* =========================================================
   RENDER: ERROR STATE
========================================================= */

function renderNotFound(id) {
  document.body.innerHTML = `
    <div class="container">
      <h2>Dataset not found</h2>
      <p><b>ID:</b> ${id}</p>
    </div>
  `;
}

/* =========================================================
   FIELDS TABLE (SCHEMA)
========================================================= */

function renderFieldsTable(fields = []) {
  const table = document.getElementById("fields");
  if (!table) return;

  table.innerHTML = fields.map(f => `
    <tr>
      <td>${f.name}</td>
      <td>${f.label}</td>
      <td>${f.type}</td>
    </tr>
  `).join("");
}

/* =========================================================
   PREVIEW PIPELINE
========================================================= */

async function loadPreview(url) {
  const text = await fetchText(url);

  const cleaned = cleanText(text);
  const delimiter = detectDelimiter(cleaned);

  console.log("DETECTED DELIMITER:", delimiter);

  const rows = parseDelimited(cleaned, delimiter);

  console.log("FIRST ROW:", rows[0]);

  renderPreviewTable(rows);
}

/* =========================================================
   FETCH HELPERS
========================================================= */

async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}

/* =========================================================
   TEXT CLEANING
========================================================= */

function cleanText(text) {
  return text
    .replace(/^\uFEFF/, "") // BOM
    .replace(/\r/g, "")     // Windows line endings
    .trim();
}

/* =========================================================
   DELIMITED PARSING
========================================================= */

function detectDelimiter(text) {
  const line = text.split("\n")[0];

  const counts = {
    "|": (line.match(/\|/g) || []).length,
    ",": (line.match(/,/g) || []).length,
    "\t": (line.match(/\t/g) || []).length
  };

  return Object.entries(counts)
    .reduce((best, current) =>
      current[1] > best[1] ? current : best
    )[0];
}

function parseDelimited(text, delimiter) {
  return text
    .split("\n")
    .map(r => r.split(delimiter))
    .filter(r => r.length > 1);
}

/* =========================================================
   TABLE RENDERING (PREVIEW)
========================================================= */

function renderPreviewTable(rows) {
  const table = document.createElement("table");

  rows.slice(0, 10).forEach((row, i) => {
    const tr = document.createElement("tr");

    row.forEach(cell => {
      const td = document.createElement(i === 0 ? "th" : "td");
      td.textContent = cell;
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  const wrapper = document.createElement("div");
  wrapper.className = "table-wrapper";
  wrapper.appendChild(table);

  const preview = document.getElementById("preview");

  if (preview) {
    preview.innerHTML = "";
    preview.appendChild(wrapper);
  }
}

/* =========================================================
   SMALL UTILITIES
========================================================= */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? "";
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html ?? "";
}