const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const multer = require("multer");
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("images"));

const PORT= process.env.PORT  || 3000;


let list = [];


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now(); // Add a unique timestamp
        const extension = path.extname(file.originalname); // Extract file extension
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Initialize Multer with Storage
const upload = multer({ storage: storage });


app.get("/", (req, res) => {
    res.send("Welcome to Oxdo Technologies");
});


// Start the HTTP server
app.listen(PORT, () => console.log("App is running on port "+PORT));