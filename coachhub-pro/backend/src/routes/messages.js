import express from 'express';
import { Message } from '../../../database/mongodb-schema.js';
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const message = new Message({
      senderId: req.user.userId,
      recipientId,
      content
    });
    await message.save();
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.user.userId }
      ]
    }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

export default router;
