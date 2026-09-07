from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# ================= MODEL 1: DIRECTOR AGENT SCHEMAS =================
class StoryRequest(BaseModel):
    story: str = Field(..., description="Ý tưởng / Prompt của người dùng", min_length=3)
    story_type: Optional[str] = Field("short", description="'short' (Truyện ngắn) hoặc 'long' (Truyện dài)")
    style: Optional[str] = Field("Cinematic", description="Phong cách hình ảnh")
    duration: Optional[str] = Field(None, description="Thời lượng dự kiến")
    language: Optional[str] = Field("vi", description="Ngôn ngữ kịch bản")

class Scene(BaseModel):
    scene_number: int = Field(..., description="Số thứ tự cảnh")
    title: Optional[str] = Field(None, description="Tên / Tiêu đề gợi cảm xúc cho phân cảnh")
    description: str = Field(..., description="Nội dung diễn biến của cảnh")
    visual_prompt: str = Field(..., description="Mô tả hình ảnh cho AI vẽ tranh")

class DirectorStoryOutput(BaseModel):
    title: str = Field(..., description="Tiêu đề câu chuyện")
    story_type: str = Field(..., description="Thể loại: Truyện ngắn hoặc Truyện dài")
    scenes: List[Scene] = Field(default_factory=list, description="Danh sách các phân cảnh tổng quan")

class StoryResponse(BaseModel):
    success: bool = True
    message: str = "Tạo kịch bản thành công"
    data: Optional[DirectorStoryOutput] = None


# ================= MODEL 2: SCENE BREAKDOWN SCHEMAS =================
class StoryboardFrame(BaseModel):
    frame_number: int = Field(..., description="Số thứ tự khung hình trong toàn bộ storyboard")
    scene_number: int = Field(..., description="Thuộc phân cảnh số mấy")
    scene_title: Optional[str] = Field(None, description="Tiêu đề phân cảnh")
    shot_type: str = Field("Wide Shot", description="Loại cỡ cảnh: Wide Shot, Medium Shot, Close-up, Extreme Close-up, Over-the-shoulder, etc.")
    camera_angle: str = Field("Eye-level", description="Góc máy: Eye-level, Low-angle, High-angle, Dutch angle, Bird's eye")
    camera_movement: str = Field("Static", description="Chuyển động máy quay: Static, Pan, Tilt, Dolly, Zoom, Tracking")
    action_description: str = Field(..., description="Chi tiết hành động, biểu cảm nhân vật trong khung hình này")
    visual_prompt: str = Field(..., description="Prompt mô tả chi tiết bằng tiếng Anh tối ưu cho AI vẽ tranh")
    continuity_notes: Optional[str] = Field(None, description="Đặc điểm kế thừa từ khung hình trước để giữ tính nhất quán (trang phục, bối cảnh, ánh sáng)")
    image_url: Optional[str] = Field(None, description="URL hoặc base64 của hình ảnh sau khi Model 3 tạo xong")

class SceneBreakdownRequest(BaseModel):
    story_plan: DirectorStoryOutput = Field(..., description="Kịch bản phân cảnh từ Model Đạo Diễn")
    style: Optional[str] = Field("Cinematic", description="Phong cách hình ảnh nghệ thuật")
    shots_per_scene: Optional[int] = Field(2, description="Số khung hình chi tiết cho mỗi phân cảnh (thường 2-3 shots)")

class SceneBreakdownOutput(BaseModel):
    title: str = Field(..., description="Tiêu đề kịch bản")
    story_type: str = Field(..., description="Thể loại kịch bản")
    total_frames: int = Field(..., description="Tổng số khung hình")
    frames: List[StoryboardFrame] = Field(default_factory=list, description="Danh sách các khung hình chi tiết")

class SceneBreakdownResponse(BaseModel):
    success: bool = True
    message: str = "Chia nhỏ phân cảnh thành công"
    data: Optional[SceneBreakdownOutput] = None


# ================= MODEL 3: IMAGE GENERATION SCHEMAS =================
class GenerateImageRequest(BaseModel):
    frame_number: int = Field(1, description="Số thứ tự khung hình đang vẽ")
    visual_prompt: str = Field(..., description="Mô tả hình ảnh AI cần vẽ")
    style: Optional[str] = Field("Cinematic", description="Phong cách nghệ thuật")
    continuity_notes: Optional[str] = Field(None, description="Đặc tính nhất quán từ khung hình trước")
    previous_image_url: Optional[str] = Field(None, description="Ảnh hoặc ngữ cảnh từ khung hình trước đó")

class GenerateImageResponse(BaseModel):
    success: bool = True
    frame_number: int
    image_url: str = Field(..., description="Đường dẫn hoặc Data URI ảnh sinh ra")
    model_used: str = Field("Storyboard Pro Engine", description="Engine xử lý tạo ảnh")
    message: Optional[str] = "Tạo ảnh khung hình thành công"

class BatchStoryboardImageRequest(BaseModel):
    frames: List[StoryboardFrame] = Field(..., description="Danh sách các khung hình từ Model 2")
    style: Optional[str] = Field("Cinematic", description="Phong cách nghệ thuật")

class BatchStoryboardImageResponse(BaseModel):
    success: bool = True
    message: str = "Tạo toàn bộ ảnh Storyboard thành công"
    frames: List[StoryboardFrame] = Field(default_factory=list)


# ================= FULL AGENTIC PIPELINE SCHEMAS =================
class FullPipelineRequest(BaseModel):
    story: str = Field(..., description="Ý tưởng câu chuyện", min_length=3)
    story_type: Optional[str] = Field("short", description="'short' hoặc 'long'")
    style: Optional[str] = Field("Cinematic", description="Phong cách hình ảnh")
    generate_images: bool = Field(True, description="Có tự động tạo ảnh cho từng khung hình hay không")

class FullPipelineResponse(BaseModel):
    success: bool = True
    message: str = "Hoàn thành toàn bộ quy trình Storyboard AI Agentic"
    director_output: Optional[DirectorStoryOutput] = None
    breakdown_output: Optional[SceneBreakdownOutput] = None
    frames: List[StoryboardFrame] = Field(default_factory=list)
