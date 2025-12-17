document.addEventListener("DOMContentLoaded", () => {

    const btnChristmas = document.getElementById("btn-christmas");
    const btnNormal = document.getElementById("btn-normal");

    const buttonsExist = btnChristmas && btnNormal;

    function applyTheme(theme) {
        if (theme === "christmas") {
            document.body.classList.add("christmas");
            if (buttonsExist) {
                btnChristmas.style.display = "none";
                btnNormal.style.display = "block";
            }
        } else {
            document.body.classList.remove("christmas");
            if (buttonsExist) {
                btnChristmas.style.display = "block";
                btnNormal.style.display = "none";
            }
        }
    
        const homeAvatar = document.getElementById("home-avatar");
        if (homeAvatar) {
            homeAvatar.src =
                theme === "christmas"
                    ? "/assets/avatar/christmasAvatar.png"
                    : "/assets/avatar/finalAvatar.png";
        }
    }
    

    // 🔹 APPLY ON PAGE LOAD
    const saved = localStorage.getItem("sparkleTheme") || "normal";
    applyTheme(saved);

    // 🔹 APPLY WHEN THEME CHANGES (THIS WAS MISSING)
    document.addEventListener("themechange", () => {
        applyTheme(localStorage.getItem("sparkleTheme"));
    });

    // 🔹 BUTTONS ONLY UPDATE STATE + DISPATCH
    if (buttonsExist) {
        btnChristmas.addEventListener("click", () => {
            localStorage.setItem("sparkleTheme", "christmas");
            document.dispatchEvent(new Event("themechange"));
        });

        btnNormal.addEventListener("click", () => {
            localStorage.setItem("sparkleTheme", "normal");
            document.dispatchEvent(new Event("themechange"));
        });
    }

    // Optional cross-tab sync
    window.addEventListener("storage", () => {
        applyTheme(localStorage.getItem("sparkleTheme"));
    });
});
