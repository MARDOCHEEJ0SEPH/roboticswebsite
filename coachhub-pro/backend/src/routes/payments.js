import express from 'express';
import { Payment } from '../../../database/mongodb-schema.js';
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

export default router;
