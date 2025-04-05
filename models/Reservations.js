const mongoose = require('mongoose');

const reservationsSchema = new mongoose.Schema({
    space: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    slotId: { type: Number, required: true },
    anonymous: { type: Boolean, default: false },
    userName: { type: String, required: true },
});

const Reservations = mongoose.model('reservationsCollection', reservationsSchema);

module.exports = Reservations;
