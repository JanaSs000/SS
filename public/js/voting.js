const ws = new WebSocket(`ws://${location.host}`);

ws.addEventListener("message", e => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }

    if (data.type === "voteUpdate") {
        applyVoteUpdate(data);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const likesOrderButton = document.querySelector(".most-liked-first");
    if (likesOrderButton) {
        likesOrderButton.addEventListener("click", sortLibraryByLikes);
    }

    const dislikesOrderButton = document.querySelector(".most-disliked-first");
    if (dislikesOrderButton) {
        dislikesOrderButton.addEventListener("click", sortLibraryByDislikes);
    }

    const outfitBoxes = document.querySelectorAll(".saved-thumb[data-id], .outfit-item[data-id]");
    outfitBoxes.forEach((box) => {
        box.addEventListener("click", () => handleOutfitSelection(box));
    });

    //like
    const like = document.querySelector(".like");
    if (!like) return;

    like.addEventListener("click", async () => {
        const target = document.querySelector(".like");
        if (target) {
            let ID = target.dataset.id;
            await likeOutfit(ID);
        }
    });

    //dislike
    const dislike = document.querySelector(".dislike");
    if (!dislike) return;

    dislike.addEventListener("click", async () => {
        const target = document.querySelector(".dislike");
        if (target) {
            let ID = target.dataset.id;
            await dislikeOutfit(ID);
        }
    });
});

async function likeOutfit(id) {
    try {
        const res = await fetch(`/voting/${id}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!data.ok) {
            // already liked
            return;
        }

        // success → update UI with new like count
        updateLikeCounts(data.id, data.published);

    } catch (err) {
        console.error("Like failed:", err);
    }
}

function updateLikeCounts(id, published) {
    const outfit = published[id];
    const likes = outfit.likes;

    // update DOM
    const likesEl = document.querySelector(".vote-counts .likes-count");
    if (likesEl) likesEl.textContent = `likes: ${likes}`;
    const thumb = document.querySelector(`.outfit-item[data-id="${id}"]`);
    if (thumb) {
        thumb.dataset.likes = likes;
    }

    // disable button so user cannot click again
    const btn = document.querySelector(`.like[data-id="${id}"]`);
    const dislikeBtn = document.querySelector(`.dislike[data-id="${id}"]`);
    if (btn) {
        btn.disabled = true;
        dislikeBtn.disabled = true;
        btn.textContent = "Liked";
    }
}

async function dislikeOutfit(id) {
    try {
        const res = await fetch(`/voting/${id}/dislike`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!data.ok) {
            // already disliked
            return;
        }

        // success → update UI with new like count
        updatedisLikeCounts(data.id, data.published);

    } catch (err) {
        console.error("disLike failed:", err);
    }
}

function updatedisLikeCounts(id, published) {
    const outfit = published[id];
    const dislikes = outfit.dislikes;

    // update DOM
    const dislikesEl = document.querySelector(".vote-counts .dislikes-count");
    if (dislikesEl) dislikesEl.textContent = `dislikes: ${dislikes}`;

    const thumb = document.querySelector(`.outfit-item[data-id="${id}"]`);
    if (thumb) {
        thumb.dataset.dislikes = dislikes;
    }

    // disable button so user cannot click again
    const btn = document.querySelector(`.dislike[data-id="${id}"]`);
    const likeBtn = document.querySelector(`.like[data-id="${id}"]`);
    if (btn) {
        btn.disabled = true;
        likeBtn.disabled = true;
        btn.textContent = "Disliked";
    }
}

async function handleOutfitSelection(box) {
    const { id } = box.dataset;
    if (!id) {
        return;
    }

    try {
        const payload = await fetch(`/voting/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        }).then((res) => res.json());

        updateCurrentOutfit(payload);
    } catch (error) {
        console.error("Unable to update outfit preview", error);
    }
}

