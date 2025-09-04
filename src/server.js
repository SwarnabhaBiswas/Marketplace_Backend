require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dealerRoutes = require('./routes/dealers');
const bulkRoutes = require('./routes/bulk');
const contactRoutes = require('./routes/contact');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
  console.error('DB connect error', err);
  process.exit(1);
});
