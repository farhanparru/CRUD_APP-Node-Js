const mongoose= require('mongoose')
const userSchmea = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    created:{
        type:Date,
        required:true,
        default: Date.now,
    }   
})

module.exports = mongoose.model('User',userSchmea)