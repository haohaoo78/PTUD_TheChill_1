const HocPhiModel = require('../models/HocPhiModel');
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const vnpayConfig = require('../config/vnpay');
const momoConfig = require('../config/momo');
const bankConfig = require('../config/bank');
const axios = require('axios');

// =========================
// 🔧 SORT OBJECT (VNPAY)
// =========================
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });
  return sorted;
}

// =========================
// 🎓 HỌC PHÍ CONTROLLER
// =========================
const HocPhiController = {

  // =========================
  // 📄 TRANG HỌC PHÍ
  // =========================
  renderPage: (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('Unauthorized');
    res.render('pages/hocphi', { user });
  },

  // =========================
  // 📥 LẤY HỌC PHÍ
  // =========================
  getTuition: async (req, res) => {
    try {
      const { namHoc, hocKy } = req.body;
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false });

      let maHS = null;
      if (user.loaiTaiKhoan === 'Phụ huynh') maHS = user.maHocSinh;
      else if (user.loaiTaiKhoan === 'Học sinh') maHS = user.entityId;

      if (!maHS)
        return res.json({ success: false, message: 'Không xác định được học sinh' });

      const tuition = await HocPhiModel.getTuition(maHS, namHoc, hocKy);
      res.json({ success: true, tuition });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // =========================
  // 💳 THANH TOÁN
  // =========================
  payTuition: async (req, res) => {
    try {
      const { namHoc, hocKy, phuongThuc, soTien } = req.body;
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false });

      let maHS = null;
      if (user.loaiTaiKhoan === 'Phụ huynh') maHS = user.maHocSinh;
      else if (user.loaiTaiKhoan === 'Học sinh') maHS = user.entityId;

      if (!maHS)
        return res.json({ success: false, message: 'Không xác định được học sinh' });

      if (!namHoc || !hocKy || !phuongThuc)
        return res.json({ success: false, message: 'Thiếu dữ liệu thanh toán' });

      // ---------- VNPAY ----------
      if (phuongThuc === 'VNPAY') {
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = moment(date).format('DDHHmmss');
        const ipAddr =
          req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress;

        let vnp_Params = {
          vnp_Version: '2.1.0',
          vnp_Command: 'pay',
          vnp_TmnCode: vnpayConfig.vnp_TmnCode,
          vnp_Locale: 'vn',
          vnp_CurrCode: 'VND',
          vnp_TxnRef: orderId,
          vnp_OrderInfo: `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`,
          vnp_OrderType: 'other',
          vnp_Amount: soTien * 100,
          vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
          vnp_IpAddr: ipAddr,
          vnp_CreateDate: createDate
        };

        vnp_Params = sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        vnp_Params.vnp_SecureHash = hmac.update(signData).digest('hex');

        const paymentUrl =
          vnpayConfig.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });

        return res.json({ success: true, paymentUrl });
      }

      // ---------- MOMO ----------
      if (phuongThuc === 'MOMO') {
        const requestId = momoConfig.partnerCode + Date.now();
        const orderInfo = `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`;
        const rawSignature =
          `accessKey=${momoConfig.accessKey}&amount=${soTien}&extraData=&ipnUrl=${momoConfig.notifyUrl}` +
          `&orderId=${requestId}&orderInfo=${orderInfo}` +
          `&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.returnUrl}` +
          `&requestId=${requestId}&requestType=captureWallet`;

        const signature = crypto
          .createHmac('sha256', momoConfig.secretKey)
          .update(rawSignature)
          .digest('hex');

        const result = await axios.post(momoConfig.endpoint, {
          partnerCode: momoConfig.partnerCode,
          accessKey: momoConfig.accessKey,
          requestId,
          amount: soTien,
          orderId: requestId,
          orderInfo,
          redirectUrl: momoConfig.returnUrl,
          ipnUrl: momoConfig.notifyUrl,
          extraData: '',
          requestType: 'captureWallet',
          signature
        });

        return res.json({ success: true, paymentUrl: result.data.payUrl });
      }

      // ---------- BANK ----------
      if (phuongThuc === 'BANK') {
        return res.json({
          success: true,
          paymentUrl: `/api/hocphi/bank-transfer?maHS=${maHS}&namHoc=${namHoc}&hocKy=${hocKy}&soTien=${soTien}`
        });
      }

      // ---------- PAY OFFLINE ----------
      await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);
      res.json({ success: true });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi thanh toán' });
    }
  },

  // =========================
  // 🔁 CALLBACK VNPAY
  // =========================
  vnpayReturn: async (req, res) => {
    try {
      let vnp_Params = req.query;
      const secureHash = vnp_Params.vnp_SecureHash;

      delete vnp_Params.vnp_SecureHash;
      delete vnp_Params.vnp_SecureHashType;

      vnp_Params = sortObject(vnp_Params);
      const signData = qs.stringify(vnp_Params, { encode: false });
      const signed = crypto
        .createHmac('sha512', vnpayConfig.vnp_HashSecret)
        .update(signData)
        .digest('hex');

      if (secureHash !== signed)
        return res.render('pages/payment_error', { message: 'Chữ ký không hợp lệ' });

      if (vnp_Params.vnp_ResponseCode !== '00')
        return res.render('pages/payment_error', { message: 'Thanh toán thất bại' });

      const parts = vnp_Params.vnp_OrderInfo.split(' - HS: ');
      const maHS = parts[1];
      const info = parts[0].replace('Thanh toan hoc phi ', '').split(' ');
      const namHoc = info[0];
      const hocKy = info[1];
      const soTien = vnp_Params.vnp_Amount / 100;

      await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);
      res.render('pages/payment_success');

    } catch (err) {
      console.error(err);
      res.render('pages/payment_error', { message: 'Lỗi xử lý VNPAY' });
    }
  },

  // =========================
  // 🔁 CALLBACK MOMO
  // =========================
  momoReturn: async (req, res) => {
    try {
      if (req.query.resultCode !== '0')
        return res.render('pages/payment_error', { message: 'MOMO thất bại' });

      const parts = req.query.orderInfo.split(' - HS: ');
      const maHS = parts[1];
      const info = parts[0].replace('Thanh toan hoc phi ', '').split(' ');
      const namHoc = info[0];
      const hocKy = info[1];

      await HocPhiModel.payTuition(maHS, namHoc, hocKy, req.query.amount);
      res.render('pages/payment_success');

    } catch (err) {
      console.error(err);
      res.render('pages/payment_error', { message: 'Lỗi xử lý MOMO' });
    }
  },

  // =========================
  // 🏦 BANK TRANSFER
  // =========================
  renderBankTransfer: (req, res) => {
    const { maHS, namHoc, hocKy, soTien } = req.query;

    if (!maHS || !namHoc || !hocKy || !soTien) {
      return res.render('pages/payment_error', { message: 'Thiếu thông tin thanh toán' });
    }

    const bankInfo = {
      bankId: bankConfig.bankId,
      accountNo: bankConfig.accountNo,
      accountName: bankConfig.accountName
    };

    const content = encodeURIComponent(`HOCPHI ${namHoc} ${hocKy} ${maHS}`);
    const accountName = encodeURIComponent(bankInfo.accountName);

    const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-${bankConfig.template}.png?amount=${soTien}&addInfo=${content}&accountName=${accountName}`;

    res.render('pages/payment_bank', {
      qrUrl,
      amount: soTien,
      content: `HOCPHI ${namHoc} ${hocKy} ${maHS}`,
      bankInfo,
      transactionData: { maHS, namHoc, hocKy, soTien }
    });
  },

  // =========================
  // ✅ XÁC NHẬN BANK TRANSFER
  // =========================
  confirmBankTransfer: async (req, res) => {
    try {
      const { maHS, namHoc, hocKy, soTien } = req.body;
      await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi xác nhận thanh toán' });
    }
  }
};

module.exports = HocPhiController;
