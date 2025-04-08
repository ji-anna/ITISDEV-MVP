const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    profileImg: { type: String, default: '/assets/default.jpg' },
    profileDesc: { type: String, default: 'I am from DLSU' },
    carPlate: { type: String, required: false },

    // 🟢 Ticket-related field
    ticketCount: { type: Number, default: 0 } // Number of available tickets (auto-deducts when reserved)
});

const User = mongoose.model('userCollection', userSchema);
module.exports = User;
