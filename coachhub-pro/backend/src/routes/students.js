import express from 'express';
const router = express.Router();

let studentService;
export const setStudentService = (service) => { studentService = service; };

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await studentService.getStudentProfile(req.user.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const profile = await studentService.updateStudentProfile(req.user.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

export default router;
