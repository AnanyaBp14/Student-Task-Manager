const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Added Name
    email: { type: String, required: true, unique: true }, // Changed Username to Email
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('user', UserSchema);