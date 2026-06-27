import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import materialRoutes from './routes/materialRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import usageRoutes from './routes/usageRoutes';
import wastageRoutes from './routes/wastageRoutes';
import projectRoutes from './routes/projectRoutes';
import siteRoutes from './routes/siteRoutes';
import supplierRoutes from './routes/supplierRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import alertRoutes from './routes/alertRoutes';
import transferRoutes from './routes/transferRoutes';
import labourRoutes from './routes/labourRoutes';
import expenseRoutes from './routes/expenseRoutes';
import enquiryRoutes from './routes/enquiryRoutes';
import milestoneRoutes from './routes/milestoneRoutes';
import subcontractorRoutes from './routes/subcontractorRoutes';
import machineryRoutes from './routes/machineryRoutes';
import progressRoutes from './routes/progressRoutes';
import aiRoutes from './routes/aiRoutes';

import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS Configuration (Connects Frontend with Backend)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.info(msg.trim()) }
  }));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Friendly service entry points
app.get('/', (req, res) => {
  res.json({
    name: 'Material Inventory Management System API',
    status: 'ok',
    api: '/api',
    health: '/api/health'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Material Inventory Management System API',
    status: 'ok',
    health: '/api/health'
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchase-orders', purchaseRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/subcontractors', subcontractorRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
