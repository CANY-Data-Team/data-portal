const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("./data/datasets.json")
  .then(res => res.json())
  .then(data => {

    const dataset = data.find(d => d.id === id);

    document.getElementById("title").innerText = dataset.title;
    document.getElementById("description").innerText = dataset.description;

    document.getElementById("meta").innerHTML = `
      <p><b>Category:</b> ${dataset.category}</p>
      <p><b>Last updated:</b> ${dataset.updated}</p>
    `;

    document.getElementById("download").href = dataset.download_url;
  });