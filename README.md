# 🎲 Tài Xỉu API

API mô phỏng game Tài Xỉu chạy phiên liên tục, trả về JSON.

## Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách endpoint |
| GET | `/health` | Health check |
| GET | `/api/taixiu/phien-hien-tai` | Phiên đang chờ |
| GET | `/api/taixiu/ket-qua-moi-nhat` | Kết quả mới nhất |
| GET | `/api/taixiu/lich-su?limit=10` | Lịch sử N phiên |
| GET | `/api/taixiu/phien/:so` | Kết quả 1 phiên |
| GET | `/api/taixiu/status` | Trạng thái server |
| POST | `/api/taixiu/dung` | Dừng tạo phiên |
| POST | `/api/taixiu/tiep-tuc` | Tiếp tục |

## Chạy local

```bash
npm install
npm start
