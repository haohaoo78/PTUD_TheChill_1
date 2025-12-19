const express = require('express');
const router = express.Router();
const QuanLyDiemMonHocController = require('../controllers/QuanLyDiemMonHocController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const evidenceDir = path.join(__dirname, '..', 'public', 'minhchung');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

function nextEvidenceFilename(originalname) {
  const ext = path.extname(originalname || '') || '';
  const files = fs.readdirSync(evidenceDir);
  let max = 0;
  for (const f of files) {
    const m = String(f).match(/^minhchung(\d+)\./i);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `minhchung${max + 1}${ext}`;
}

const uploadEvidence = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, evidenceDir),
    filename: (_req, file, cb) => cb(null, nextEvidenceFilename(file.originalname))
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Render UI
router.get('/render', QuanLyDiemMonHocController.renderClassList);
router.get('/render/classes', QuanLyDiemMonHocController.renderClassList);
router.get('/render/students', QuanLyDiemMonHocController.renderStudentList);
router.get('/render/request-edit', QuanLyDiemMonHocController.renderRequestEdit);
// API
router.get('/classes', QuanLyDiemMonHocController.getClasses);
router.get('/students', QuanLyDiemMonHocController.getStudents);
router.get('/old-score', QuanLyDiemMonHocController.getOldScore);
router.post('/scores', QuanLyDiemMonHocController.saveScores);
router.post('/request-edit', uploadEvidence.single('minhChung'), QuanLyDiemMonHocController.submitRequestEdit);

module.exports = router;
