const HocPhiModel = require('../models/HocPhiModel');
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const vnpayConfig = require('../config/vnpay');
const momoConfig = require('../config/momo');
const bankConfig = require('../config/bank');
const axios = require('axios');

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

const HocPhiController = {
  renderPage: (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('Unauthorized');
    res.render('pages/hocphi', { user });
  },

  getTuition: async (req, res) => {
    try {
      const { namHoc, hocKy } = req.body;
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      const maHS = user.userId;
      if (!maHS) return res.status(400).json({ success: false, message: 'Không tìm thấy thông tin học sinh' });

      const tuition = await HocPhiModel.getTuition(maHS, namHoc, hocKy);
      res.json({ success: true, tuition });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  payTuition: async (req, res) => {
    try {
      const { namHoc, hocKy, phuongThuc, soTien } = req.body;
      const user = req.session.user;
      if (!user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const maHS = user.userId;

      if (!namHoc || !hocKy) return res.status(400).json({ success: false, message: 'Thiếu thông tin năm học/học kỳ' });
      if (!phuongThuc) return res.status(400).json({ success: false, message: 'Vui lòng chọn phương thức thanh toán' });
      
      if (phuongThuc === 'VNPAY') {
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let tmnCode = vnpayConfig.vnp_TmnCode;
        let secretKey = vnpayConfig.vnp_HashSecret;
        let vnpUrl = vnpayConfig.vnp_Url;
        let returnUrl = vnpayConfig.vnp_ReturnUrl;
        let orderId = moment(date).format('DDHHmmss');
        let amount = soTien;
        let bankCode = '';
        
        let locale = 'vn';
        let currCode = 'VND';
        
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if(bankCode !== null && bankCode !== ''){
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        // Lưu thông tin giao dịch tạm thời vào session hoặc DB nếu cần để đối soát sau này
        // Ở đây ta trả về URL để client redirect
        return res.json({ success: true, paymentUrl: vnpUrl });
      }

      if (phuongThuc === 'MOMO') {
        const partnerCode = momoConfig.partnerCode;
        const accessKey = momoConfig.accessKey;
        const secretKey = momoConfig.secretKey;
        const requestId = partnerCode + new Date().getTime();
        const orderId = requestId;
        const orderInfo = `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`;
        const redirectUrl = momoConfig.returnUrl;
        const ipnUrl = momoConfig.notifyUrl;
        const amount = soTien;
        const requestType = "captureWallet";
        const extraData = ""; 

        const rawSignature = "accessKey="+accessKey+"&amount="+amount+"&extraData="+extraData+"&ipnUrl="+ipnUrl+"&orderId="+orderId+"&orderInfo="+orderInfo+"&partnerCode="+partnerCode+"&redirectUrl="+redirectUrl+"&requestId="+requestId+"&requestType="+requestType;
        
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode : partnerCode,
            accessKey : accessKey,
            requestId : requestId,
            amount : amount,
            orderId : orderId,
            orderInfo : orderInfo,
            redirectUrl : redirectUrl,
            ipnUrl : ipnUrl,
            extraData : extraData,
            requestType : requestType,
            signature : signature,
            lang: 'vi'
        };

        try {
            const result = await axios.post(momoConfig.endpoint, requestBody);
            return res.json({ success: true, paymentUrl: result.data.payUrl });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Lỗi tạo giao dịch MOMO' });
        }
      }

      if (phuongThuc === 'BANK') {
        // Chuyển hướng đến trang hiển thị QR Code
        const paymentUrl = `/api/hocphi/bank-transfer?maHS=${maHS}&namHoc=${namHoc}&hocKy=${hocKy}&soTien=${soTien}`;
        return res.json({ success: true, paymentUrl: paymentUrl });
      }

      // Xử lý các phương thức khác (nếu có)
      await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);
      res.json({ success: true, message: 'Thanh toán thành công!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi thanh toán do lỗi hệ thống' });
    }
  },

  vnpayReturn: async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let tmnCode = vnpayConfig.vnp_TmnCode;
        let secretKey = vnpayConfig.vnp_HashSecret;

        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        if(secureHash === signed){
            const responseCode = vnp_Params['vnp_ResponseCode'];
            if (responseCode === '00') {
                // Thanh toán thành công
                // Parse orderInfo để lấy thông tin cập nhật DB
                // vnp_OrderInfo: `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`
                // Tuy nhiên, cách tốt nhất là lưu orderId vào DB lúc tạo payment url với status pending
                // Ở đây ta sẽ parse chuỗi info (cách đơn giản nhưng không khuyến khích cho production lớn)
                
                const orderInfo = decodeURIComponent(vnp_Params['vnp_OrderInfo']);
                // Regex hoặc split để lấy maHS, namHoc, hocKy
                // Ví dụ: "Thanh toan hoc phi 2024-2025 HK1 - HS: HS001"
                // Cần đảm bảo format string ở payTuition khớp với logic parse ở đây.
                
                // Để đơn giản và an toàn hơn, ta nên truyền các tham số này qua query param của returnUrl hoặc lưu session
                // Nhưng VNPAY returnUrl là cố định.
                
                // Tạm thời ta sẽ giả định thanh toán thành công và hiển thị thông báo.
                // Cần implement logic update DB ở đây.
                // Do HocPhiModel.payTuition cần maHS, namHoc, hocKy.
                
                // Cách giải quyết nhanh: Lưu thông tin vào session trước khi redirect
                // Nhưng session có thể mất.
                
                // Parse lại từ vnp_OrderInfo
                // Format: `Thanh toan hoc phi ${namHoc} ${hocKy} - HS: ${maHS}`
                const parts = vnp_Params['vnp_OrderInfo'].split(' - HS: ');
                const maHS = parts[1];
                const infoParts = parts[0].replace('Thanh toan hoc phi ', '').split(' ');
                const namHoc = infoParts[0];
                const hocKy = infoParts[1];
                const soTien = vnp_Params['vnp_Amount'] / 100;

                await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);

                res.render('pages/payment_success', { code: vnp_Params['vnp_TxnRef'] });
            } else {
                res.render('pages/payment_error', { message: 'Giao dịch không thành công' });
            }
        } else {
            res.render('pages/payment_error', { message: 'Chữ ký không hợp lệ' });
        }
    } catch (err) {
        console.error(err);
        res.render('pages/payment_error', { message: 'Lỗi hệ thống xử lý kết quả thanh toán' });
    }
  },

  momoReturn: async (req, res) => {
    try {
        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = req.query;

        if (resultCode == '0') {
             const parts = orderInfo.split(' - HS: ');
             const maHS = parts[1];
             const infoParts = parts[0].replace('Thanh toan hoc phi ', '').split(' ');
             const namHoc = infoParts[0];
             const hocKy = infoParts[1];
             
             await HocPhiModel.payTuition(maHS, namHoc, hocKy, amount);
             res.render('pages/payment_success', { code: transId });
        } else {
             res.render('pages/payment_error', { message: 'Giao dịch MOMO thất bại: ' + message });
        }
    } catch (err) {
        console.error(err);
        res.render('pages/payment_error', { message: 'Lỗi xử lý kết quả MOMO' });
    }
  },

  renderBankTransfer: (req, res) => {
    const { maHS, namHoc, hocKy, soTien } = req.query;
    
    if (!maHS || !namHoc || !hocKy || !soTien) {
        return res.render('pages/payment_error', { message: 'Thiếu thông tin thanh toán' });
    }

    const bankId = bankConfig.bankId;
    const accountNo = bankConfig.accountNo;
    const template = bankConfig.template;
    const accountName = encodeURIComponent(bankConfig.accountName);
    const content = encodeURIComponent(`HOCPHI ${namHoc} ${hocKy} ${maHS}`);
    
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${soTien}&addInfo=${content}&accountName=${accountName}`;

    res.render('pages/payment_bank', {
        qrUrl,
        amount: soTien,
        content: `HOCPHI ${namHoc} ${hocKy} ${maHS}`,
        bankInfo: {
            bankId,
            accountNo,
            accountName: bankConfig.accountName
        },
        transactionData: {
            maHS, namHoc, hocKy, soTien
        }
    });
  },

  confirmBankTransfer: async (req, res) => {
      try {
          const { maHS, namHoc, hocKy, soTien } = req.body;
          // Trong thực tế, bước này cần admin duyệt hoặc webhook từ ngân hàng
          // Ở đây ta giả lập người dùng xác nhận đã chuyển
          await HocPhiModel.payTuition(maHS, namHoc, hocKy, soTien);
          res.json({ success: true });
      } catch (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Lỗi xác nhận thanh toán' });
      }
  }
};

module.exports = HocPhiController;
