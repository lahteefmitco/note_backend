const express = require("express");

const { initializeApp } = require("firebase/app");
const cors = require("cors");
const multer = require("multer");
const path = require('path');
const fs = require("fs");
require('dotenv').config();



const { getFirestore, collection, addDoc, getDocs, updateDoc, setDoc, Timestamp, doc, getDoc,deleteDoc } = require("firebase/firestore");



const firebaseConfig = {
    apiKey: "AIzaSyDYUdMLwT0hNY4ePL37z2Hv8d4OaCBMHB8",
    authDomain: "note-project-19f55.firebaseapp.com",
    projectId: "note-project-19f55",
    storageBucket: "note-project-19f55.firebasestorage.app",
    messagingSenderId: "649153631748",
    appId: "1:649153631748:web:f1af79769c602dbc1f0751",
    measurementId: "G-F17V4YTTXR"
};



const router = express.Router();

const app = express();

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);


const db = getFirestore(firebaseApp);


app.use(cors());
app.use(express.json());
app.use(express.static("images"));

const PORT = process.env.PORT || 3000;




let notes = [
    { userId: 1, data: [] },
    { userId: 2, data: [] },
    { userId: 3, data: [] },
    { userId: 4, data: [] },
    { userId: 5, data: [] },
    { userId: 6, data: [] },
];

let users = [
    { userId: 1, userName: "user1", password: "123456", auth_key: "zUS5p7adCQrT16oO9gvNnCRwHrkCYSqTSaDr6aFElIciNsnqQdMLIgiIFKg9WZ8Y" },
    { userId: 2, userName: "user2", password: "123456", auth_key: "Ivgwf4AWmA1SdH7rHc0uVmzKKemXHkmm8jTAqza1uMIUAOGFGz6cJpCKcMVpqjct" },
    { userId: 3, userName: "user3", password: "123456", auth_key: "a2Q9hlLOAMfXzTtecs8Fx9M2sKUF7VPm8cssJmIBqaFXeQeJT9rcewoTRr1XICEs" },
    { userId: 4, userName: "user4", password: "123456", auth_key: "8ydiAVjoRO0JcgvdWIRsuQK9Cu06kfcVf98QpbSZN4wgjZMwdMK7cdqisfhbzSrC" },
    { userId: 5, userName: "user5", password: "123456", auth_key: "tvO2ZIe9f2LESF2QvBPRFWPGelNzztX5C55H6do383fxItXjEUgAjuLgR4DEhvRi" },
    { userId: 6, userName: "user6", password: "123456", auth_key: "KCO1RLl9hH6k2JUv2Kg4isGMfq8MtT5p1PYXPtHHJGngb0IbtgDfOn8OtX1n2sM7" },
];


app.get("/", (req, res) => {
    res.send("Welcome to Oxdo Technologies");
});

