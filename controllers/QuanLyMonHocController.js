// controllers/QuanLyMonHocController.js
const Model = require('../models/QuanLyMonHocModel');

class QuanLyMonHocController {
  async getList(req, res) {
  try {
    console.log('API /api/quanlymonhoc called:', req.query);
    const { khoi, trangthai, search = '' } = req.query;
    const data = await Model.getList(khoi, trangthai, search.trim());
    console.log('Data loaded:', data.length, 'records');
    res.json({ success: true, data });
  } catch (err) {
    console.error('Controller error:', err);
    res.json({ success: false, message: err.message });
  }
}

  async getById(req, res) {
    try {
      const data = await Model.getById(req.params.id);
      res.json({ success: !!data, data: data || {} });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async add(req, res) {
    try {
      console.log('Adding mon hoc:', req.body); // DEBUG
      await Model.add(req.body);
      res.json({ success: true, message: 'Thêm môn học thành công' });
    } catch (err) {
      console.error('Add error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      await Model.update(req.params.id, req.body);
      res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggle(req, res) {
    try {
      await Model.toggleStatus(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: err.message });
    }
  }

  async renderPage(req, res) {
    res.render('pages/quanlymonhoc');
  }
}

module.exports = new QuanLyMonHocController();