function updateCurrentOutfit({ id, published }) {
    const current = published[id];
    const avatarBox = document.querySelector(".body-left-vote .avatar-box");
    const voteCounts = document.querySelector(".body-left-vote .vote-counts");
    const voteButtons = document.querySelectorAll(".vote-buttons .btn");

    if (!avatarBox || !voteCounts || voteButtons.length === 0) {
        return;
    }

    renderAvatarLayers(avatarBox, current);

    voteCounts.innerHTML = `
        <p class="likes-count">likes: ${current ? current.likes : 0}</p>
        <p class="dislikes-count">dislikes: ${current ? current.dislikes : 0}</p>
    `;

    //like
    const likedCookie = getCookie("liked_outfits");
    let likedIds = [];

    if (likedCookie) {
        try {
            likedIds = JSON.parse(decodeURIComponent(likedCookie));
        } catch {
            likedIds = [];
        }
    }

    const normalizedIds = likedIds.map(String);
    const isLiked = normalizedIds.includes(String(id));

    //dislike
    const dislikedCookie = getCookie("disliked_outfits");
    let dislikedIds = [];

    if (dislikedCookie) {
        try {
            dislikedIds = JSON.parse(decodeURIComponent(dislikedCookie));
        } catch {
            dislikedIds = [];
        }
    }

    const disnormalizedIds = dislikedIds.map(String);
    const isDisliked = disnormalizedIds.includes(String(id));

    voteButtons.forEach((btn) => {
        btn.dataset.id = id;
        if (btn.classList.contains("like")) {
            btn.textContent = isLiked ? "Liked" : "like";
            btn.disabled = isLiked;
        }

        if (btn.classList.contains("dislike")) {
            btn.textContent = isDisliked ? "Disliked" : "dislike";
            btn.disabled = isDisliked;
        }
    });
}

function renderAvatarLayers(container, outfit) {
    container.innerHTML = "";

    // base avatar
    const base = document.createElement("img");
    base.className = "layer";
    base.src = "/assets/avatar/avatar.png";
    container.appendChild(base);

    if (!outfit) return;

    const layers = ["hair", "top", "pants", "skirt", "shoes", "accessory"];

    layers.forEach(layer => {
        const url = outfit[layer];
        if (!url) return;

        const img = document.createElement("img");
        img.className = "layer";
        img.src = url;

        // apply hue
        const hue = outfit.hues?.[layer] || 0;
        img.style.filter = `hue-rotate(${hue}deg)`;

        container.appendChild(img);
    });
}

function sortLibraryByLikes() {
    const grid = document.querySelector(".library-grid");
    if (!grid) return;

    //form and array of the outfit
    const outfits = Array.from(grid.querySelectorAll(".outfit-item"));
    //sort array by likes
    outfits.sort((a, b) => {
        const likesA = parseInt(a.dataset.likes || "0", 10);
        const likesB = parseInt(b.dataset.likes || "0", 10);
        return likesB - likesA;
    });

    //create a lightweight container that lives in memory only
    const fragment = document.createDocumentFragment();
    outfits.forEach((item) => fragment.appendChild(item));
    grid.appendChild(fragment);
}

function sortLibraryByDislikes() {
    const grid = document.querySelector(".library-grid");
    if (!grid) return;

    const outfits = Array.from(grid.querySelectorAll(".outfit-item"));
    outfits.sort((a, b) => {
        const dislikesA = parseInt(a.dataset.dislikes || "0", 10);
        const dislikesB = parseInt(b.dataset.dislikes || "0", 10);
        return dislikesB - dislikesA;
    });

    const fragment = document.createDocumentFragment();
    outfits.forEach((item) => fragment.appendChild(item));
    grid.appendChild(fragment);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return null;
}

function applyVoteUpdate({ id, likes, dislikes }) {

    //Update CURRENT OUTFIT PANEL
    const currentId = document.querySelector(".like")?.dataset.id;
    if (currentId === id) {
        const likeEl = document.querySelector(".likes-count");
        const dislikeEl = document.querySelector(".dislikes-count");

        if (likeEl) likeEl.textContent = `likes: ${likes}`;
        if (dislikeEl) dislikeEl.textContent = `dislikes: ${dislikes}`;
    }

    //Update THUMBNAIL in Outfit Library
    const thumb = document.querySelector(`.outfit-item[data-id="${id}"]`);
    if (thumb) {

        thumb.dataset.likes = likes;
        thumb.dataset.dislikes = dislikes;

        const likeBadge = thumb.querySelector(".thumb-likes");
        const dislikeBadge = thumb.querySelector(".thumb-dislikes");

        if (likeBadge) likeBadge.textContent = `❤ ${likes}`;
        if (dislikeBadge) dislikeBadge.textContent = `✖ ${dislikes}`;
    }
}