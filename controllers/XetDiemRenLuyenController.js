const QLModel = require('../models/XetDiemRenLuyenModel');

class QuanLyHSGVController {
  async renderPage(req, res) {
    try {
      const namHocList = await QLModel.getNamHocList();
      const teacherList = await QLModel.getTeacherList();
      const selectedNamHoc = namHocList[0]?.NamHoc || '';
      const selectedTeacher = teacherList[0]?.MaGiaoVien || '';
      const classes = await QLModel.getClasses(selectedTeacher, selectedNamHoc);
      res.render('pages/xetdiemrenluyen', {
        namHocList,
        teacherList,
        selectedNamHoc,
        selectedTeacher,
        selectedClass: '',
        classes,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  // HỌC SINH
  async getHocSinh(req,res){ 
    try{
      const { namHoc, maGiaoVien, maLop } = req.query;
      // Lấy lớp trước để kiểm tra maLop hợp lệ
      const classes = await QLModel.getClasses(maGiaoVien, namHoc, maLop);
      const lopId = classes.length > 0 && maLop ? maLop : null;
      const data = await QLModel.getStudentList(lopId, namHoc);
      res.json({success:true, data});
    }catch(err){ res.json({success:false,message:err.message}); }
  }

  async getHocSinhById(req,res){
    try{
      const data = await QLModel.getStudentById(req.params.id);
      res.json({success:true,data});
    }catch(err){ res.json({success:false,message:err.message}); }
  }

  async addHocSinh(req,res){
    try{
      const { MaHS, TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc } = req.body;
      const birthdayFormatted = Birthday ? Birthday.split('T')[0] : null;
      await QLModel.addStudent({ MaHocSinh:MaHS, TenHocSinh, Birthday:birthdayFormatted, GioiTinh, MaLop, TrangThai:TrangThai||'Đang học', KhoaHoc });
      res.json({success:true,message:'Thêm học sinh thành công'});
    }catch(err){ console.error(err); res.status(500).json({success:false,message:'Lỗi thêm học sinh'}); }
  }

  async updateHocSinh(req,res){
    try{
      const id = req.params.id;
      const { TenHocSinh, Birthday, GioiTinh, MaLop, TrangThai, KhoaHoc } = req.body;
      const birthdayFormatted = Birthday ? Birthday.split('T')[0] : null;
      await QLModel.updateStudent(id,{TenHocSinh,Birthday:birthdayFormatted,GioiTinh,MaLop,TrangThai,KhoaHoc});
      res.json({success:true,message:'Cập nhật học sinh thành công'});
    }catch(err){ console.error(err); res.status(500).json({success:false,message:'Lỗi cập nhật học sinh'}); }
  }

  async deleteHocSinh(req,res){
    try{ await QLModel.deleteStudent(req.params.id); res.json({success:true}); }
    catch(err){ res.json({success:false,message:err.message}); }
  }

  // DROPDOWN / FILTER
  async getNamHoc(req,res){
    try{ const data = await QLModel.getNamHocList(); res.json({success:true,data}); }
    catch(err){ res.json({success:false,message:err.message}); }
  }

  async getTeachers(req,res){
    try{ const { namHoc } = req.query; const data = await QLModel.getTeacherList(namHoc); res.json({success:true,data}); }
    catch(err){ res.json({success:false,message:err.message}); }
  }

  async getClassesByTeacher(req,res){
    try{
      const { maGiaoVien, namHoc, maLop } = req.query;
      const data = await QLModel.getClasses(maGiaoVien, namHoc, maLop);
      res.json({success:true,data});
    }catch(err){ res.json({success:false,message:err.message}); }
  }

  async getTruong(req,res){
    try{ const data = await QLModel.getTruongList(); res.json({success:true,data}); }
    catch(err){ res.json({success:false,message:err.message}); }
  }
  // Lấy HK/RL
async getHocBa(req,res){
  try{
    const { maHS, namHoc, hocKy } = req.query;
    const data = await QLModel.getHocBa(maHS, namHoc, hocKy);
    res.json({success:true,data});
  }catch(err){ res.json({success:false,message:err.message}); }
}

// Lưu HK/RL
async updateHocBa(req,res){
  try{
    const { maHS, namHoc, hocKy, HanhKiem, RenLuyen } = req.body;
    await QLModel.updateHocBa(maHS, namHoc, hocKy, { HanhKiem, RenLuyen });
    res.json({success:true,message:'Cập nhật thành công'});
  }catch(err){ res.json({success:false,message:err.message}); }
}

}

module.exports = new QuanLyHSGVController();
