const mongoose = require('mongoose');

const calibrationSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    calibrationDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true },
    performedBy: { type: String, trim: true },
    result: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
    notes: { type: String, trim: true },
    certificateFile: { type: String },
    certificateName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Calibration', calibrationSchema);
