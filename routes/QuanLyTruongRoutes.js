// routes/QuanLyTruongRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/QuanLyTruongController');

// GET + FILTER
router.get('/getAll', controller.getAll);

// CRUD
router.post('/create', controller.create);
router.put('/update/:MaTruong', controller.update);
router.delete('/delete/:MaTruong', controller.delete);

router.get('/render', controller.renderPage);

module.exports = router;
