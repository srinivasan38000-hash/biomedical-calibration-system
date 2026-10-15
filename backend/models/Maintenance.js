const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    type: { type: String, enum: ['Preventive', 'Corrective'], default: 'Preventive' },
    date: { type: Date, required: true },
    technician: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, default: 0 },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed'], default: 'Completed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
