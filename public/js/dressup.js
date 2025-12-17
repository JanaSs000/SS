console.log("dressup.js loaded");

// ============================
// GLOBAL STATE
// ============================
let activeSlider = null;

function isChristmas() {
    return localStorage.getItem("sparkleTheme") === "christmas";
}

let pendingBgDelete = null;

function confirmBgDelete(onConfirm) {
    pendingBgDelete = onConfirm;

    const popup = document.getElementById("bg-confirm-popup");
    popup.classList.remove("hidden");

    document.getElementById("bg-confirm-cancel").onclick = () => {
        popup.classList.add("hidden");
        pendingBgDelete = null;
    };

    document.getElementById("bg-confirm-delete").onclick = () => {
        popup.classList.add("hidden");
        if (pendingBgDelete) pendingBgDelete();
        pendingBgDelete = null;
    };
}

// ============================
// DOM READY
// ============================
window.addEventListener("DOMContentLoaded", () => {

    function isChristmas() {
        return localStorage.getItem("sparkleTheme") === "christmas";
    }

    function applyChristmasFilter() {
        document.querySelectorAll(".item").forEach(item => {
            const isXmas = item.dataset.christmas === "true";

            if (isChristmas()) {
                item.style.display = isXmas ? "" : "none";
            } else {
                item.style.display = isXmas ? "none" : "";
            }
        });
    }


    applyChristmasFilter();
    document.addEventListener("themechange", applyChristmasFilter);

    function highlightSelectedItems() {
        const layers = ["hair", "top","shoes", "pants", "skirt", "accessory"];

        layers.forEach(layer => {
            const layerEl = document.getElementById("layer-" + layer);
            const items = document.querySelectorAll(`.item[data-layer='${layer}']`);

            items.forEach(item => {
                const file = item.dataset.file;
                if (layerEl.src.includes(file)) {
                    item.classList.add("selected");
                } else {
                    item.classList.remove("selected");
                }
            });
        });
    }

    // ============================
    // CLICK → APPLY CLOTHING
    // ============================
    document.addEventListener("click", (e) => {
        const el = e.target.closest(".item");
        if (!el) return;

        const layer = el.dataset.layer;
        const file = el.dataset.file;

        // accessories only in christmas
        if (layer === "accessory" && !isChristmas()) return;

        // pants/skirt mutual exclusion
        if (layer === "pants") {
            document.getElementById("layer-skirt").src = "";
        }
        if (layer === "skirt") {
            document.getElementById("layer-pants").src = "";
        }
        const layerEl = document.getElementById("layer-" + layer);
        if (!layerEl) return;

        // UNWEAR
        if (layerEl.src.includes(file)) {
            layerEl.src = "";
            layerEl.dataset.hue = "0";
            layerEl.style.filter = "none";
            el.classList.remove("selected");
            return;
        }

        // APPLY
        layerEl.src = file;

        // CLEAR SLIDER
        if (activeSlider) activeSlider.remove();

        // HIGHLIGHT
        highlightSelectedItems();

        // SLIDER
        const template = document.getElementById("hue-template");
        if (!template) return;

        const sliderWrap = template.firstElementChild.cloneNode(true);
        el.appendChild(sliderWrap);
        activeSlider = sliderWrap;

        sliderWrap.addEventListener("click", e => e.stopPropagation());

        const slider = sliderWrap.querySelector(".hue-slider");
        slider.value = layerEl.dataset.hue || "0";

        slider.addEventListener("input", () => {
            layerEl.dataset.hue = slider.value;
            layerEl.style.filter = `hue-rotate(${slider.value}deg)`;
        });
    });

    //------------------------------------------------------------------
    // HELPER: CLEAN SRC
    //------------------------------------------------------------------
    function clean(src) {
        if (!src) return "";
        if (src === window.location.href) return "";
        if (src.endsWith("/dressup")) return "";
        return src;
    }

    //------------------------------------------------------------------
    // COLLECT CURRENT OUTFIT (INCLUDES HUES)
    //------------------------------------------------------------------
    function collectOutfit() {
        const outfit = {
            hair: clean(document.getElementById("layer-hair").src),
            top: clean(document.getElementById("layer-top").src),
            shoes: clean(document.getElementById("layer-shoes").src),
            pants: clean(document.getElementById("layer-pants").src),
            skirt: clean(document.getElementById("layer-skirt").src),
            accessory: clean(document.getElementById("layer-accessory").src)
        };
    
        if (outfit.pants) outfit.skirt = "";
        if (outfit.skirt) outfit.pants = "";
    
        outfit.hues = {
            hair: document.getElementById("layer-hair").dataset.hue || "0",
            top: document.getElementById("layer-top").dataset.hue || "0",
            shoes: document.getElementById("layer-shoes").dataset.hue || "0",
            pants: document.getElementById("layer-pants").dataset.hue || "0",
            skirt: document.getElementById("layer-skirt").dataset.hue || "0",
            accessory: document.getElementById("layer-accessory").dataset.hue || "0"
        };
    
        return outfit;
    }
    


    //------------------------------------------------------------------
    // LOCAL STORAGE SAVE BUTTON
    //------------------------------------------------------------------
    const saveBtn = document.querySelector(".btn-save");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const outfit = collectOutfit();
            const id = window.editingId || Date.now().toString();

            const all = JSON.parse(localStorage.getItem("savedOutfits") || "{}");
            all[id] = { id, ...outfit };
            localStorage.setItem("savedOutfits", JSON.stringify(all));

            window.location.href = "/saved";
        });
    }

    // ============================
    // PUBLISH
    // ============================
    const publishBtn = document.querySelector(".btn-publish");
    if (publishBtn) {
        publishBtn.addEventListener("click", async () => {
            const outfit = collectOutfit();
            const id = window.editingId || null;

            const missing =
                !outfit.hair ||
                !outfit.top ||
                !outfit.shoes ||
                (!outfit.pants && !outfit.skirt);

            if (missing) {
                document.getElementById("publish-error")?.classList.remove("hidden");
                return;
            }

            outfit.user = localStorage.getItem("sparkleUserId");

            await fetch("/dressup/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outfit, id })
            });

            window.location.href =
                "/mypublished?user=" + localStorage.getItem("sparkleUserId");
        });
    }

    // ============================
    // POPUP CLOSE
    // ============================
    const errorPopup = document.getElementById("publish-error");
    const errorCloseBtn = document.getElementById("error-close");

    if (errorPopup && errorCloseBtn) {
        errorCloseBtn.addEventListener("click", () => {
            errorPopup.classList.add("hidden");
        });

        errorPopup.addEventListener("click", e => {
            if (e.target === errorPopup) {
                errorPopup.classList.add("hidden");
            }
        });
    }



    //------------------------------------------------------------------
    // LOAD EXISTING OUTFIT + APPLY SAVED HUES
    //------------------------------------------------------------------
    const o = window.loadedOutfit;

    if (o) {
        document.getElementById("layer-hair").src = o.hair || "";
        document.getElementById("layer-top").src = o.top || "";
        document.getElementById("layer-shoes").src = o.shoes || "";
        document.getElementById("layer-pants").src = o.pants || "";
        document.getElementById("layer-skirt").src = o.skirt || "";
        document.getElementById("layer-accessory").src = o.accessory || "";
    }

    if (o && o.hues) {

        const layers = ["hair", "top","shoes", "pants", "skirt", "accessory"];
        layers.forEach(layer => {
            const hue = o.hues[layer] || "0";
            const el = document.getElementById("layer-" + layer);
            if (!el) return;

            el.dataset.hue = hue;
            el.style.filter = `hue-rotate(${hue}deg)`;
            highlightSelectedItems();

        });
    }

    if (o?.accessory || o?.hair?.includes("/christmas/")) {
        localStorage.setItem("sparkleTheme", "christmas");
        document.dispatchEvent(new Event("themechange"));
    }

    //------------------------------------------------------------------
    // NEW DOWNLOAD POPUP LOGIC
    //------------------------------------------------------------------
    const btnDownloadTrigger = document.getElementById("btn-download");
    const downloadPopup = document.getElementById("download-popup");
    const closePopupBtn = document.getElementById("close-download-popup");
    const bgOptions = document.querySelectorAll(".bg-option");
    const confirmDownloadBtn = document.getElementById("confirm-download-btn");

    // Variable to hold the selected background (Default: transparent)
    let selectedBg = { type: "color", val: "transparent" };

    if (btnDownloadTrigger && downloadPopup) {

        // 1. Open Popup
        btnDownloadTrigger.addEventListener("click", () => {
            downloadPopup.classList.remove("hidden");
        });

        // 2. Close Popup
        closePopupBtn.addEventListener("click", () => {
            downloadPopup.classList.add("hidden");
        });

        // Close when clicking outside the popup
        downloadPopup.addEventListener("click", (e) => {
            if (e.target === downloadPopup) {
                downloadPopup.classList.add("hidden");
            }
        });

        // 3. Background Selection
        const bgOptionsContainer = document.getElementById("bg-options");
        if (bgOptionsContainer) { //target each single bg-option in bg-options
            bgOptionsContainer.addEventListener("click", (event) => {
                const opt = event.target.closest(".bg-option");
                if (!opt || !bgOptionsContainer.contains(opt)) return;

                bgOptionsContainer.querySelectorAll(".bg-option")
                    .forEach(el => el.classList.remove("selected"));
                opt.classList.add("selected");

                selectedBg.type = opt.dataset.type;
                selectedBg.val = opt.dataset.val;
            });
        }

        // 4. DOWNLOAD BUTTON (Canvas Merging Process)
        confirmDownloadBtn.addEventListener("click", async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const width = 400; // Avatar width
            const height = 600; // Avatar height
            canvas.width = width;
            canvas.height = height;

            // --- A. DRAW BACKGROUND FIRST ---
            if (selectedBg.type === "color" && selectedBg.val !== "transparent") {
                ctx.fillStyle = selectedBg.val;
                ctx.fillRect(0, 0, width, height);
            }
            else if (selectedBg.type === "image") {
                await new Promise((resolve) => {
                    const bgImg = new Image();
                    bgImg.src = selectedBg.val;
                    bgImg.crossOrigin = "Anonymous";
                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, width, height);
                        resolve();
                    };
                    bgImg.onerror = resolve;
                });
            }

            // --- B. THEN DRAW AVATAR ON TOP ---
            const layerIds = [
                "layer-base",
                "layer-top",
                "layer-hair",
                "layer-shoes",
                "layer-pants",
                "layer-skirt",
                "layer-accessory"
            ];

            layerIds.forEach(id => {
                const imgElement = document.getElementById(id);
                if (imgElement && imgElement.src && imgElement.src !== window.location.href) {
                    const hue = imgElement.getAttribute("data-hue") || "0";
                    ctx.filter = `hue-rotate(${hue}deg)`;
                    ctx.drawImage(imgElement, 0, 0, width, height);
                    ctx.filter = "none";
                }
            });

            // --- C. DOWNLOAD ---
            const link = document.createElement("a");
            link.download = `sparkle-outfit-${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();

            // Close popup when finished
            downloadPopup.classList.add("hidden");
        });

        // UPLOAD BUTTON (Part to be implemented)
        const uploadButton = document.getElementById("upload-bg-btn");
        const fileInput = document.getElementById("fileInput");

        uploadButton.addEventListener("click", async (e) => {
            fileInput.click();
        });

        fileInput.addEventListener("change", async () => {
            if (!fileInput.files || fileInput.files.length === 0) return;

            const file = fileInput.files[0];

            const allowed = ["image/png", "image/jpeg"];

            if (!allowed.includes(file.type)) {
                alert("Only PNG or JPG images are allowed.");
                fileInput.value = "";
                return;
            }

            const formData = new FormData();
            formData.append("background", file); // name must match multer.single("background")

            const response = await fetch("/dressup/upload", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            loadUploadedImages();
        });

        const applyBG = document.getElementById("applyBG");
        const layerBase = document.getElementById("layer-base");
        const layerBG = document.getElementById("layer-background");
        applyBG.addEventListener("click", e => {
            e.preventDefault();
        
            // RESET EVERYTHING FIRST
            layerBase.removeAttribute("style");
            layerBG.src = "";
        
            // APPLY NEW BACKGROUND
            if (selectedBg.type === "color" && selectedBg.val !== "transparent") {
                layerBase.style.backgroundColor = selectedBg.val;
            }
        
            if (selectedBg.type === "image") {
                layerBG.src = selectedBg.val;
            }
        });
        

        async function loadUploadedImages() {
            const response = await fetch("/dressup/uploads");
            const urls = await response.json();

            const container = document.getElementById("uploadedImagesContainer");
            container.innerHTML = ""; // clear old images

            urls.forEach(url => {
                // Main container
                const bgOption = document.createElement("div");
                bgOption.classList.add("bg-option");
                bgOption.dataset.type = "image";
                bgOption.dataset.val = `${url}`;

                // Thumbnail
                const bgThumb = document.createElement("div");
                bgThumb.classList.add("bg-thumb");
                bgThumb.style = `background: url('${url}') center/cover;`;

                // Label
                const label = document.createElement("span");
                const imgName = url.split("/");
                const fileNameFull = imgName[imgName.length - 1];
                label.textContent = fileNameFull.split(".")[0];

                // --- DELETE BUTTON ---
                const deleteBtn = document.createElement("div");
                deleteBtn.innerHTML = "×"; // Cross mark
                deleteBtn.classList.add("delete-bg-btn");
                deleteBtn.title = "Delete Image";

                // Click event for the delete button
                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation(); // Prevent background selection

                    confirmBgDelete(() => {
                        deleteBackground(bgId);
                    });

                    try {
                        const res = await fetch(`/dressup/uploads/${fileNameFull}`, {
                            method: "DELETE"
                        });

                        if (res.ok) {
                            // Refresh the list if successful
                            loadUploadedImages();
                            if (selectedBg.val === url) {
                                // Select default (Transparent)
                                document.querySelector('.bg-option[data-val="transparent"]').click();
                            }
                        } else {
                            alert("Deletion failed.");
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });

                bgOption.appendChild(deleteBtn);
                bgOption.appendChild(bgThumb);
                bgOption.appendChild(label);
                container.appendChild(bgOption);
            });
        }

        loadUploadedImages();
    }

    document.addEventListener("themechange", () => {
        if (localStorage.getItem("sparkleTheme") === "normal") {
            clearChristmasLayers();
        }
    });


    function clearChristmasLayers() {
        const layers = ["hair", "top","shoes", "pants", "skirt", "accessory"];
    
        layers.forEach(layer => {
            const el = document.getElementById("layer-" + layer);
            if (!el || !el.src) return;
    
            if (el.src.includes("/christmas/")) {
                el.src = "";
                el.dataset.hue = "0";
                el.style.filter = "none";
            }
        });
    
        document.querySelectorAll(".item.selected").forEach(item => {
            if (item.dataset.file.includes("/christmas/")) {
                item.classList.remove("selected");
            }
        });
    }

});
