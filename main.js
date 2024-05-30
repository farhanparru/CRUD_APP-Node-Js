require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')

const app = express();   
const PORT = process.env.PORT || 400

   
/// databse connection

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to the Database!'));
    
// middlewares

app.use(express.urlencoded({extended:false}))
app.use(express.json())


app.use(session({
    secret: 'my secret key',
    saveUninitialized:true,
    resave:false,
})
)

app.use((req,res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message
    next()
});

app.use(express.static('uploads'))

// set Template engine

app.set('view engine', 'ejs');

// router prefix

app.use('',require('./routers/router'))


app.listen(PORT,()=>{
    console.log(`Server startd at http://localhost:${PORT}`);
})