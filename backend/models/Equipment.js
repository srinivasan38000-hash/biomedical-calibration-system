const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    assetId: { type: String, required: true, unique: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    manufacturer: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Active', 'Under Maintenance', 'Out of Service'],
      default: 'Active',
    },
    calibrationIntervalDays: { type: Number, default: 365 },
    lastCalibrationDate: { type: Date },
    nextCalibrationDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
