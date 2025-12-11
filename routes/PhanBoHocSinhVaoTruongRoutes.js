// routes/PhanBoHocSinhVaoTruongRoutes.js
const express = require('express');
const router = express.Router();
const PhanBoController = require('../controllers/PhanBoHocSinhVaoTruongController');

const checkRole = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'Cán bộ SGD') {
    return res.status(403).send('Không có quyền');
  }
  next();
};

router.get('/render', checkRole, PhanBoController.renderPage);
router.get('/years', checkRole, PhanBoController.getYears);
router.get('/data', checkRole, PhanBoController.getData);
router.post('/run', checkRole, PhanBoController.runAllocation);
router.post('/save', checkRole, PhanBoController.saveAllocation);

module.exports = router;