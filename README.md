# AI TRADING OS — Hệ Điều Hành Nhật Ký Giao Dịch & Cố Vấn Định Lượng AI Dành Cho Trader Chuyên Nghiệp

**AI TRADING OS** là nền tảng quản trị giao dịch thông minh và nhật ký định lượng chuẩn tổ chức, được thiết kế chuyên sâu dành cho nhà giao dịch Forex, Vàng (XAUUSD), Crypto và Đa tài sản. Hệ thống cung cấp một **chu trình trí tuệ giao dịch khép kín (Closed-Loop Lifecycle)** từ chuẩn bị, thực thi đến tối ưu hóa:

```text
ĐẶT MỤC TIÊU → LẬP KẾ HOẠCH GIAO DỊCH → LỊCH TRÌNH HÀNG NGÀY → CHUẨN BỊ THỊ TRƯỜNG → 
VÀO LỆNH → TỰ ĐỘNG ĐỒNG BỘ MT5 → VIẾT NHẬT KÝ LỆNH → THEO DÕI TÂM LÝ & KỶ LUẬT → 
AI PHÂN TÍCH CHUYÊN SÂU → BÁO CÁO HIỆU SUẤT → ĐÁNH GIÁ TUẦN/THÁNG → 
TỐI ƯU HÓA CHIẾN LƯỢC → BẮT ĐẦU CHU KỲ MỚI
```

---

## Các Phân Hệ Chức Năng Lõi

### 1. Bảng Điều Khiển Tổng Quan & Đồng Hồ Phiên Giao Dịch
- Theo dõi thời gian thực 4 phiên giao dịch tài chính lớn: **Sydney, Tokyo, London, New York** kèm đồng hồ đếm ngược các khung giờ giao thoa phiên (Session Overlaps).
- Lưới chỉ số KPI tài chính thực tế: **Số dư (Balance), Vốn khả dụng (Equity), Tỷ lệ Thắng (Win Rate), Hệ số Lợi nhuận (Profit Factor), Kỳ vọng Toán học (Expectancy), Mức Sụt giảm Tối đa (Max Drawdown)**.
- Biểu đồ tăng trưởng tài khoản (Equity Curve) tương tác mượt mà.

### 2. Biểu Đồ Thị Trường Canvas & Động Cơ Nạp Pine Script Tùy Biến
- Biểu đồ nến tương tác **Canvas siêu tốc (Lightweight Charts)** kết hợp cùng chế độ **TradingView Advanced Widget**.
- **Pine Script & Custom Indicator Studio**:
  - Hỗ trợ viết hoặc dán trực tiếp mã **Pine Script v5 / v6** từ TradingView lên Canvas.
  - Tự đặt tên chỉ báo, tạo khung mã trắng, hỗ trợ các chỉ báo toán học cốt lõi: EMA Ribbon, SMA, VWAP, ATR, MACD, DMI / ADX, SuperTrend, Swing Dots, Vùng Cân bằng 50% EQ.
  - Tự động vẽ các mốc giá ngang Chốt lời (TP) / Cắt lỗ (SL), các điểm mũi tên tín hiệu MUA / BÁN (BUY / SELL) và Bảng Đo lực Nến (HUD Scoreboard Table) ngay trên biểu đồ.

### 3. Bộ Lập Kế Hoạch Giao Dịch & Động Cơ Tính Toán Khả Thi (Realism Engine)
- Đánh giá tính khả thi toán học của mục tiêu tài chính: Tỷ lệ Lợi nhuận yêu cầu theo Tuần/Tháng, Xác suất Cháy tài khoản (**Risk of Ruin %**), và Chuỗi Thua lỗ Liên tiếp Dự kiến (**Expected Consecutive Losing Streaks**).
- Tự động chia nhỏ mục tiêu từ **Năm → Quý → Tháng → Tuần**.

### 4. Không Gian Làm Việc & Ma Trận Lịch Giao Dịch Hàng Ngày
- Ma trận lịch trực quan theo Tháng, Tuần và Ngày.
- Quản lý mục tiêu phiên, danh sách nhiệm vụ thực thi (Checklist), liên kết lệnh giao dịch, ghi chú bối cảnh xu hướng thị trường (Market Bias & Volatility) và bản tổng kết ngày tự động bằng AI.

### 5. Nhật Ký Giao Dịch Chi Tiết
- Ghi chép kế hoạch trước phiên trên nhiều khung thời gian, xác định các vùng Hỗ trợ/Kháng cự then chốt, điều kiện vi phạm kế hoạch (Invalidation Rules) và đúc kết kinh nghiệm sau phiên giao dịch kèm ảnh chụp biểu đồ.

