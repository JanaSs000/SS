const express = require("express");
const makeOutfits = require("../model/outfits");
const makeClothes = require("../model/clothes");

const outfits = makeOutfits();
const clothes = makeClothes();

const uploadsDir = path.join(__dirname, "../public/assets/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multer = require('multer');
const fs = require("fs");
const path = require("path");

const router = express.Router();


// -------------------------------------------------------
// HOME
// -------------------------------------------------------
router.get("/", (req, res) => {
    res.render("home", { title: "Sparkle Style" });
});


// -------------------------------------------------------
// NEW OUTFIT PAGE
// -------------------------------------------------------
router.get("/dressup", (req, res) => {
    res.render("dressup", {
        title: "Dress Up",
        hair: clothes.getHair().concat(clothes.getChristmasHair()),
        tops: clothes.getTops().concat(clothes.getChristmasTops()),
        skirts: clothes.getSkirts().concat(clothes.getChristmasSkirts()),
        pants: clothes.getPants().concat(clothes.getChristmasPants()),
        shoes: clothes.getShoes().concat(clothes.getChristmasShoes()),
        accessories: clothes.getChristmasAccessories(),
        outfit: {}           // REQUIRED
    });
});



// -------------------------------------------------------
// EDIT EXISTING OUTFIT
// URL MUST MATCH: /dressup/:id
// -------------------------------------------------------
router.get("/dressup/edit/:id", (req, res) => {
    res.render("dressup", {
        title: "Edit Outfit",
        hair: clothes.getHair().concat(clothes.getChristmasHair()),
        tops: clothes.getTops().concat(clothes.getChristmasTops()),
        skirts: clothes.getSkirts().concat(clothes.getChristmasSkirts()),
        pants: clothes.getPants().concat(clothes.getChristmasPants()),
        shoes: clothes.getShoes().concat(clothes.getChristmasShoes()),
        accessories: clothes.getChristmasAccessories(),
        outfit: {}
    });
});



// -------------------------------------------------------
// SAVE OUTFIT (CREATE OR UPDATE)
// -------------------------------------------------------
router.post("/dressup/save", (req, res) => {
    let id = req.body.id;
    if (!id || id === "null") id = null;
    const outfit = req.body.outfit;

    let finalId;

    if (id) {
        finalId = outfits.updateOutfit(id, outfit);
    } else {
        finalId = outfits.saveOutfit(outfit);
    }

    res.json({ id: finalId });
});

router.get("/saved", (req, res) => {
    res.render("saved", { title: "Saved Outfits" });
});

// -------------------------------------------------------
// PUBLISH OUTFIT
// -------------------------------------------------------
router.post("/dressup/publish", (req, res) => {
    const id = req.body.id || null;
    const outfit = req.body.outfit;

    const finalId = outfits.publishOutfit(id, outfit);
    res.json({ id: finalId });
});

// -------------------------------------------------------
// MY PUBLISHED OUTFITS
// -------------------------------------------------------
router.get("/mypublished", (req, res) => {
    const all = outfits.getAllPublished();
    const user = req.query.user;

    const mine = Object.fromEntries(
        Object.entries(all).filter(([, outfit]) => outfit.user === user)
    );

    res.render("mypublished", {
        title: "My Published Outfits",
        outfits: mine
    });
});


// -------------------------------------------------------
// VOTING
// -------------------------------------------------------
router.get("/voting", (req, res) => {
    let likedOutfits = [];
    if (req.cookies.liked_outfits) {
        try {
            likedOutfits = JSON.parse(req.cookies.liked_outfits);
        } catch {
            likedOutfits = [];
        }
    }

    let dislikedOutfits = [];
    if (req.cookies.disliked_outfits) {
        try {
            dislikedOutfits = JSON.parse(req.cookies.disliked_outfits);
        } catch {
            dislikedOutfits = [];
        }
    }

    const publishedOutfits = outfits.getAllPublished();
    const publishedIds = Object.keys(publishedOutfits);
    const selectedId = req.query.id || publishedIds[0] || null;

    res.render("voting", {
        title: "Voting Room",
        id: selectedId,
        published: publishedOutfits,
        likedOutfits,
        dislikedOutfits
    });
});

router.get("/voting/:id", (req, res) => {
    let likedOutfits = [];
    if (req.cookies.liked_outfits) {
        try {
            likedOutfits = JSON.parse(req.cookies.liked_outfits);
        } catch {
            likedOutfits = [];
        }
    }

    let dislikedOutfits = [];
    if (req.cookies.disliked_outfits) {
        try {
            dislikedOutfits = JSON.parse(req.cookies.disliked_outfits);
        } catch {
            dislikedOutfits = [];
        }
    }

    res.render("voting", {
        title: "Voting Room",
        id: req.params.id,
        published: outfits.getAllPublished(),
        likedOutfits,
        dislikedOutfits
    });
});

router.post("/voting/:id", (req, res) => {
    res.json({
        title: "Voting Room",
        id: req.params.id,
        published: outfits.getAllPublished()
    });
});

router.post("/voting/:id/like", (req, res) => {
    const id = String(req.params.id);

    let liked = [];
    let disliked = [];

    try { liked = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { disliked = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    if (liked.includes(id)) {
        return res.json({ ok: false, id, published: outfits.getAllPublished() });
    }

    if (disliked.includes(id)) {
        return res.json({ ok: false, id, published: outfits.getAllPublished() });
    }

    outfits.like(id);
    liked.push(id);

    req.app.get("wss").broadcast({
        type: "voteUpdate",
        id,
        likes: outfits.getAllPublished()[id].likes,
        dislikes: outfits.getAllPublished()[id].dislikes
    });
    
    res.cookie("liked_outfits", JSON.stringify(liked), {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    res.json({ ok: true, id, published: outfits.getAllPublished() });
});



router.post("/voting/:id/dislike", (req, res) => {
    const id = String(req.params.id);

    let liked = [];
    let disliked = [];

    try { liked = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { disliked = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    if (disliked.includes(id)) {
        return res.json({ ok: false, id, published: outfits.getAllPublished() });
    }

    if (liked.includes(id)) {
        return res.json({ ok: false, id, published: outfits.getAllPublished() });
    }

    outfits.dislike(id);
    disliked.push(id);

    req.app.get("wss").broadcast({
        type: "voteUpdate",
        id,
        likes: outfits.getAllPublished()[id].likes,
        dislikes: outfits.getAllPublished()[id].dislikes
    });
    
    res.cookie("disliked_outfits", JSON.stringify(disliked), {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    res.json({ ok: true, id, published: outfits.getAllPublished() });
});


// DELETE published outfit
router.post("/published/delete", (req, res) => {
    const { id, user } = req.body;
    outfits.deletePublished(id);
    res.redirect(`/mypublished?user=${user}`);
});

// UPLOAD
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/uploads/");
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const okTypes = ["image/png", "image/jpeg"];
        const okExt = /\.(png|jpe?g)$/i;

        if (okTypes.includes(file.mimetype) && okExt.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error("Only PNG and JPG images are allowed"), false);
        }
    }
});

router.post("/dressup/upload", upload.single("background"), (req, res) => {
    res.json({
        message: "Uploaded",
        filename: req.file.filename
    });
});

// SHOW all uploaded images
router.get("/dressup/uploads", (req, res) => {
    const uploadsDir = path.join(__dirname, "../public//assets/uploads");

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to read uploads folder" });
        }

        // Only return images (optional)
        const images = files.filter(f => /\.(png|jpe?g)$/i.test(f));

        // Return URLs so browser can load them
        const urls = images.map(filename => `/assets/uploads/${filename}`);

        res.json(urls);
    });
});

router.use((err, req, res, next) => {
    if (err.message.includes("PNG") || err.message.includes("JPG")) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Background Delete (DELETE FILE)
router.delete("/dressup/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "Geçersiz dosya adı" });
    }

    const filePath = path.join(__dirname, "../public/assets/uploads", filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Dosya silinemedi:", err);
            return res.status(500).json({ error: "Dosya silinemedi" });
        }
        res.json({ message: "Dosya başarıyla silindi" });
    });
});

module.exports = router;
