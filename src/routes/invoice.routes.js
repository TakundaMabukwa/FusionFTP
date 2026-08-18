const express = require('express');
const controller = require('../controllers/invoice.controller');
const apiKeyAuth = require('../middleware/auth.middleware');

const router = express.Router();

router.use(apiKeyAuth);

router.post('/export', controller.exportNextInvoices);

module.exports = router;
