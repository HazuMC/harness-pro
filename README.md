# 🎬 HARNESS PRO - AI-Powered Career Guidance & Commercial Storyboard Platform

> Dự án tham gia cuộc thi KHKT khóa JSB12. Nền tảng ứng dụng Multi-Agent AI (FastAPI + LangGraph) định hướng nghề nghiệp và kiến tạo kịch bản, phân cảnh hình ảnh thương mại (TVC & Commercial Storyboard) với ngôn ngữ thiết kế tối giản Apple Dark Mode.

---

## 🌟 Tính Năng Nổi Bật

1. **Định Hướng Nghề Nghiệp Sáng Tạo (Career Guidance):**
   - Lộ trình nghề nghiệp: Biên Kịch TVC, Đạo Diễn Hình Ảnh (DoP), Storyboard Artist, TikTok Marketer.
   - Trợ lý AI tư vấn kịch bản và phân tích kỹ năng trực tiếp.

2. **Studio Phân Cảnh Thương Mại (Commercial Storyboard Studio):**
   - Khởi tạo kịch bản phân cảnh chi tiết (Cỡ cảnh, Góc máy, Chuyển động, Lời thoại, Mô tả ánh sáng).
   - Tích hợp mô hình AI kết xuất hình ảnh phân cảnh chuẩn Pro Display.

3. **Giao Diện Chuẩn Apple.com (Apple Minimalist Design):**
   - Gam màu Obsidian Black (`#000000`), hệ thống thẻ Bento Box (`#161617`), kính mờ Frosted Glass (`backdrop-blur-xl`).
   - Tương tác mượt mà, tối ưu hóa trải nghiệm trên mọi thiết bị.

4. **Kiến Trúc Multi-Agent Hiện Đại:**
   - **Director Agent:** Phân tích ý tưởng, điều phối kịch bản và thông điệp thương hiệu.
   - **Scene Agent:** Bóc tách kịch bản thành từng cảnh quay chi tiết với thông số điện ảnh.
   - **Image Agent:** Tạo prompt điện ảnh và kết xuất hình ảnh phân cảnh.

---

## 📁 Cấu Trúc Thư Mục

```
JSB12 PROJECT/
├── backend/
│   ├── app/
│   │   ├── agents/          # Multi-Agent LangGraph (Director, Scene, Image)
│   │   ├── models/          # Schemas Pydantic
│   │   ├── routers/         # API Routers (story, history, auth)
│   │   ├── services/        # Dịch vụ lưu trữ và tiện ích
│   │   ├── config.py        # Cấu hình môi trường bảo mật
│   │   ├── database.py      # Cơ sở dữ liệu SQLite / Async
│   │   └── main.py          # FastAPI Application Entrypoint
│   ├── .env.example         # Mẫu biến môi trường
│   └── requirements.txt     # Danh sách thư viện Python
├── frontend/
│   ├── components/          # Header toàn cục tái sử dụng
│   ├── css/                 # Apple Design System & Bento Styling
│   ├── js/                  # Logic xử lý API, Storyboard & Chat
│   ├── generated_images/    # Thư mục chứa hình ảnh phân cảnh đã tạo
│   ├── index.html           # Trang chủ giới thiệu & Báo giá
│   ├── storyboard.html      # Không gian làm việc Storyboard Studio
│   ├── chat.html            # Trợ lý định hướng kịch bản AI
│   ├── gallery.html         # Kho Portfolio cộng đồng
│   └── info.html            # Bạch thư hệ thống & Thông số kỹ thuật
├── .gitignore               # Bộ lọc bỏ qua tệp nhạy cảm và cache
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn bị môi trường Backend
```powershell
# Chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt
```

### 2. Cấu hình biến môi trường
Sao chép tệp mẫu và cập nhật API Key của bạn:
```powershell
cp .env.example .env
```
Điền các khóa API vào tệp `.env`:
- `DEEPSEEK_API_KEY`: API key của DeepSeek
- `OPENROUTER_API_KEY`: API key của OpenRouter (Qwen Image Pro)

### 3. Khởi chạy máy chủ FastAPI
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Sau khi khởi chạy, truy cập vào trình duyệt:
- 🌐 **Trang chủ:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 🎬 **Storyboard Studio:** [http://127.0.0.1:8000/storyboard](http://127.0.0.1:8000/storyboard)
- 💬 **Trợ Lý AI:** [http://127.0.0.1:8000/chat](http://127.0.0.1:8000/chat)
- 📑 **API Documentation (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend:** Python 3.10+, FastAPI, LangGraph, Pydantic, Uvicorn, SQLite.
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Apple Dark Design System), Modern ES6 JavaScript.
- **AI Models:** DeepSeek V4 (Director / Scene), Qwen Image Pro (Visual Storyboard).

---

## 👤 Tác Giả & Bản Quyền
- Tác giả: **bigblyatcccp** / **HazuMC**
- GitHub: [https://github.com/HazuMC/harness-pro](https://github.com/HazuMC/harness-pro)
- Bản quyền thuộc về dự án nghiên cứu KHKT khóa JSB12.
