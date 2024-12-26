const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config();
const cors = require('cors')
const path = require('path')



const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
    .catch(error => console.log(`DB Connection error: ${error}`));
const con = mongoose.connection;

//handle error while opening dbb 

con.on('open', error => {
    if (!error)
        console.log('DB Connection Succesful');
    else
        console.log(`Error Connecting to DB: ${error}`);
})

// handle mongoose disconnect from mongodb

con.on('disconnected', error => {
    console.log(`Mongoose lost connection with MongoDB:${error}`)
})



// parse Json data coming in the request body 
app.use(express.json());
app.use(cors());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// gain access to my routes
app.use("/auth", require('./admin/routes/auth'));
app.use("/comment", require('./admin/routes/comment'));
app.use("/post", require('./admin/routes/post'));

const PORT = process.env.PORT || 2670

app.listen(PORT, () => console.log(`server running on port ${PORT}`)
);