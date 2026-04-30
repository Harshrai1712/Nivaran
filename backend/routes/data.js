const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  addData,
  getTodayData,
  getDateData,
  getMonthData,
  getWeeklyData,
} = require('../controllers/dataController');

// All data routes are protected
router.use(authMiddleware);

router.post('/add', addData);
router.get('/today', getTodayData);
router.get('/date/:date', getDateData);
router.get('/month', getMonthData);
router.get('/weekly', getWeeklyData);

module.exports = router;
