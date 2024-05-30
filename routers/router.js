const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    }
});

var upload = multer({
    storage: storage
}).single("image");

// Insert and User into database
router.post('/add', upload, async (req, res) => {
    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);

        const user = new User({   
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: result.url // Save the Cloudinary URL in the database
        });

        await user.save();

        // Remove the file from the server after uploading to Cloudinary
        fs.unlinkSync(req.file.path);

        req.session.message = {
            type: 'success',
            message: 'User Added successfully'
        };
        res.redirect("/");
    } catch (err) {
        console.log(err);
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
// Edit an users

router.get('/edit/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findById(id).exec();

        if (user == null) {
            res.redirect('/');
        } else {
            res.render('edit_user', {
                title: 'Edit User',
                user: user
            });
        }
    } catch (error) {
        res.redirect('/');
    }
});


// update user

router.post('/update/:id', upload,async(req,res)=>{
    try {
        let id = req.params.id;
        let new_image = req.body.old_image;

        if(req.file){
            const result = await cloudinary.uploader.upload(req.file.path);
            new_image = result.url;
             // Remove the file from the server after uploading to Cloudinary
             fs.unlinkSync(req.file.path);
            }
            await User.findByIdAndUpdate(id, {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                image: new_image
            });
            req.session.message = {
                type: 'success',
                message: 'User updated successfully'
            };
    
            res.redirect('/');
    
          } catch (error) {
            res.json({ message: error.message, type: 'danger' });
        }
       })


 // delete user in database
 router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await User.findByIdAndDelete(id);

        if (!result) {
            req.session.message = {
                type: 'danger',
                message: 'User not found'
            };
            return res.redirect('/');
        }

        if (result.image) {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (unlinkErr) {
                console.log(unlinkErr);
            }
        }

        req.session.message = {
            type: 'success',
            message: 'User deleted successfully'
        };       
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    }
});

router.get('/add', (req, res) => {
    res.render('add_user', { title: "Add Users" });
});

module.exports = router;
