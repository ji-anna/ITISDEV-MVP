const mongoose = require('mongoose');

const reservationsSchema = new mongoose.Schema({
    space: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    slotId: { type: Number, required: true },
    anonymous: { type: Boolean, default: false },
    userId: { type: String, required: true },
    status: {
        type: String,
        enum: ['active', 'completed', 'overtime', 'paid'],
        default: 'active'
      },
    paidAt: {
        type: Date,
        default: null
    }
      
  
});

const Reservations = mongoose.model('reservationsCollection', reservationsSchema);

module.exports = Reservations;
