const express = require('express');
const fs = require('fs');
const path = require('path');
const Equipment = require('../models/Equipment');
const Calibration = require('../models/Calibration');
const Maintenance = require('../models/Maintenance');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const addDays = (date, days) => new Date(new Date(date).getTime() + days * 86400000);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/equipment?search=&status=
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: rx }, { assetId: rx }, { location: rx }, { category: rx }];
    }
    const list = await Equipment.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/equipment
router.post('/', allowRoles('ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.lastCalibrationDate && !data.nextCalibrationDate) {
      data.nextCalibrationDate = addDays(data.lastCalibrationDate, data.calibrationIntervalDays || 365);
    }
    ['lastCalibrationDate', 'nextCalibrationDate'].forEach((k) => {
      if (!data[k]) delete data[k];
    });
    const item = await Equipment.create(data);
    res.status(201).json(item);
  } catch (err) {
    const msg = err.code === 11000 ? 'Asset ID already exists' : err.message;
    res.status(400).json({ message: msg });
  }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Device not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: 'Invalid device id' });
  }
});

// PUT /api/equipment/:id
router.put('/:id', allowRoles('ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Device not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/equipment/:id  (also removes its records and files)
router.delete('/:id', allowRoles('ADMIN'), async (req, res) => {
  try {
    const item = await Equipment.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Device not found' });

    const cals = await Calibration.find({ equipment: item._id });
    cals.forEach((c) => {
      if (c.certificateFile) {
        fs.unlink(path.join(__dirname, '..', 'uploads', c.certificateFile), () => {});
      }
    });
    await Calibration.deleteMany({ equipment: item._id });
    await Maintenance.deleteMany({ equipment: item._id });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
