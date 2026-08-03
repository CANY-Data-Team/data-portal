/* =========================================================
   ENTRY POINT
========================================================= */

initDatasetPage();

function initDatasetPage() {
  const id = getDatasetIdFromURL();

  bindDatasetTabs();
  loadDataset(id);
}

/* =========================================================
   DATA LOADING
========================================================= */

async function loadDataset(id) {
  try {
    const datasets = await fetchDatasets();

    const dataset = datasets.find(currentDataset => {
      return currentDataset.id === id;
    });

    if (!dataset) {
      renderNotFound(id);
      return;
    }

    renderDataset(dataset);

    if (dataset.source?.url) {
      loadPreview(dataset.source.url);
    }
  } catch (error) {
    console.error(
      "Unable to load the dataset:",
      error
    );

    renderLoadError();
  }
}

async function fetchDatasets() {
  const response = await fetch(
    "./data/datasets.json"
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load datasets.json: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   URL HELPERS
========================================================= */

function getDatasetIdFromURL() {
  const parameters = new URLSearchParams(
    window.location.search
  );

  return parameters.get("id");
}

/* =========================================================
   RENDER MAIN DATASET PAGE
========================================================= */

function renderDataset(dataset) {
  setText("title", dataset.title);
  setText("description", dataset.description);
  setText("whatsincluded", dataset.whatsincluded);
  setText("howitsgenerated", dataset.howitsgenerated);
  setText("limitations", dataset.limitations);
  setText("whypublish", dataset.whypublish);

  setMetadata(
    "agency",
    "Source Agency:",
    dataset.agency
  );

  setMetadata(
    "updatedt",
    "Updated:",
    formatDate(dataset.updatedt)
  );

  // Processed CANY dataset download
  configureDownloadLink(
    dataset.source?.url
  );

  // CANY dashboard
  configureDashboardLink(
    dataset.dashboard?.pageUrl ||
    dataset.dashboard?.embedUrl
  );

  // Original source-data ZIP archive
  configureSourceDataLink(
    dataset.sourceData?.url
  );

  renderFieldsTable(dataset.fields);

  // Dashboard is no longer passed into Related Content.
  renderRelatedContent(dataset.relatedlinks);
}

/* =========================================================
   DATASET METADATA
========================================================= */

function setMetadata(
  elementId,
  label,
  value
) {
  const element =
    document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.replaceChildren();

  if (!value) {
    return;
  }

  const paragraph =
    document.createElement("p");

  const labelElement =
    document.createElement("strong");

  labelElement.textContent = `${label} `;

  paragraph.appendChild(labelElement);

  paragraph.appendChild(
    document.createTextNode(value)
  );

  element.appendChild(paragraph);
}

/* =========================================================
   PROCESSED DATA DOWNLOAD
========================================================= */

function configureDownloadLink(url) {
  const downloadLink =
    document.getElementById("download");

  configureOptionalLink(
    downloadLink,
    url
  );
}

/* =========================================================
   DASHBOARD LINK
========================================================= */

function configureDashboardLink(url) {
  const dashboardLink =
    document.getElementById("dashboard-link");

  configureOptionalLink(
    dashboardLink,
    url
  );
}

/* =========================================================
   SOURCE DATA DOWNLOAD
========================================================= */

function configureSourceDataLink(url) {
  const sourceDataLink =
    document.getElementById(
      "source-data-download"
    );

  configureOptionalLink(
    sourceDataLink,
    url
  );
}

/* =========================================================
   OPTIONAL LINK HELPER
========================================================= */

function configureOptionalLink(
  link,
  url
) {
  if (!link) {
    return;
  }

  if (!url) {
    link.hidden = true;
    link.removeAttribute("href");
    return;
  }

  link.href = url;
  link.hidden = false;
}

/* =========================================================
   ERROR STATES
========================================================= */

function renderNotFound(id) {
  const container = document.querySelector(
    ".dataset-page .container"
  );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const heading =
    document.createElement("h1");

  const message =
    document.createElement("p");

  const backLink =
    document.createElement("a");

  heading.textContent = "Dataset not found";

  message.textContent = id
    ? `No dataset was found with the ID "${id}".`
    : "No dataset ID was provided in the URL.";

  backLink.href = "index.html";
  backLink.className = "back-link";
  backLink.textContent = "← Back to datasets";

  container.appendChild(heading);
  container.appendChild(message);
  container.appendChild(backLink);
}

function renderLoadError() {
  const container = document.querySelector(
    ".dataset-page .container"
  );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const heading =
    document.createElement("h1");

  const message =
    document.createElement("p");

  const backLink =
    document.createElement("a");

  heading.textContent =
    "Unable to load dataset";

  message.textContent =
    "The dataset information could not be loaded. Please try again.";

  backLink.href = "index.html";
  backLink.className = "back-link";
  backLink.textContent = "← Back to datasets";

  container.appendChild(heading);
  container.appendChild(message);
  container.appendChild(backLink);
}

/* =========================================================
   FIELDS / DATA DICTIONARY
========================================================= */

function renderFieldsTable(fields = []) {
  const table =
    document.getElementById("fields");

  if (!table) {
    return;
  }

  table.replaceChildren();

  const tableHead =
    document.createElement("thead");

  const headingRow =
    document.createElement("tr");

  const headings = [
    "Field name",
    "Description",
    "Data type"
  ];

  headings.forEach(heading => {
    const tableHeading =
      document.createElement("th");

    tableHeading.scope = "col";
    tableHeading.textContent = heading;

    headingRow.appendChild(tableHeading);
  });

  tableHead.appendChild(headingRow);
  table.appendChild(tableHead);

  const tableBody =
    document.createElement("tbody");

  if (!Array.isArray(fields) || !fields.length) {
    const row =
      document.createElement("tr");

    const cell =
      document.createElement("td");

    cell.colSpan = headings.length;

    cell.textContent =
      "No field definitions are available.";

    row.appendChild(cell);
    tableBody.appendChild(row);
  } else {
    fields.forEach(field => {
      const row =
        document.createElement("tr");

      appendTableCell(
        row,
        field.name
      );

      appendTableCell(
        row,
        field.description ||
        field.label
      );

      appendTableCell(
        row,
        field.type
      );

      tableBody.appendChild(row);
    });
  }

  table.appendChild(tableBody);
}

function appendTableCell(
  row,
  value
) {
  const cell =
    document.createElement("td");

  cell.textContent = value ?? "";

  row.appendChild(cell);
}

/* =========================================================
   RELATED CONTENT
========================================================= */

function renderRelatedContent(relatedLinks) {
  const container =
    document.getElementById("relatedlinks");

  if (!container) {
    return;
  }

  container.replaceChildren();

  const items =
    normalizeRelatedLinks(relatedLinks);

  if (!items.length) {
    const message =
      document.createElement("p");

    message.textContent =
      "No related content is available.";

    container.appendChild(message);
    return;
  }

  const list =
    document.createElement("ul");

  list.className = "related-links-list";

  items.forEach(item => {
    const listItem =
      document.createElement("li");

    if (
      typeof item === "object" &&
      item !== null
    ) {
      renderRelatedLinkObject(
        listItem,
        item
      );
    } else {
      listItem.textContent =
        String(item);
    }

    list.appendChild(listItem);
  });

  container.appendChild(list);
}

/* =========================================================
   NORMALIZE RELATED LINKS
========================================================= */

function normalizeRelatedLinks(relatedLinks) {
  if (!relatedLinks) {
    return [];
  }

  if (Array.isArray(relatedLinks)) {
    return relatedLinks.filter(item => {
      if (
        typeof item === "object" &&
        item !== null
      ) {
        return true;
      }

      return String(item).trim() !== "";
    });
  }

  return String(relatedLinks)
    .split(/(?:^|\s+)-\s+/)
    .map(item => item.trim())
    .filter(Boolean);
}

/* =========================================================
   RELATED LINK OBJECTS
========================================================= */

function renderRelatedLinkObject(
  listItem,
  item
) {
  const label =
    item.title ||
    item.label ||
    item.name ||
    item.url;

  if (!item.url) {
    listItem.textContent =
      label || "";

    return;
  }

  const anchor =
    document.createElement("a");

  anchor.href = item.url;

  anchor.textContent =
    label || "View related content";

  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  listItem.appendChild(anchor);

  if (item.description) {
    listItem.appendChild(
      document.createTextNode(
        `: ${item.description}`
      )
    );
  }
}

/* =========================================================
   DATA PREVIEW
========================================================= */

async function loadPreview(url) {
  const previewTable =
    document.getElementById("preview");

  if (!previewTable) {
    return;
  }

  try {
    const text = await fetchText(url);

    const cleanedText =
      cleanText(text);

    if (!cleanedText) {
      renderPreviewMessage(
        "No preview data is available."
      );

      return;
    }

    const delimiter =
      detectDelimiter(cleanedText);

    const rows =
      parseDelimited(
        cleanedText,
        delimiter
      );

    renderPreviewTable(rows);
  } catch (error) {
    console.error(
      "Unable to load data preview:",
      error
    );

    renderPreviewMessage(
      "The data preview could not be loaded."
    );
  }
}

/* =========================================================
   FETCH HELPERS
========================================================= */

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load preview data: ${response.status}`
    );
  }

  return response.text();
}

/* =========================================================
   TEXT CLEANING
========================================================= */

function cleanText(text) {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim();
}

/* =========================================================
   DELIMITER DETECTION
========================================================= */

function detectDelimiter(text) {
  const firstLine =
    text.split("\n")[0];

  const delimiterCounts = {
    "|": countOccurrences(firstLine, "|"),
    ",": countOccurrences(firstLine, ","),
    "\t": countOccurrences(firstLine, "\t")
  };

  return Object.entries(delimiterCounts)
    .reduce(
      (
        bestDelimiter,
        currentDelimiter
      ) => {
        return currentDelimiter[1] >
          bestDelimiter[1]
          ? currentDelimiter
          : bestDelimiter;
      }
    )[0];
}

function countOccurrences(
  text,
  character
) {
  return text.split(character).length - 1;
}

/* =========================================================
   DELIMITED TEXT PARSING
========================================================= */

function parseDelimited(
  text,
  delimiter
) {
  return text
    .split("\n")
    .map(row => {
      return parseDelimitedRow(
        row,
        delimiter
      );
    })
    .filter(row => {
      return row.some(cell => {
        return cell.trim() !== "";
      });
    });
}

function parseDelimitedRow(
  row,
  delimiter
) {
  const cells = [];

  let currentCell = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < row.length;
    index += 1
  ) {
    const character =
      row[index];

    const nextCharacter =
      row[index + 1];

    if (
      character === "\"" &&
      insideQuotes &&
      nextCharacter === "\""
    ) {
      currentCell += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (
      character === delimiter &&
      !insideQuotes
    ) {
      cells.push(
        currentCell.trim()
      );

      currentCell = "";

      continue;
    }

    currentCell += character;
  }

  cells.push(
    currentCell.trim()
  );

  return cells;
}

/* =========================================================
   PREVIEW TABLE RENDERING
========================================================= */

function renderPreviewTable(rows) {
  const table =
    document.getElementById("preview");

  if (!table) {
    return;
  }

  table.replaceChildren();

  if (!rows.length) {
    renderPreviewMessage(
      "No preview data is available."
    );

    return;
  }

  const previewRows =
    rows.slice(0, 10);

  const tableHead =
    document.createElement("thead");

  const tableBody =
    document.createElement("tbody");

  previewRows.forEach(
    (row, rowIndex) => {
      const tableRow =
        document.createElement("tr");

      row.forEach(cellValue => {
        const cell =
          document.createElement(
            rowIndex === 0
              ? "th"
              : "td"
          );

        cell.textContent = cellValue;

        if (rowIndex === 0) {
          cell.scope = "col";
        }

        tableRow.appendChild(cell);
      });

      if (rowIndex === 0) {
        tableHead.appendChild(tableRow);
      } else {
        tableBody.appendChild(tableRow);
      }
    }
  );

  table.appendChild(tableHead);
  table.appendChild(tableBody);
}

function renderPreviewMessage(message) {
  const table =
    document.getElementById("preview");

  if (!table) {
    return;
  }

  table.replaceChildren();

  const tableBody =
    document.createElement("tbody");

  const row =
    document.createElement("tr");

  const cell =
    document.createElement("td");

  cell.textContent = message;

  row.appendChild(cell);
  tableBody.appendChild(row);
  table.appendChild(tableBody);
}

/* =========================================================
   DATASET NAVIGATION TABS
========================================================= */

function bindDatasetTabs() {
  const tabs = document.querySelectorAll(
    ".dataset-tabs .tab"
  );

  const tabContents =
    document.querySelectorAll(
      ".tab-content"
    );

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const selectedTabId =
        tab.dataset.tab;

      const selectedContent =
        document.getElementById(
          selectedTabId
        );

      if (!selectedContent) {
        return;
      }

      tabs.forEach(currentTab => {
        const isSelected =
          currentTab === tab;

        currentTab.classList.toggle(
          "active",
          isSelected
        );

        currentTab.setAttribute(
          "aria-selected",
          String(isSelected)
        );
      });

      tabContents.forEach(content => {
        const isSelected =
          content === selectedContent;

        content.classList.toggle(
          "active",
          isSelected
        );

        content.hidden = !isSelected;
      });
    });
  });

  initializeTabAccessibility(
    tabs,
    tabContents
  );
}

function initializeTabAccessibility(
  tabs,
  tabContents
) {
  tabs.forEach(tab => {
    const isActive =
      tab.classList.contains("active");

    tab.setAttribute(
      "role",
      "tab"
    );

    tab.setAttribute(
      "aria-selected",
      String(isActive)
    );
  });

  tabContents.forEach(content => {
    const isActive =
      content.classList.contains("active");

    content.setAttribute(
      "role",
      "tabpanel"
    );

    content.hidden = !isActive;
  });
}

/* =========================================================
   DATE FORMATTING
========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const originalValue =
    String(dateValue);

  const normalizedValue =
    /^\d{4}-\d{2}-\d{2}$/.test(
      originalValue
    )
      ? `${originalValue}T00:00:00`
      : originalValue;

  const date =
    new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return originalValue;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}

/* =========================================================
   SMALL UTILITIES
========================================================= */

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value ?? "";
  }
}