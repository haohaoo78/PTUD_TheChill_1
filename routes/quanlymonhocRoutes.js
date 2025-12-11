// routes/quanlymonhoc.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/QuanLyMonHocController');

router.get('/render', ctrl.renderPage);
router.get('/', ctrl.getList);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.add);
router.put('/:id', ctrl.update);
router.patch('/:id/toggle', ctrl.toggle);

module.exports = router;