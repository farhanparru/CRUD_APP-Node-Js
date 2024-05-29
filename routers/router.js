const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require("cloudinary").v2;

// Image upload configuration
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({ storage });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const imageUpload = (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        try {
            // Ensure the file exists
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            console.log("Uploading file to Cloudinary:", req.file.path);
            
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "Students-imgs"
            });

            req.body.image = result.secure_url;

            fs.unlink(req.file.path, (error) => {
                if (error) {
                    console.log("Error deleting local file", error);
                }
            });

            next();
        } catch (error) {
            console.error("Cloudinary upload error:", error); // Detailed logging
            return res.status(500).json({ message: "Error uploading file to Cloudinary", error: error.message });
        }
    });
};

// Insert and User into database
router.post('/add', imageUpload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.body.image,
        });

        await user.save();
        req.session.message = {
            type: 'success',
            message: 'User Added successfully'
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: 'Home page',
            users: users
        });
    } catch (err) {
        res.json({ message: err.message });
    }    
});

router.get('/add', (req, res) => {
    res.render('add_user', { title: "Add Users" });
});

module.exports = router;
