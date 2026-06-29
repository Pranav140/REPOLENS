const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const repoRoutes = require('./repoRoutes');

router.use('/auth', authRoutes);
router.use('/repos', repoRoutes);

module.exports = router;
