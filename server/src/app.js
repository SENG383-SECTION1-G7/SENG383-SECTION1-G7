const express = require('express');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const childrenRoutes = require('./routes/children');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/children', childrenRoutes);

module.exports = app;
