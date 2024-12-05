const express = require("express");
const bodyParser = require('body-parser');
const cors = require("cors");
const multer = require("multer");
const path = require('path');
const fs = require("fs");
require('dotenv').config();

const router = express.Router();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("images"));

const PORT = process.env.PORT || 3000;




let notes = [];

let users = [
    { userName: "user1", password: "123456", auth_key: "" },
    { userName: "user2", password: "123456", auth_key: "" },
    { userName: "user3", password: "123456", auth_key: "" },
    { userName: "user4", password: "123456", auth_key: "" },
    { userName: "user5", password: "123456", auth_key: "" },
    { userName: "user6", password: "123456", auth_key: "" },
];


app.get("/", (req, res) => {
    res.send("Welcome to Oxdo Technologies");
});




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
const uploadImage = multer({ storage: storage });




app.post("/login", (req, res) => {
    try {
        const { userName, password } = req.body;

        console.log(userName);
        console.log(password);


        const result = authenticateUser(userName, password);



        if (result) {
            res.send(result);
        } else {
            res.status(401).send("No user present with this userName and Password");
        }



    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})



router.use((req, res, next) => {
    const auth_key = req.headers["authorization"]
    console.log(auth_key);
    if (!auth_key) {

        res.status(401).send("No Authorization key");
        return;
    }

    const result = checkUserAuthKey(auth_key);

    if (!result) {
        res.status(401).send("key is not valid");
        return;
    }



    next();
});



router.get("/getAllNotes", (req, res) => {
    try {
        res.send(notes);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.post("/addNote", validateNoteRequest,(req, res) => {
    try {
        

        const note = req.body;

        note.id = notes.length + 1;
        notes.push(note);
        res.status(201).send({ Success: true,id:notes.length });

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.put("/updateNoteWithImage/:id", uploadImage.single('image'),(req, res) => {
    try {
        const { id } = req.params;

        // Check if the parameter exists and is an integer
        if (!id || isNaN(id) || !Number.isInteger(Number(id))) {

            // delete uploaded image
            return res.status(400).send({ Success: false, Error: "'id' must be an integer and must exist" });
        } 
        

        const noteId = parseInt(id);


        // Check if the note exists in the list
        const noteIndex = notes.findIndex((obj) => obj.id === noteId);
        if (noteIndex === -1) {
             // delete uploaded image
            return res.status(401).send({ Success: false, Error: "Note with the given 'id' does not exist" });
        }

        const fileName = req.file.filename;



        notes = notes.map((obj) => {
            if (obj.id === noteId) { // Compare with id as an integer
                obj.image = fileName // Update the object with new data
            }
            return obj;
        });

        res.send(notes);

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.put("/updateNote/:id", validateNoteRequest,(req, res) => {
    try {
        const { id } = req.params;
        const note = req.body;

        
        // Check if the parameter exists and is an integer
        if (!id || isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).send({ Success: false, Error: "'id' must be an integer and must exist" });
        } 

        
    
        const noteId = parseInt(id);

         // Check if the note exists in the list
         const noteIndex = notes.findIndex((obj) => obj.id === noteId);
         if (noteIndex === -1) {
             return res.status(401).send({ Success: false, Error: "Note with the given 'id' does not exist" });
         }

         // if image is null
         if(!note.image){
            const noteToUpdate = (notes.filter(obj => obj.id === noteId))[0];

            // delete image
           deleteImage(noteToUpdate.image);
            
           console.log("image is null");
            
        }

        notes = notes.map((obj) => {
            if (obj.id === noteId) { // Compare with id as an integer
                return { ...obj, ...note }; // Update the object with new data
            }
            return obj;
        });

        res.send(notes);

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.delete("/deleteNote/:id",(req, res) => {
    try {
        const { id } = req.params;

        // Check if the parameter exists and is an integer
        if (!id || isNaN(id) || !Number.isInteger(Number(id))) {
            return res.status(400).send({ Success: false, Error: "'id' must be an integer and must exist" });
        } 
        

        const noteId = parseInt(id);

        // Check if the note exists in the list
        const noteIndex = notes.findIndex((obj) => obj.id === noteId);
        if (noteIndex === -1) {
            return res.status(401).send({ Success: false, Error: "Note with the given 'id' does not exist" });
        }

        const noteToDelete = (notes.filter(obj => obj.id === noteId))[0];

        notes = notes.filter(obj => obj.id !== noteId);

        // delete image
        deleteImage(noteToDelete.image);

        res.send(notes);

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});


app.use("/note", router);


// Start the HTTP server
app.listen(PORT, () => console.log("App is running on port " + PORT));



function authenticateUser(userName, password) {
    const user = users.find(
        (user) => user.userName === userName && user.password === password
    );

    const token = generateAuthKey();

    users = users.map(
        (user) => {
            if (user.userName == userName) {
                user.auth_key = token;
                return user;
            } else {
                return user;
            }
        }
    )

    if (user) {
        return token;
    }
}



function generateAuthKey() {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let authKey = "";
    for (let i = 0; i < 64; i++) {
        authKey += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return authKey;
}



function checkUserAuthKey(auth_key) {

    if (auth_key && auth_key.startsWith("Bearer ")) {
        const token = auth_key.split(" ")[1];

        const user = users.find(
            (user) => user.auth_key == token
        );
        if (user) {
            return true;
        } else {
            return false;
        }

    } else {
        return false;
    }

}

function validateNoteRequest(req, res, next) {
    const note = req.body;

    // Check if all required keys exist
    if (!note.hasOwnProperty("title") || !note.hasOwnProperty("content") || !note.hasOwnProperty("image")) {
        return res.status(400).send({
            Success: false,
            Error: "Missing required fields: 'title', 'content', or 'image'"
        });
    }

    // Validate title and content
    if (!note.title || typeof note.title !== "string" || note.title.trim() === "") {
        return res.status(400).send({
            Success: false,
            Error: "'title' must be a non-empty string"
        });
    }

    if (!note.content || typeof note.content !== "string" || note.content.trim() === "") {
        return res.status(400).send({
            Success: false,
            Error: "'content' must be a non-empty string"
        });
    }

    // Validate image
    if (note.image !== null && typeof note.image !== "string") {
        return res.status(400).send({
            Success: false,
            Error: "'image' must be either null or a string"
        });
    }

    next(); // Proceed to the next middleware or route handler
}

function deleteImage(filename) {

    const filePath = path.join(__dirname, "images", filename);

    try {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return;
        }

        // Delete the file
        fs.unlinkSync(filePath);
        
    } catch (error) {
        console.error("Error deleting file:", error);
       
    }
    
}
