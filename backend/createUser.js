const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function main() {
  const args = process.argv.slice(2);
  const [name, email, password, role] = args;

  if (!name || !email || !password) {
    console.log('\nUsage:');
    console.log('  node backend/createUser.js "<Name>" "<Email>" "<Password>" [ADMIN|TECHNICIAN|STAFF]\n');
    console.log('Example:');
    console.log('  node backend/createUser.js "Dr. Robert" "robert@hospital.com" "hospital123" ADMIN\n');
    process.exit(1);
  }

  const assignedRole = (role || 'STAFF').toUpperCase();
  if (!['ADMIN', 'TECHNICIAN', 'STAFF'].includes(assignedRole)) {
    console.error('Error: Role must be one of: ADMIN, TECHNICIAN, STAFF.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`Error: User with email "${email}" already exists.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    role: assignedRole,
  });

  console.log(`\nUser created successfully:`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Role:  ${user.role}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
