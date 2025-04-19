const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authenticate = require('../middleware/authenticate');

router.post('/', authenticate, serviceController.createService);
router.get('/', serviceController.getServices);
// Add other service routes...

module.exports = router;