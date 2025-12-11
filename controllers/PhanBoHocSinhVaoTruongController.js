// controllers/PhanBoHocSinhVaoTruongController.js
const PhanBoModel = require('../models/PhanBoHocSinhVaoTruongModel');

const PhanBoController = {
  renderPage: async (req, res) => {
    res.render('pages/phanbohocsinhvaotruong', { user: req.session.user });
  },

  getYears: async (req, res) => {
    try {
      const years = await PhanBoModel.getYears();
      res.json({ success: true, years });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  getData: async (req, res) => {
    const { nam_thi } = req.query;
    if (!nam_thi) return res.json({ success: false, message: 'Chọn năm thi' });

    try {
      const hasResults = await PhanBoModel.hasAllocationResults(nam_thi);
      if (hasResults) {
        const { results, stats, totalAllocated, totalCandidates } = await PhanBoModel.getAllocationResults(nam_thi);
        return res.json({ success: true, hasResults: true, stats, totalAllocated, totalCandidates, results });
      } else {
        const quotas = await PhanBoModel.getQuotas(nam_thi);
        return res.json({ success: true, hasResults: false, quotas });
      }
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  runAllocation: async (req, res) => {
    const { nam_thi } = req.body;
    if (!nam_thi) return res.json({ success: false, message: 'Chọn năm thi' });

    try {
      const { results, stats, totalAllocated, totalCandidates } = await PhanBoModel.allocate(nam_thi);
      res.json({ success: true, stats, totalAllocated, totalCandidates, results });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  },

  saveAllocation: async (req, res) => {
    const { nam_thi, results } = req.body;
    try {
      await PhanBoModel.saveAllocation(results, nam_thi);
      // Sau khi save, có thể thông báo đến trường (nếu cần implement email/sms, nhưng tạm skip)
      res.json({ success: true, message: 'Phân bổ thành công! Kết quả đã lưu vào DB và có thể xem lại.' });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }
};

module.exports = PhanBoController;