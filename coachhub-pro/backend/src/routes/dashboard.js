import express from 'express';
const router = express.Router();

let coachService, studentService, subscriptionService, sessionService;
export const setServices = (services) => {
  coachService = services.coachService;
  studentService = services.studentService;
  subscriptionService = services.subscriptionService;
  sessionService = services.sessionService;
};

router.get('/overview', async (req, res, next) => {
  try {
    let analytics = {};

    if (req.user.role === 'coach') {
      const [coachStats, sessions, subStats] = await Promise.all([
        coachService.getCoachAnalytics(req.user.userId),
        sessionService.getUserSessions(req.user.userId, 'coach', { limit: 5 }),
        subscriptionService.getSubscriptionStats(req.user.userId, 'coach')
      ]);

      analytics = { ...coachStats, recentSessions: sessions, subscriptionStats: subStats };
    } else {
      const [studentStats, sessions, subscriptions] = await Promise.all([
        studentService.getStudentAnalytics(req.user.userId),
        sessionService.getUserSessions(req.user.userId, 'student', { limit: 5 }),
        subscriptionService.getUserSubscriptions(req.user.userId, 'student')
      ]);

      analytics = { ...studentStats, recentSessions: sessions, subscriptions };
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

export default router;
