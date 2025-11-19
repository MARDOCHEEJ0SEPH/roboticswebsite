import express from 'express';
import { Review } from '../../../database/mongodb-schema.js';
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { coachId, sessionId, rating, feedback } = req.body;
    const review = new Review({
      coachId,
      studentId: req.user.userId,
      sessionId,
      rating,
      feedback
    });
    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

router.get('/coach/:coachId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ coachId: req.params.coachId, isPublic: true })
      .populate('studentId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

export default router;
