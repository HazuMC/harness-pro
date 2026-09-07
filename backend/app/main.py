import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HARNESS STUDIO",
    description="Backend API & Frontend Host for Storyboard Studio (JSB12 KHKT)",
    version="1.0.0"
)

# Cấu hình CORS cho phép tương tác API từ Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đường dẫn tuyệt đối đến thư mục frontend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "frontend"))

# Mount các thư mục tĩnh (css, js, assets, components) từ frontend
if os.path.exists(os.path.join(FRONTEND_DIR, "css")):
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")

if os.path.exists(os.path.join(FRONTEND_DIR, "js")):
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

if os.path.exists(os.path.join(FRONTEND_DIR, "components")):
    app.mount("/components", StaticFiles(directory=os.path.join(FRONTEND_DIR, "components")), name="components")

if os.path.exists(os.path.join(FRONTEND_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

# Mount thư mục lưu ảnh đã sinh
GENERATED_DIR = os.path.join(FRONTEND_DIR, "generated_images")
os.makedirs(GENERATED_DIR, exist_ok=True)
app.mount("/generated_images", StaticFiles(directory=GENERATED_DIR), name="generated_images")

# ================= ROUTES RENDER TỪNG TAB / TRANG HTML RIÊNG BIỆT =================

# 1. Trang Chủ (index.html)
@app.get("/", response_class=FileResponse)
async def serve_home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# 2. Trang Storyboard Studio (storyboard.html)
@app.get("/storyboard", response_class=FileResponse)
async def serve_storyboard():
    return FileResponse(os.path.join(FRONTEND_DIR, "storyboard.html"))

# 4. Trang Trợ Lý Kịch Bản (chat.html)
@app.get("/chat", response_class=FileResponse)
async def serve_chat():
    return FileResponse(os.path.join(FRONTEND_DIR, "chat.html"))

# 5. Trang Kho Lưu Trữ (gallery.html)
@app.get("/gallery", response_class=FileResponse)
async def serve_gallery():
    return FileResponse(os.path.join(FRONTEND_DIR, "gallery.html"))

# 6. Trang Thông Tin Dự Án (info.html)
@app.get("/info", response_class=FileResponse)
async def serve_info():
    return FileResponse(os.path.join(FRONTEND_DIR, "info.html"))

# Route API kiểm tra trạng thái Backend
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "app": "HARNESS STUDIO",
        "message": "Backend đã kết nối thành công với Frontend!"
    }

from app.routers import story

# Gắn Story Router
app.include_router(story.router)

