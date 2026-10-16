const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const Equipment = require('./models/Equipment');
const Calibration = require('./models/Calibration');
const Maintenance = require('./models/Maintenance');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    // Skip if data already exists (idempotent) unless --force flag is passed
    const forceReseed = process.argv.includes('--force');
    const existingCount = await Equipment.countDocuments();
    if (existingCount > 0 && !forceReseed) {
      console.log(`Seed skipped: ${existingCount} equipment records already exist. Use --force to reseed.`);
      process.exit(0);
    }

    // Clean old demo data (leave users intact)
    await Equipment.deleteMany({});
    await Calibration.deleteMany({});
    await Maintenance.deleteMany({});

    // Drop stale indexes if they exist in MongoDB
    for (const [colName, idxName] of [
      ['equipment', 'equipmentId_1'],
      ['calibrations', 'calibrationId_1'],
      ['maintenances', 'maintenanceId_1'],
    ]) {
      try {
        await mongoose.connection.collection(colName).dropIndex(idxName);
        console.log(`Dropped obsolete ${idxName} index on ${colName}.`);
      } catch (e) {
        // index might not exist
      }
    }

    // Ensure uploads directory has a sample certificate file
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const sampleCertName = 'cert_BME-DEF-001_calibration.pdf';
    fs.writeFileSync(
      path.join(uploadsDir, sampleCertName),
      '%PDF-1.4 Biomedical Calibration Certificate - Certified Compliant with ISO 13485 / IEC 60601-1'
    );

    const now = new Date();
    const days = (d) => new Date(now.getTime() + d * 86400000);

    const devicesData = [
      {
        name: 'Defibrillator / Monitor',
        assetId: 'BME-DEF-001',
        category: 'Cardiovascular',
        manufacturer: 'Zoll Medical',
        model: 'R Series ALS',
        serialNumber: 'ZL-984421',
        location: 'ICU - Room 302',
        status: 'Active',
        calibrationIntervalDays: 180,
        lastCalibrationDate: days(-165),
        nextCalibrationDate: days(15), // Due in 15 days (Due in 30 days)
      },
      {
        name: 'Volumetric Infusion Pump',
        assetId: 'BME-INF-104',
        category: 'Infusion & Delivery',
        manufacturer: 'BD CareFusion',
        model: 'Alaris 8015',
        serialNumber: 'BD-883109',
        location: 'Neonatal ICU - Pod 2',
        status: 'Active',
        calibrationIntervalDays: 365,
        lastCalibrationDate: days(-375),
        nextCalibrationDate: days(-10), // Overdue by 10 days
      },
      {
        name: 'Anesthesia Workstation',
        assetId: 'BME-ANE-002',
        category: 'Surgical & Anesthesia',
        manufacturer: 'Dräger',
        model: 'Apollo',
        serialNumber: 'DR-440212',
        location: 'Operation Theater 1',
        status: 'Under Maintenance',
        calibrationIntervalDays: 180,
        lastCalibrationDate: days(-200),
        nextCalibrationDate: days(-20), // Overdue by 20 days
      },
      {
        name: 'ICU Mechanical Ventilator',
        assetId: 'BME-VEN-005',
        category: 'Respiratory',
        manufacturer: 'Hamilton Medical',
        model: 'Hamilton-C6',
        serialNumber: 'HM-551920',
        location: 'Critical Care Unit - Bed 4',
        status: 'Active',
        calibrationIntervalDays: 365,
        lastCalibrationDate: days(-90),
        nextCalibrationDate: days(275), // Valid
      },
      {
        name: 'Multi-Parameter Patient Monitor',
        assetId: 'BME-MON-023',
        category: 'Patient Monitoring',
        manufacturer: 'Philips Healthcare',
        model: 'IntelliVue MX800',
        serialNumber: 'PH-110294',
        location: 'Emergency Department - Trauma Bay 1',
        status: 'Active',
        calibrationIntervalDays: 365,
        lastCalibrationDate: days(-345),
        nextCalibrationDate: days(20), // Due in 20 days (Due in 30 days)
      },
      {
        name: '12-Lead Diagnostic ECG',
        assetId: 'BME-ECG-008',
        category: 'Diagnostic Cardiology',
        manufacturer: 'GE Healthcare',
        model: 'MAC 2000',
        serialNumber: 'GE-772091',
        location: 'Cardiology Clinic - Room 104',
        status: 'Out of Service',
        calibrationIntervalDays: 365,
        lastCalibrationDate: days(-300),
        nextCalibrationDate: days(65),
      },
      {
        name: 'Electrosurgical Generator Unit (ESU)',
        assetId: 'BME-ESU-012',
        category: 'Surgical & Anesthesia',
        manufacturer: 'Medtronic',
        model: 'ForceFX',
        serialNumber: 'MD-330198',
        location: 'Operation Theater 3',
        status: 'Active',
        calibrationIntervalDays: 365,
        lastCalibrationDate: null,
        nextCalibrationDate: null, // Never calibrated
      },
      {
        name: 'Diagnostic Ultrasound System',
        assetId: 'BME-ULT-015',
        category: 'Medical Imaging',
        manufacturer: 'GE Healthcare',
        model: 'LOGIQ E10',
        serialNumber: 'GE-991204',
        location: 'Radiology Ultrasound Suite 2',
        status: 'Active',
        calibrationIntervalDays: 365,
        lastCalibrationDate: days(-120),
        nextCalibrationDate: days(245), // Valid
      },
      {
        name: 'Automated Blood Gas Analyzer',
        assetId: 'BME-BGA-003',
        category: 'Laboratory',
        manufacturer: 'Radiometer',
        model: 'ABL90 FLEX PLUS',
        serialNumber: 'RM-209841',
        location: 'Central Diagnostic Lab',
        status: 'Under Maintenance',
        calibrationIntervalDays: 90,
        lastCalibrationDate: days(-82),
        nextCalibrationDate: days(8), // Due in 8 days (Due in 30 days)
      },
      {
        name: 'Hemodialysis Machine',
        assetId: 'BME-DIA-007',
        category: 'Renal Care',
        manufacturer: 'Fresenius Medical Care',
        model: '5008S CorDiax',
        serialNumber: 'FR-660231',
        location: 'Dialysis Center - Station 7',
        status: 'Active',
        calibrationIntervalDays: 180,
        lastCalibrationDate: days(-60),
        nextCalibrationDate: days(120), // Valid
      },
    ];

    const insertedDevices = await Equipment.insertMany(devicesData);
    console.log(`Inserted ${insertedDevices.length} equipment items.`);

    // Map by assetId for easy referencing
    const devMap = {};
    for (const d of insertedDevices) {
      devMap[d.assetId] = d._id;
    }

    // Calibration records
    const calibrations = [
      {
        equipment: devMap['BME-DEF-001'],
        calibrationDate: days(-165),
        nextDueDate: days(15),
        performedBy: 'Fluke Biomedical Specialist',
        result: 'Pass',
        notes: 'Energy discharge verified (5J - 360J within ±2%). Synchronous cardioversion delay < 20ms.',
        certificateFile: sampleCertName,
        certificateName: 'BME-DEF-001_NIST_Calibration_Cert.pdf',
      },
      {
        equipment: devMap['BME-INF-104'],
        calibrationDate: days(-375),
        nextDueDate: days(-10),
        performedBy: 'In-House BioMed Tech',
        result: 'Pass',
        notes: 'Flow rate verified with IDA-4 Plus analyzer at 25ml/h, 50ml/h, and 125ml/h.',
      },
      {
        equipment: devMap['BME-ANE-002'],
        calibrationDate: days(-200),
        nextDueDate: days(-20),
        performedBy: 'Dräger Authorized Service',
        result: 'Pass',
        notes: 'O2 cell replaced and calibrated. Gas flow transducer checked.',
      },
      {
        equipment: devMap['BME-VEN-005'],
        calibrationDate: days(-90),
        nextDueDate: days(275),
        performedBy: 'Hamilton Certified Engineer',
        result: 'Pass',
        notes: 'P/V loop accuracy checked with CITREX H5 gas flow analyzer.',
      },
      {
        equipment: devMap['BME-MON-023'],
        calibrationDate: days(-345),
        nextDueDate: days(20),
        performedBy: 'In-House BioMed Tech',
        result: 'Pass',
        notes: 'NIBP simulator, SpO2 tester (Index 2), and ECG phantom tested within 1% tolerance.',
      },
      {
        equipment: devMap['BME-ULT-015'],
        calibrationDate: days(-120),
        nextDueDate: days(245),
        performedBy: 'GE Service Engineer',
        result: 'Pass',
        notes: 'Doppler velocity accuracy and transducer beam alignment verified with tissue-mimicking phantom.',
      },
      {
        equipment: devMap['BME-BGA-003'],
        calibrationDate: days(-82),
        nextDueDate: days(8),
        performedBy: 'Radiometer Field Engineer',
        result: 'Pass',
        notes: 'Automated 2-point liquid calibration cycle passed. pH, pO2, and pCO2 electrodes verified.',
      },
      {
        equipment: devMap['BME-DIA-007'],
        calibrationDate: days(-60),
        nextDueDate: days(120),
        performedBy: 'Fresenius Technical Specialist',
        result: 'Pass',
        notes: 'Conductivity meter, dialysate temperature, and ultrafiltration rate calibration passed.',
      },
    ];

    const insertedCals = await Calibration.insertMany(calibrations);
    console.log(`Inserted ${insertedCals.length} calibration records.`);

    // Maintenance records
    const maintenanceRecords = [
      {
        equipment: devMap['BME-ANE-002'],
        type: 'Corrective',
        date: days(-2),
        technician: 'Senior Tech Alex Rivera',
        description: 'Vaporizer leak detected during pre-op checkout. Replacement O-ring seal ordered and being fitted.',
        cost: 450,
        status: 'In Progress',
      },
      {
        equipment: devMap['BME-BGA-003'],
        type: 'Preventive',
        date: days(1),
        technician: 'Tech Sarah Chen',
        description: 'Scheduled multi-test sensor cassette replacement and fluidic peristaltic pump tubing change.',
        cost: 320,
        status: 'Scheduled',
      },
      {
        equipment: devMap['BME-ECG-008'],
        type: 'Corrective',
        date: days(-5),
        technician: 'Senior Tech Alex Rivera',
        description: 'Lead II and V3 intermittent disconnect due to worn trunk cable strain relief. Leadwire assembly replaced.',
        cost: 210,
        status: 'Completed',
      },
      {
        equipment: devMap['BME-VEN-005'],
        type: 'Preventive',
        date: days(-90),
        technician: 'Hamilton Certified Field Engineer',
        description: 'Annual 1-year service kit installed: expiratory valve membrane, internal Li-ion battery health check, O2 filter replaced.',
        cost: 850,
        status: 'Completed',
      },
      {
        equipment: devMap['BME-DEF-001'],
        type: 'Preventive',
        date: days(-165),
        technician: 'In-House BioMed Tech',
        description: 'Semi-annual electrical safety inspection (IEC 62353), chassis leakage current test (< 100 µA), battery load test.',
        cost: 150,
        status: 'Completed',
      },
    ];

    const insertedMaint = await Maintenance.insertMany(maintenanceRecords);
    console.log(`Inserted ${insertedMaint.length} maintenance records.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
