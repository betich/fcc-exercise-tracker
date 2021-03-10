const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: Date,
    duration: { type: Number, required: true },
    description: { type: String, required: true }
})

module.exports = mongoose.model('Exercise', exerciseSchema);