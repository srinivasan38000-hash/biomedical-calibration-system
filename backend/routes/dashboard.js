const express = require('express');
const Equipment = require('../models/Equipment');
const Maintenance = require('../models/Maintenance');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const [total, active, underMaintenance, outOfService, overdueList, upcomingList, openMaintenance, neverCalibrated] =
      await Promise.all([
        Equipment.countDocuments(),
        Equipment.countDocuments({ status: 'Active' }),
        Equipment.countDocuments({ status: 'Under Maintenance' }),
        Equipment.countDocuments({ status: 'Out of Service' }),
        Equipment.find({ nextCalibrationDate: { $lt: now } }).sort({ nextCalibrationDate: 1 }),
        Equipment.find({ nextCalibrationDate: { $gte: now, $lte: in30 } }).sort({ nextCalibrationDate: 1 }),
        Maintenance.countDocuments({ status: { $ne: 'Completed' } }),
        Equipment.countDocuments({ nextCalibrationDate: null }),
      ]);

    res.json({
      counts: {
        total,
        active,
        underMaintenance,
        outOfService,
        overdue: overdueList.length,
        dueSoon: upcomingList.length,
        neverCalibrated,
        openMaintenance,
      },
      overdue: overdueList,
      upcoming: upcomingList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
