const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: String, // ✅ Store userId as a string, not ObjectId
    required: true
  },
  quantity: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);

//For when students buy tickets