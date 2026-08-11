/* =========================================================
   ENTRY POINT
========================================================= */

initDatasetPage();

function initDatasetPage() {
    bindTabs();
    
    const id = getDatasetIdFromURL();
    
    console.log("URL ID:", id);
    
    loadDataset(id);
}


/* =========================================================
   TAB SWITCHING
========================================================= */
 
function bindTabs() {
  const tabButtons = document.querySelectorAll(".tab");
 
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab);
    });
  });
}
 
function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach(button => {
    const isActive = button.dataset.tab === tabName;
 
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
 
  document.querySelectorAll(".tab-content").forEach(section => {
    const isActive = section.id === tabName;
 
    section.classList.toggle("active", isActive);
    section.hidden = !isActive;
  });
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
  renderRelatedLinks(d.relatedlinks);

  setHTML("agency", `
    <p><b>Source Agency:</b> ${d.agency}</p>
  `);

  setHTML("updatedt", `
    <p><b>Updated:</b> ${d.updatedt}</p>
  `);

  renderActionLinks(d);
 
  renderFieldsTable(d.fields);
}


/* =========================================================
   ACTION LINKS (Download / Dashboard / Source Data)
========================================================= */
 
function renderActionLinks(d) {
  setActionLink("download", d.source?.url);
  setActionLink("dashboard-link", d.dashboard?.pageUrl || d.dashboard?.embedUrl);
  setActionLink("source-data-download", d.sourceData?.url);
}
 
function setActionLink(id, url) {
  const link = document.getElementById(id);
  if (!link) return;
 
  if (url) {
    link.href = url;
    link.hidden = false;
  } else {
    // hide the button if no URL to point to
    link.hidden = true;
  }
}

/* =========================================================
   RELATED LINKS
========================================================= */

function renderRelatedLinks(links = []) {
  const container = document.getElementById("relatedlinks");
  if (!container) return;

  if (!Array.isArray(links) || links.length === 0) {
    container.innerText = "No related resources listed.";
    return;
  }

  container.innerHTML = links.map(link => {
    const title = link.title || "Untitled resource";
    const description = link.description
      ? ` \u2014 ${link.description}`
      : "";

    if (link.url) {
      return `
        <p>
          <a href="${link.url}" target="_blank" rel="noopener noreferrer">
            ${title}
          </a>${description}
        </p>
      `;
    }

    // No URL available yet -- show as plain text rather than a dead link.
    return `<p><strong>${title}</strong>${description}</p>`;
  }).join("");
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
  const text = await fetchPreviewText(url);
 
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

async function fetchPreviewText(url) {
  // Only request the first ~50KB -- plenty for a header row plus
  // 10 preview rows, without downloading (and then parsing) a
  // multi-megabyte file just to throw away 99% of it.
  try {
    const res = await fetch(url, {
      headers: { Range: "bytes=0-50000" }
    });
 
    if (res.ok || res.status === 206) {
      return await res.text();
    }
  } catch (error) {
    console.warn("Range request failed, falling back to full fetch:", error);
  }
 
  return await fetchText(url);
}
 
async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}


/* =========================================================
   TEXT CLEANING
========================================================= */

function cleanText(text) {
  return text
    .replace(/^\uFEFF/, "") 
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