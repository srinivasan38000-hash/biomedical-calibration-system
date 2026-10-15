const express = require('express');
const fs = require('fs');
const path = require('path');
const Calibration = require('../models/Calibration');
const Equipment = require('../models/Equipment');
const upload = require('../middleware/upload');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const addDays = (date, days) => new Date(new Date(date).getTime() + days * 86400000);

// GET /api/calibrations?equipment=<id>
router.get('/', async (req, res) => {
  try {
    const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
    const list = await Calibration.find(filter)
      .populate('equipment', 'name assetId')
      .sort({ calibrationDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/calibrations  (multipart form, optional "certificate" file)
router.post('/', allowRoles('ADMIN', 'TECHNICIAN'), upload.single('certificate'), async (req, res) => {
  try {
    const { equipment, calibrationDate, nextDueDate, performedBy, result, notes } = req.body;
    const device = await Equipment.findById(equipment);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (!calibrationDate) return res.status(400).json({ message: 'Calibration date is required' });

    const due = nextDueDate || addDays(calibrationDate, device.calibrationIntervalDays || 365);

    const record = await Calibration.create({
      equipment,
      calibrationDate,
      nextDueDate: due,
      performedBy,
      result,
      notes,
      certificateFile: req.file ? req.file.filename : undefined,
      certificateName: req.file ? req.file.originalname : undefined,
    });

    // Keep the device dates up to date
    device.lastCalibrationDate = calibrationDate;
    device.nextCalibrationDate = due;
    await device.save();

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/calibrations/:id
router.delete('/:id', allowRoles('ADMIN'), async (req, res) => {
  try {
    const record = await Calibration.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.certificateFile) {
      fs.unlink(path.join(__dirname, '..', 'uploads', record.certificateFile), () => {});
    }
    // Point the device back to its latest remaining calibration
    const latest = await Calibration.findOne({ equipment: record.equipment }).sort({ calibrationDate: -1 });
    await Equipment.findByIdAndUpdate(record.equipment, {
      lastCalibrationDate: latest ? latest.calibrationDate : null,
      nextCalibrationDate: latest ? latest.nextDueDate : null,
    });
    res.json({ message: 'Calibration record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
