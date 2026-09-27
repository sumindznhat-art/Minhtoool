const express = require('express');
const app = express();

// Render sẽ cấp PORT qua biến môi trường, fallback 3000 khi chạy local
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Cho phép CORS đơn giản (nếu gọi từ web khác)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===== CẤU HÌNH =====
const PHIEN_BAT_DAU   = 7066782;   // phiên bắt đầu
const THOI_GIAN_PHIEN = 60;        // giây / phiên
const LUU_LICH_SU     = 200;       // số phiên lưu tối đa

// ===== STATE =====
let phienHienTai    = PHIEN_BAT_DAU;
let thoiGianBatDau  = Date.now();
const lichSu        = [];          // mới nhất ở đầu
let dangChay        = true;
let timerId         = null;

// ===== HÀM TẠO KẾT QUẢ =====
function taoKetQua(phien) {
  const x1 = Math.floor(Math.random() * 6) + 1;
  const x2 = Math.floor(Math.random() * 6) + 1;
  const x3 = Math.floor(Math.random() * 6) + 1;
  const tong = x1 + x2 + x3;

  let ketQua;
  if (x1 === x2 && x2 === x3) ketQua = 'bão';        // 3 số giống nhau
  else ketQua = tong >= 11 ? 'tài' : 'xỉu';

  return {
    phien,
    xuc_xac: [x1, x2, x3],
    tong,
    ket_qua: ketQua,
    thoi_gian: new Date().toISOString()
  };
}

// ===== VÒNG LẶP TẠO PHIÊN =====
function chayPhien() {
  if (!dangChay) return;

  const ketQua = taoKetQua(phienHienTai);
  lichSu.unshift(ketQua);
  if (lichSu.length > LUU_LICH_SU) lichSu.pop();

  console.log(
    `[Phiên ${ketQua.phien}] ${ketQua.xuc_xac.join('-')} → ${ketQua.ket_qua} (tổng ${ketQua.tong})`
  );

  phienHienTai++;
  thoiGianBatDau = Date.now();
  timerId = setTimeout(chayPhien, THOI_GIAN_PHIEN * 1000);
}

chayPhien();

// ===== ROUTES =====

// Health check (Render dùng để ping giữ server sống)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Tài Xỉu API đang chạy',
    endpoints: [
      'GET  /api/taixiu/phien-hien-tai',
      'GET  /api/taixiu/ket-qua-moi-nhat',
      'GET  /api/taixiu/lich-su?limit=10',
      'GET  /api/taixiu/phien/:so',
      'GET  /api/taixiu/status',
      'POST /api/taixiu/dung',
      'POST /api/taixiu/tiep-tuc'
    ]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Phiên đang chờ
app.get('/api/taixiu/phien-hien-tai', (req, res) => {
  const conLai = THOI_GIAN_PHIEN - Math.floor((Date.now() - thoiGianBatDau) / 1000);
  res.json({
    success: true,
    data: {
      phien: phienHienTai,
      con_lai_giay: conLai > 0 ? conLai : 0,
      thoi_gian_phien: THOI_GIAN_PHIEN
    }
  });
});

// Kết quả mới nhất
app.get('/api/taixiu/ket-qua-moi-nhat', (req, res) => {
  if (lichSu.length === 0) {
    return res.json({ success: true, data: null, message: 'Chưa có phiên nào' });
  }
  res.json({ success: true, data: lichSu[0] });
});

// Lịch sử N phiên
app.get('/api/taixiu/lich-su', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, LUU_LICH_SU);
  res.json({
    success: true,
    total: lichSu.length,
    data: lichSu.slice(0, limit)
  });
});

// Lấy 1 phiên cụ thể
app.get('/api/taixiu/phien/:so', (req, res) => {
  const so = Number(req.params.so);
  const found = lichSu.find(p => p.phien === so);
  if (!found) {
    return res.status(404).json({
      success: false,
      message: `Không tìm thấy phiên ${so} (chỉ lưu ${LUU_LICH_SU} phiên gần nhất)`
    });
  }
  res.json({ success: true, data: found });
});

// Dừng tạo phiên mới
app.post('/api/taixiu/dung', (req, res) => {
  dangChay = false;
  if (timerId) clearTimeout(timerId);
  res.json({ success: true, message: 'Đã dừng tạo phiên mới' });
});

// Tiếp tục
app.post('/api/taixiu/tiep-tuc', (req, res) => {
  if (!dangChay) {
    dangChay = true;
    chayPhien();
  }
  res.json({ success: true, message: 'Đã tiếp tục' });
});

// Trạng thái
app.get('/api/taixiu/status', (req, res) => {
  res.json({
    success: true,
    data: {
      dang_chay: dangChay,
      phien_hien_tai: phienHienTai,
      tong_phien_da_luu: lichSu.length,
      thoi_gian_phien: THOI_GIAN_PHIEN,
      uptime_giay: Math.floor(process.uptime())
    }
  });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server Tài Xỉu chạy trên cổng ${PORT}`);
  console.log(`📌 Phiên bắt đầu: ${PHIEN_BAT_DAU}`);
  console.log(`⏱️  Mỗi phiên: ${THOI_GIAN_PHIEN}s`);
});

// Bắt lỗi không làm crash server
process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));