app.get("/getAllUsers", (req, res) => {
    res.send(users);
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


        const token = authenticateUser(userName, password);



        if (token) {
            res.send(token);
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

    if (!auth_key) {

        res.status(401).send("No Authorization key");
        return;
    }

    const result = checkUserAuthKey(auth_key);




    if (!result) {
        res.status(401).send("key is not valid");
        return;
    }

    req.headers["userName"] = result;


    next();
});



router.get("/getAllNotes", async(req, res) => {
    try {
        const userName = req.headers["userName"];
        const querySnapshot = await getDocs(collection(db, userName.toString()));
        const noteList = [];

        querySnapshot.forEach((doc) => {
            
            const documentId = doc.id;
            const rDoc = doc.data();
            rDoc.documentId = documentId;
            const timeStamp = rDoc.dateTime;
           // console.log(timeStamp);

           
            
            const datetimeString = timeStamp.toDate();
            

            rDoc.dateTime = datetimeString;
            
            //console.log(doc.id, " => ", doc.data());
            noteList.push(rDoc);
        });
        res.send(noteList);

        
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
});

router.post("/addNote", validateNoteRequest, async(req, res) => {
    try {
        const userName = req.headers["userName"];

        const note = req.body;

        
        // Add note to firebase
        const docRef = await addDoc(collection(db, userName.toString()), note);
        res.status(201).json({ id: docRef.id, message: "Note added successfully!" });

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }

});

router.put("/updateNoteWithImage/:documentId", uploadImage.single('image'), (req, res) => {
    try {
        const { id } = req.params;

        // Check if the parameter exists and is an integer
        if (!id || isNaN(id) || !Number.isInteger(Number(id))) {

            // delete uploaded image
            return res.status(400).send("'id' must be an integer and must exist");
        }


        const noteId = parseInt(id);


        // Check if the note exists in the list
        const noteIndex = notes.findIndex((obj) => obj.id === noteId);
        if (noteIndex === -1) {
            // delete uploaded image
            return res.status(400).send("Note with the given 'id' does not exist");
        }

        const fileName = req.file.filename;



        notes = notes.map((obj) => {
            if (obj.id === noteId) { // Compare with id as an integer
                obj.image = fileName // Update the object with new data
            }
            return obj;
        });

        res.send(fileName);

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.put("/updateNote/:documentId", validateNoteRequest, async(req, res) => {
    try {
        
        const note = req.body;

        
        console.log(note);

        const documentId = req.params["documentId"];
        console.log(documentId);
        

        const userName = req.headers["userName"];

        console.log(userName);
        

        const noteDocRef = doc(db,userName,documentId)

        console.log("noteDocRef completed");
        

        await updateDoc(noteDocRef,{
            title:note.title,
            content:note.content,
            dateTime:note.dateTime,
            isFavourite:note.isFavourite,

        })

        console.log("updated");


        const docSnapShot = await getDoc(noteDocRef);

        console.log("docSnapShot");


        if(docSnapShot.exists()){
            const  doc = docSnapShot.data();

            const timeStamp = doc.dateTime;
            const newDatetime = timeStamp.toDate();

            doc.dateTime = newDatetime;
            doc.documentId = documentId;
            
            return res.send(doc);
        }else{
            return res.status(400).send("There have some problem getting updated data");
        }
        

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});

router.patch("/updateFavourite/:documentId",async(req,res)=>{
    try {
        const userName = req.headers["userName"];
        const documentId = req.params["documentId"];
        const data = req.body;

        console.log(data);
        
        

        if(!data||!data.hasOwnProperty("isFavourite") || typeof data.isFavourite!=="boolean"){
            return res.status(400).send("no body or body is not okay")
        }

        console.log("sdsdsd");
        

        const noteDocRef = doc(db,userName,documentId)

        const docSnapShotBeforeUpdate = await getDoc(noteDocRef);
        if(!docSnapShotBeforeUpdate.exists()){
            return res.status(400).send("No document to update");
        }

        await updateDoc(noteDocRef,{
            
            isFavourite:data.isFavourite,

        })

        console.log("updated");


        const docSnapShot = await getDoc(noteDocRef);

        console.log("docSnapShot");


        if(docSnapShot.exists()){
            const  doc = docSnapShot.data();

            const timeStamp = doc.dateTime;
            const newDatetime = timeStamp.toDate();

            doc.dateTime = newDatetime;
            doc.documentId = documentId;
            
            return res.send(doc);
        }else{
            return res.status(400).send("There have some problem getting updated data");
        }

    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
})

router.delete("/deleteNote/:documentId", async(req, res) => {
    try {
        const { documentId } = req.params;
        console.log(documentId);
        
        const userName = req.headers["userName"];

        console.log(userName);

        const noteDocRef = doc(db, userName, documentId)
        console.log("noteDocRef completed");
        
        const docSnapShot = await getDoc(noteDocRef);

        console.log("noteDocRef completed");

        if(docSnapShot.exists()){
            await deleteDoc(noteDocRef);
        }else{
           return res.status(400).send("No document with this id");
        }
        

        


        res.send({
            message:"document deleted",
        });



       

    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

});


router.get("/search",async(req,res)=>{
    try {
        const userName = req.headers["userName"];
        console.log(userName);
        
        const keyword = req.query["searchText"];
        console.log(keyword);

        const querySnapshot = await getDocs(collection(db, userName.toString()));
        

        const noteList = [];

        querySnapshot.forEach((doc) => {
            
            const documentId = doc.id;
            const rDoc = doc.data();
            rDoc.documentId = documentId;
            const timeStamp = rDoc.dateTime;
           // console.log(timeStamp);

           
            
            const datetimeString = timeStamp.toDate();
            

            rDoc.dateTime = datetimeString;
            
            //console.log(doc.id, " => ", doc.data());
            noteList.push(rDoc);
        });

        const filteredList = noteList.filter((note)=>(note.title && note.title.toLowerCase().includes(keyword)) || 
        (note.content && note.content.toLowerCase().includes(keyword)))

        res.send(filteredList);
        
        
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
})


app.use("/note", router);


// Start the HTTP server
app.listen(PORT, () => console.log("App is running on port " + PORT));



function authenticateUser(userName, password) {
    const user = users.find(u => u.userName === userName && u.password === password);
    return user ? user.auth_key : null;
}



// function getAuthKey() {
//     // const characters =
//     //     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let authKey = "";
//     // for (let i = 0; i < 64; i++) {
//     //     authKey += characters.charAt(
//     //         Math.floor(Math.random() * characters.length)
//     //     );
//     // }
//     return authKey;
// }



function checkUserAuthKey(auth_key) {

    if (auth_key && auth_key.startsWith("Bearer ")) {
        const token = auth_key.split(" ")[1];

        const user = users.find(
            (user) => user.auth_key == token
        );
        if (user) {
            return user.userName;
        } else {
            return false;
        }

    } else {
        return false;
    }

}

function validateNoteRequest(req, res, next) {
    const note = req.body;

    if(req.method == "PUT"){
        const  documentId  = req.params["documentId"];
            // Check document is equal in path parameter and body
        if(note.documentId!==documentId){
            return res.status(400).send("'documentId' in body and path parameters are not equal");
        }
    }



    // Check if all required keys exist
    if (!note.hasOwnProperty("title") || !note.hasOwnProperty("content") || !note.hasOwnProperty("image") || !note.hasOwnProperty("dateTime") || !note.hasOwnProperty("isFavourite")) {
        return res.status(400).send("Missing required fields: 'title', 'content', dateTime, isFavourite or 'image'");
    }

    // Validate title and content
    if (!note.title || typeof note.title !== "string" || note.title.trim() === "") {
        return res.status(400).send(
            "'title' must be a non-empty string"
        );
    }

    // validate content
    if (!note.content || typeof note.content !== "string" || note.content.trim() === "") {
        return res.status(400).send("'content' must be a non-empty string");
    }

    // Validate image
    if (note.image !== null && typeof note.image !== "string") {
        return res.status(400).send("'image' must be either null or a string");
    }

    // validate dateTime
    if (!note.dateTime || typeof note.dateTime !== "string" || note.dateTime.trim() === "") {
        return res.status(400).send("'dateTime' must be a non-empty string");
    }

    // convert date to firestore time
    const date = new Date(note.dateTime);

    const firestoreTimestamp = Timestamp.fromDate(date);

    note.dateTime = firestoreTimestamp;

    

    // validate favourite
    if ( typeof note.isFavourite !== "boolean") {
        return res.status(400).send("'isFavourite' is not included or not a boolean");
    }

    // if document id is present need to delete it
    if("documentId" in note){
        delete note.documentId;
    }

    const filteredNote = filterReceivedNote(note)

    req.body = filteredNote;

   

    next(); // Proceed to the next middleware or route handler
}

function deleteImage(filename) {

    if (!filename) {
        return;
    }

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


function getTheMaxId(list) {
    const maxId = list.reduce((max, item) => item.id > max ? item.id : max, 0);

    console.log("Maximum ID:", maxId);
    return maxId;
}

function validateUserId(req, res, next) {
    const userId = req.params["userId"];

}


function filterReceivedNote(input) {
    const allowedKeys = ["documentId", "title", "content", "image", "dateTime", "isFavourite"];
    // Create a new object with only allowed keys
  const filteredObject = {};
  for (const key of allowedKeys) {
    if (key in input) {
      filteredObject[key] = input[key];
    }
  }
  return filteredObject;
}
