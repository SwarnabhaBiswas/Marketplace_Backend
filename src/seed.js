require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');



async function seed() {
  await connectDB();
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@swasti.com';
  const password = process.env.SEED_ADMIN_PASS || 'ChangeMe123!';
  const existing = await User.findOne({ email });
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name: 'Master Admin', email, passwordHash: hash, role: 'MASTER_ADMIN' });
    console.log(`Created master admin: ${email} / ${password}`);
  } else {
    console.log('Admin already exists');
  }

  const existingProduct = await Product.findOne({});
  if (!existingProduct) {
    await Product.create({
      name: 'Rigid PVC Conduit 25mm',
      slug: 'rigid-pvc-conduit-25mm',
      category: 'Conduits',
      images: [],
      description: 'High-impact rigid PVC conduit for wiring protection.',
      specs: { Material: 'uPVC', 'Inner Diameter': '25mm' }
    });
    console.log('Sample product created');
  }

  process.exit(0);
}

seed().catch(err=>{
  console.error(err);
  process.exit(1);
});
