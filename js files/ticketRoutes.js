
const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');

router.post('/checkoutTickets', async (req, res) => {
  try {
    const user = req.session.user;
    const quantity = parseInt(req.body.quantity);
    const totalAmount = quantity * 620;

    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const purchase = new Purchase({
      userId: user.userId,
      quantity,
      totalAmount
    });

    await purchase.save();

    await User.findOneAndUpdate(
      { userId: user.userId },
      { $inc: { ticketCount: quantity * 10 } }
    );

    res.status(200).json({ message: 'Purchase successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
