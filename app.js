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
const QLHS_GV = require('./routes/QuanLyHSGVRoutes');
const XetDiemRenLuyenRoutes = require('./routes/XetDiemRenLuyenRoutes');
const NhapDiemThiTuyenSinhRoutes = require('./routes/NhapDiemThiTuyenSinhRoutes');
const PhanCongChuNhiemBoMonRoutes = require('./routes/PhanCongChuNhiemBoMonRoutes');
const QuanLyLopRoutes = require('./routes/QuanLyLopRoutes');
const PhanLopRoutes = require('./routes/PhanLopRoutes');
const XemBaiTapRoutes = require('./routes/XemBaiTapRoutes');
const DangKyTuyenSinhRoutes = require('./routes/DangKyTuyenSinhRoutes');
const ThongTinHSRoutes = require('./routes/ThongTinHSRoutes');
const taotaikhoanRoutes = require('./routes/taotaikhoanRoutes');
const QuanLyTruongRoutes = require('./routes/QuanLyTruongRoutes');
const quanlymonhocRoutes = require('./routes/quanlymonhocRoutes');
const PhanBoHocSinhVaoTruongRoutes = require('./routes/PhanBoHocSinhVaoTruongRoutes');
const XemDiemRoutes = require('./routes/XemDiemRoutes');
const XinPhepRoutes = require('./routes/XinPhepRoutes');
const HocPhiRoutes = require('./routes/HocPhiRoutes');
const NhapHocRoutes = require('./routes/NhapHocRoutes');

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
app.use('/api/quanlygiaovien_hocsinh', QLHS_GV);
app.use('/api/xetdiemrenluyen', XetDiemRenLuyenRoutes);
app.use('/api/nhapdiemthituyensinh', NhapDiemThiTuyenSinhRoutes);
app.use('/api/phancongchunhiembomon', PhanCongChuNhiemBoMonRoutes);
app.use('/api/quanlylop', QuanLyLopRoutes);
app.use('/api/phanlophocsinh', PhanLopRoutes);
app.use('/api/xembaitap', XemBaiTapRoutes);
app.use('/api/dangkytuyensinh', DangKyTuyenSinhRoutes);
app.use('/api/taotk', taotaikhoanRoutes);
app.use('/api/quanlytruong', QuanLyTruongRoutes);
app.use('/api/quanlymonhoc', quanlymonhocRoutes);
app.use('/api/phanbohocsinhvaotruong', PhanBoHocSinhVaoTruongRoutes)

app.use('/api/xemdiem', XemDiemRoutes)
app.use('/api/xinphep', XinPhepRoutes)
app.use('/api/hocphi', HocPhiRoutes)
app.use('/api/nhaphoc', NhapHocRoutes)



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
