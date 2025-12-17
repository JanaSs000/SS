const express = require("express");
const http = require("http");
const { initWSS } = require("./ws/index.js");
require("dotenv").config();

// import router
const routes = require("./routes/routes.js");

//import cookies
const cookieParser = require("cookie-parser");


const app = express();

//use cookied for exactly one like per computer
app.use(cookieParser());

//reset cookies when visiting http://localhost:8989/reset-cookies
app.get("/reset-cookies", (req, res) => {
    res.clearCookie("liked_outfits");
    res.clearCookie("disliked_outfits");
    res.send("Cookies reset!");
});

//reads form data
app.use(express.urlencoded({ extended: true }));

// reads JSON body data
app.use(express.json());
// allow server to read JSON POST
app.use(express.json());

// serve static files
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// use your routes.js for all pages
app.use("/", routes);

const server = http.createServer(app);


// WEBSOCKETS
const wss = initWSS(server);
app.set("wss", wss);

const PORT = process.env.PORT || 8989;
server.listen(PORT, () => {
  console.log("Sparkle Style running on http://localhost:8989");
});
