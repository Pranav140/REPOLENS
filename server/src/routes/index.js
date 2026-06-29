const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const repoRoutes = require('./repoRoutes');
const searchRoutes = require('./searchRoutes');
const graphRoutes = require('./graphRoutes');
const securityRoutes = require('./securityRoutes');

router.use('/auth', authRoutes);
router.use('/repos', repoRoutes);
router.use('/search', searchRoutes);
router.use('/graph', graphRoutes);
router.use('/security', securityRoutes);

module.exports = router;
