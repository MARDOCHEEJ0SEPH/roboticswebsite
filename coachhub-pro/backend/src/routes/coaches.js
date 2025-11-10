import express from 'express';
const router = express.Router();

let coachService;
export const setCoachService = (service) => { coachService = service; };

router.get('/', async (req, res, next) => {
  try {
    const coaches = await coachService.getAllCoaches(req.query);
    res.json({ success: true, count: coaches.length, data: coaches });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const coach = await coachService.getCoachById(req.params.id);
    res.json({ success: true, data: coach });
  } catch (error) {
    next(error);
  }
});

router.post('/profile', async (req, res, next) => {
  try {
    const profile = await coachService.createCoachProfile(req.user.userId, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const profile = await coachService.updateCoachProfile(req.user.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/me', async (req, res, next) => {
  try {
    const analytics = await coachService.getCoachAnalytics(req.user.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

export default router;
