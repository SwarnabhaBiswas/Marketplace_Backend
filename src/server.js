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
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowlist = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173' ||"swastipipes-2ythba4ux-swarnabha-biswas-projects.vercel.app"||"https://swastipipes.vercel.app")
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser or same-origin
    const ok = allowlist.some(o => {
      if (o === origin) return true;
      if (o.startsWith('*.')) return origin.endsWith(o.slice(1));
      return false;
    });
    cb(ok ? null : new Error('CORS blocked'), ok);
  },
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
  console.error('DB connect error', err);
  process.exit(1);
});
