const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');

router.post('/checkoutTickets', async (req, res) => {
  const userId = req.session.userId;
  const { quantity } = req.body;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  try {
    await Purchase.create({ userId, quantity });
    await User.findByIdAndUpdate(userId, { $inc: { ticketCount: quantity * 10 } });

    res.status(200).json({ message: 'Tickets purchased successfully' });
  } catch (err) {
    console.error('Error in /api/checkoutTickets:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
