import express from 'express';
const router = express.Router();

let subscriptionService;
export const setSubscriptionService = (service) => { subscriptionService = service; };

router.post('/', async (req, res, next) => {
  try {
    const { coachId, tier } = req.body;
    const result = await subscriptionService.createSubscription(req.user.userId, coachId, tier);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId, req.user.role);
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.params.id, req.user.userId, req.body.immediate);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

export default router;
