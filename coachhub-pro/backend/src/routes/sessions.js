import express from 'express';
const router = express.Router();

let sessionService;
export const setSessionService = (service) => { sessionService = service; };

router.post('/', async (req, res, next) => {
  try {
    const { coachId, subscriptionId, scheduledAt, duration } = req.body;
    const session = await sessionService.createSession(req.user.userId, coachId, subscriptionId, scheduledAt, duration);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.userId, req.user.role, req.query);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const session = await sessionService.updateSessionStatus(req.params.id, req.body.status, req.user.userId);
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

export default router;
