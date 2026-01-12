const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// --- ROUTES (Fixed Paths) ---
// The files are named 'auth.js' and 'tasks.js', NOT 'authRoutes'
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/tasks', require('./routes/tasks')); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));