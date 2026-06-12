const id = new URLSearchParams(window.location.search).get("id");

fetch("./data/datasets.json")
  .then(r => r.json())
  .then(data => {

    const d = data.find(x => x.id === id);

    if (!d) {
      document.body.innerHTML = `
        <h2>Dataset not found</h2>
        <p>ID: ${id}</p>
      `;
      return;
    }

    document.getElementById("title").innerText = d.title;
    document.getElementById("desc").innerText = d.description;
  });

  console.log("URL ID:", id);
  console.log("DATASET FOUND:", d);