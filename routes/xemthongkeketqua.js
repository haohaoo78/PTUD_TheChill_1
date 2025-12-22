const express = require('express');
const controller = require('../controllers/XemThongKeKetQuaController');

const router = express.Router();

router.route('/render')
    .get(controller.handleRender)
    .post(controller.handleRender);

module.exports = router;