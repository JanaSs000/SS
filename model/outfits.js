const fs = require("fs");
const path = require("path");

const PUBLISHPATH = path.join(__dirname, "..", "data", "published.json");

module.exports = function () {

    let published = {};

    function loadPublished() {
        try {
            published = JSON.parse(fs.readFileSync(PUBLISHPATH, "utf8"));
        } catch {
            published = {};
        }
    }

    function savePublished() {
        fs.writeFileSync(PUBLISHPATH, JSON.stringify(published, null, 2));
    }

    loadPublished();

    return {
        getAllPublished() {
            return published;
        },

        publishOutfit(id, outfit) {
            if (id == null) {
                id = Date.now().toString();
              }
            published[id] = published[id] || {};
            Object.assign(published[id], outfit);
            published[id].likes ||= 0;
            published[id].dislikes ||= 0;
            savePublished();
        },

        deletePublished(id) {
            delete published[id];
            savePublished();
        },

        like(id) {
            if (!published[id]) return;
            published[id].likes++;
            savePublished();
        },

        dislike(id) {
            if (!published[id]) return;
            published[id].dislikes++;
            savePublished();
        }
    };
};
