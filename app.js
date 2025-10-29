const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();
const bodyParser = require('body-parser');

// DATABASE
global.db = require('./config/database');

// ROUTES
const DangNhapRoutes = require('./routes/DangNhapRouters');
const ThoiKhoaBieuRoutes = require('./routes/ThoiKhoaBieuRoutes');
const DuyetRoutes = require('./routes/DuyetYeuCauSuaDiemRoutes');
const ChiTieuRoutes = require('./routes/NhapChitieuTuyenSinhRoutes');
const DangKyRoutes = require('./routes/DangKyRoutes');

const app = express();

// VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE
app.use('/minhchung', express.static(path.join(__dirname, 'minhchung')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
}));

// ROUTES
app.use('/', DangNhapRoutes);
app.use('/', DangKyRoutes);
app.use('/api/thoikhoabieu', ThoiKhoaBieuRoutes);
app.use('/api/duyetyeucausuadiem', DuyetRoutes);
app.use('/api/nhapchitieutuyensinh', ChiTieuRoutes);


// TRANG CHÍNH
app.get('/', (req, res) => {
  const user = req.session.user;
  if (!user) return res.render('index', { page: 'dangnhap', user: null });
  res.render('index', { page: 'home', user });
});

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Không tìm thấy trang.' }));

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
