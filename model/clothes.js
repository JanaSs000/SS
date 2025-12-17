const fs = require("fs");
const path = require("path");

function read(folder) {
    try {
        return fs
            .readdirSync(folder)
            .filter(f => f.endsWith(".png"))
            .map(f => {
                const rel = folder.split("public")[1];
                return rel.replace(/\\/g, "/") + "/" + f;
            });
    } catch {
        return [];
    }
}

module.exports = function () {

    const base = path.join(__dirname, "../public/assets/clothes");

    function getHair() {
        return read(path.join(base, "hair"));
    }

    function getTops() {
        return read(path.join(base, "tops"));
    }

    function getSkirts() {
        return read(path.join(base, "skirts"));
    }

    function getPants() {
        return read(path.join(base, "pants"));
    }

    function getShoes() {
        return read(path.join(base, "shoes"));
    }

    // CHRISTMAS
    function getChristmasHair() {
        return read(path.join(base, "christmas/hair"));
    }

    function getChristmasTops() {
        return read(path.join(base, "christmas/tops"));
    }

    function getChristmasSkirts() {
        return read(path.join(base, "christmas/skirts"));
    }

    function getChristmasPants() {
        return read(path.join(base, "christmas/pants"));
    }

    function getChristmasShoes() {
        return read(path.join(base, "christmas/shoes"));
    }

    function getChristmasAccessories() {
        return read(path.join(base, "christmas/accessories"));
    }

    return {
        getHair,
        getTops,
        getSkirts,
        getPants,
        getShoes,

        getChristmasHair,
        getChristmasTops,
        getChristmasSkirts,
        getChristmasPants,
        getChristmasShoes,
        getChristmasAccessories
    };
};
