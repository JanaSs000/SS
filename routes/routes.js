const express = require("express");
const makeOutfits = require("../model/outfits");
const makeClothes = require("../model/clothes");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const outfits = makeOutfits();
const clothes = makeClothes();

/* =====================================================
   UPLOADS DIR (DEPLOY SAFE)
===================================================== */
const uploadsDir = path.join(__dirname, "../public/assets/uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/* =====================================================
   HOME
===================================================== */
router.get("/", (req, res) => {
    res.render("home", { title: "Sparkle Style" });
});

/* =====================================================
   DRESSUP
===================================================== */
router.get("/dressup", (req, res) => {
    res.render("dressup", {
        title: "Dress Up",
        hair: clothes.getHair().concat(clothes.getChristmasHair()),
        tops: clothes.getTops().concat(clothes.getChristmasTops()),
        skirts: clothes.getSkirts().concat(clothes.getChristmasSkirts()),
        pants: clothes.getPants().concat(clothes.getChristmasPants()),
        shoes: clothes.getShoes().concat(clothes.getChristmasShoes()),
        accessories: clothes.getChristmasAccessories(),
        outfit: {}
    });
});

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

/* =====================================================
   SAVE (LOCAL STORAGE ONLY — unchanged)
===================================================== */
router.post("/dressup/save", (req, res) => {
    let id = req.body.id;
    if (!id || id === "null") id = null;
    const outfit = req.body.outfit;

    const finalId = id
        ? outfits.updateOutfit(id, outfit)
        : outfits.saveOutfit(outfit);

    res.json({ id: finalId });
});

router.get("/saved", (req, res) => {
    res.render("saved", { title: "Saved Outfits" });
});

/* =====================================================
   PUBLISH (DB)
===================================================== */
router.post("/dressup/publish", async (req, res) => {
    const id = req.body.id || null;
    const outfit = req.body.outfit;

    const finalId = await outfits.publishOutfit(id, outfit);
    res.json({ id: finalId });
});

/* =====================================================
   MY PUBLISHED
===================================================== */
router.get("/mypublished", async (req, res) => {
    const all = await outfits.getAllPublished();
    const user = req.query.user;

    const mine = Object.fromEntries(
        Object.entries(all).filter(([, o]) => o.user === user)
    );

    res.render("mypublished", {
        title: "My Published Outfits",
        outfits: mine
    });
});

/* =====================================================
   VOTING
===================================================== */
router.get("/voting", async (req, res) => {
    let likedOutfits = [];
    let dislikedOutfits = [];

    try { likedOutfits = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { dislikedOutfits = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    const published = await outfits.getAllPublished();
    const ids = Object.keys(published);
    const selectedId = req.query.id || ids[0] || null;

    res.render("voting", {
        title: "Voting Room",
        id: selectedId,
        published,
        likedOutfits,
        dislikedOutfits
    });
});

router.get("/voting/:id", async (req, res) => {
    let likedOutfits = [];
    let dislikedOutfits = [];

    try { likedOutfits = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { dislikedOutfits = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    res.render("voting", {
        title: "Voting Room",
        id: req.params.id,
        published: await outfits.getAllPublished(),
        likedOutfits,
        dislikedOutfits
    });
});

/* =====================================================
   LIKE / DISLIKE
===================================================== */
router.post("/voting/:id/like", async (req, res) => {
    const id = String(req.params.id);
    let liked = [];
    let disliked = [];

    try { liked = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { disliked = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    if (liked.includes(id) || disliked.includes(id)) {
        return res.json({ ok: false });
    }

    await outfits.like(id);
    liked.push(id);

    const published = await outfits.getAllPublished();

    req.app.get("wss").broadcast({
        type: "voteUpdate",
        id,
        likes: published[id].likes,
        dislikes: published[id].dislikes
    });

    res.cookie("liked_outfits", JSON.stringify(liked), {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365
    });

    res.json({ ok: true, published });
});

router.post("/voting/:id/dislike", async (req, res) => {
    const id = String(req.params.id);
    let liked = [];
    let disliked = [];

    try { liked = JSON.parse(req.cookies.liked_outfits || "[]"); } catch {}
    try { disliked = JSON.parse(req.cookies.disliked_outfits || "[]"); } catch {}

    if (liked.includes(id) || disliked.includes(id)) {
        return res.json({ ok: false });
    }

    await outfits.dislike(id);
    disliked.push(id);

    const published = await outfits.getAllPublished();

    req.app.get("wss").broadcast({
        type: "voteUpdate",
        id,
        likes: published[id].likes,
        dislikes: published[id].dislikes
    });

    res.cookie("disliked_outfits", JSON.stringify(disliked), {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 365
    });

    res.json({ ok: true, published });
});

/* =====================================================
   DELETE PUBLISHED
===================================================== */
router.post("/published/delete", async (req, res) => {
    const { id, user } = req.body;
    await outfits.deletePublished(id);
    res.redirect(`/mypublished?user=${user}`);
});

/* =====================================================
   UPLOADS
===================================================== */
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ["image/png", "image/jpeg"];
        if (ok.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only PNG/JPG"), false);
    }
});

router.post("/dressup/upload", upload.single("background"), (req, res) => {
    res.json({ filename: req.file.filename });
});

router.get("/dressup/uploads", (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.json([]);
        res.json(files.map(f => `/assets/uploads/${f}`));
    });
});

router.delete("/dressup/uploads/:filename", (req, res) => {
    fs.unlink(path.join(uploadsDir, req.params.filename), () =>
        res.json({ ok: true })
    );
});

module.exports = router;
