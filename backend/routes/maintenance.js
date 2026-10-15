const express = require('express');
const Maintenance = require('../models/Maintenance');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/maintenance?equipment=<id>
router.get('/', async (req, res) => {
  try {
    const filter = req.query.equipment ? { equipment: req.query.equipment } : {};
    const list = await Maintenance.find(filter)
      .populate('equipment', 'name assetId')
      .sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/maintenance
router.post('/', allowRoles('ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const record = await Maintenance.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/maintenance/:id  (e.g. change status to Completed)
router.put('/:id', allowRoles('ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', allowRoles('ADMIN'), async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
