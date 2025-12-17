const outfits = window.mypublishedOutfits || {};
let currentId = null;

document.querySelectorAll(".published-item").forEach(box => {
  box.addEventListener("click", () => {
    currentId = box.dataset.id;
    const o = outfits[currentId];
    if (!o) return;


    // preview rendering
    const container = document.getElementById("pub-preview");
    container.innerHTML = "";

    const base = document.createElement("img");
    base.className = "layer";
    base.src = "/assets/avatar/avatar.png";
    container.appendChild(base);

    const layers = ["hair", "top", "shoes", "pants", "skirt", "accessory"];
    layers.forEach(layer => {
      if (o[layer]) {
        const img = document.createElement("img");
        img.className = "layer";
        img.src = o[layer];
        img.style.filter = `hue-rotate(${o.hues?.[layer] || 0}deg)`;
        container.appendChild(img);
      }
    });

    // stats
    document.getElementById("stat-likes").innerText = o.likes || 0;
    document.getElementById("stat-dislikes").innerText = o.dislikes || 0;

    // delete
    document.getElementById("pub-delete-id").value = currentId;

    document.getElementById("pub-popup").classList.remove("hidden");

    //vote
    document.querySelector(".vote").addEventListener("click", e => gotoVote(currentId))
  });
});

// close popup when clicking background
document.getElementById("pub-popup").addEventListener("click", e => {
  if (e.target.id === "pub-popup") {
    e.target.classList.add("hidden");
  }
});

//vote

function gotoVote(id) {
  if (!id) return;
  const url = new URL("/voting", window.location.origin);
  url.searchParams.set("id", id);
  window.location.href = `${url.pathname}${url.search}`;
}