### 6. Nhật Ký Tâm Lý & Quản Trị Kỷ Luật
- Thang đo cảm xúc chuyên sâu từ 1 đến 10: **FOMO, Tham lam, Sợ hãi, Căng thẳng, Tự tin, Trả thù thị trường**.
- Hệ thống chấm điểm **Kỷ luật Thực tế (0 - 100)** và phân tích ma trận tương quan giữa tâm lý với tỷ lệ thắng của tài khoản.

### 7. Quản Lý Rủi Ro & Máy Tính Khối Lượng Lệnh (Position Sizer)
- Tính toán kích thước vị thế (Lot Size) chuẩn xác theo tỷ lệ % rủi ro hoặc số tiền cố định cho Forex, Vàng và CFD.
- Hệ thống Giám sát Rủi ro Ngày (**Daily Risk Guard**) với cơ chế cảnh báo vượt ngưỡng và tự ngắt giao dịch khi chạm mức lỗ tối đa cho phép.

### 8. Cổng Kết Nối & Tự Động Đồng Bộ MetaTrader 5 (MT5)
- Cổng API đồng bộ lịch sử giao dịch tự động từ phần mềm MT5.
- Cơ chế kiểm tra đối soát chống trùng lặp vé lệnh (Anti-Duplicate Ticket Ingestion).

### 9. Trợ Lý AI Phân Tích & Cố Vấn Chiến Lược (AI Copilot)
- **AI Trade Copilot**: Trợ lý giao dịch tương tác trực tiếp, đưa ra góc nhìn khách quan dựa trên dữ liệu thực tế đã được xác thực (loại bỏ hoàn toàn hiện tượng AI bịa số liệu).
- Tự động tạo bản tin nhận định đầu ngày (**Daily Briefing**), khám xét từng lệnh giao dịch (**Trade Audit**) và báo cáo tổng kết tuần/tháng (**Executive Performance Review**).

### 10. Báo Cáo Chuẩn Tổ Chức & Xuất Bản Dữ Liệu
- Xuất dữ liệu giao dịch tức thì sang định dạng **CSV**, bản sao lưu toàn diện **JSON**, hoặc in xuất bản báo cáo hiệu suất **PDF** tiêu chuẩn chuyên nghiệp.

---

## Công Nghệ Sử Dụng

- **Frontend & Ứng dụng**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Recharts, Lightweight Charts.
- **Biểu Mẫu & Xác Thực Dữ Liệu**: React Hook Form, Zod Validation.
- **Cơ Sở Dữ Liệu & Lưu Trữ**: Firebase Firestore (cấu trúc subcollection phân cấp và composite index) và Firebase Storage.
- **Xác Thực Người Dùng**: Firebase Authentication (Google Sign-In & Email/Mật khẩu).
- **Hạ Tầng Toán Học**: Động cơ tính toán tài chính thuần TypeScript (P&L, Position Sizing, Drawdown, Expectancy, Risk of Ruin, Discipline Score).
- **Kiểm Thử**: Vitest Test Suite.

---

## Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cài Đặt Mã Nguồn & Thư Viện

```bash
git clone <repository-url>
cd platfromTrading
npm install
```

### 2. Cấu Hình Biến Môi Trường (.env)

Sao chép file `.env.example` thành `.env.local` và điền các thông tin cấu hình tương ứng:

```bash
cp .env.example .env.local
```

Nội dung cấu hình mẫu trong `.env.local`:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Phía Server)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Cổng AI Thông Minh (Tương thích OpenAI / Gemini API)
AI_API_KEY=your_ai_api_key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### 3. Chạy Server Phát Triển (Development Mode)

```bash
npm run dev
```

Truy cập ứng dụng tại địa chỉ: [http://localhost:3000](http://localhost:3000)

### 4. Chạy Bộ Kiểm Thử (Unit Tests)

```bash
npm run test
```

### 5. Biên Dịch Dự Án (Production Build)

```bash
npm run build
```

---

## Phím Tắt Tiện Ích

- `Ctrl + K` / `Cmd + K`: Mở thanh điều hướng tìm kiếm nhanh toàn hệ thống (Command Palette).
- `Ctrl + J` / `Cmd + J`: Bật/Tắt nhanh bảng trợ lý AI Trading Copilot.
- `Escape`: Đóng nhanh các cửa sổ Modal, Drawer và Trình soạn thảo script.
