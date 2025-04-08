const mongoose = require('mongoose');

const ticketUsageSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
    slotId: Number,
    space: String,
    date: String,
    usedAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('TicketUsage', ticketUsageSchema);

