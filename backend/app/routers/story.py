import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    StoryRequest,
    StoryResponse,
    DirectorStoryOutput,
    SceneBreakdownRequest,
    SceneBreakdownResponse,
    SceneBreakdownOutput,
    GenerateImageRequest,
    GenerateImageResponse,
    BatchStoryboardImageRequest,
    BatchStoryboardImageResponse,
    FullPipelineRequest,
    FullPipelineResponse,
    StoryboardFrame
)
from app.agents.director_agent import director_agent
from app.agents.scene_agent import scene_agent
from app.agents.image_agent import image_agent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Multi-Agent Storyboard System"])

# ================= 1. MODEL 1: ĐẠO DIỄN (DIRECTOR AGENT) =================
@router.post("/makestory", response_model=StoryResponse)
@router.post("/api/makestory", response_model=StoryResponse)
async def make_story(request: StoryRequest):
    """
    Model 1: Tiếp nhận ý tưởng người dùng, tạo kịch bản phân cảnh tổng quan.
    """
    try:
        if not request.story or len(request.story.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ý tưởng câu chuyện không được để trống và phải có ít nhất 3 ký tự."
            )

        logger.info(f"Model 1 (Đạo Diễn): '{request.story[:50]}...' | Thể loại: {request.story_type} | Phong cách: {request.style}")
        
        story_plan: DirectorStoryOutput = await director_agent.generate_story_plan(request)
        
        return StoryResponse(
            success=True,
            message=f"Đạo diễn AI đã tạo kịch bản {story_plan.story_type} thành công với {len(story_plan.scenes)} phân cảnh!",
            data=story_plan
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi xử lý Model 1: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi Model Đạo Diễn: {str(e)}"
        )


# ================= 2. MODEL 2: CHIA NHỎ PHÂN CẢNH (DEEPSEEK SCENE AGENT) =================
@router.post("/api/breakdown-scenes", response_model=SceneBreakdownResponse)
async def breakdown_scenes(request: SceneBreakdownRequest):
    """
    Model 2: Nhận kịch bản từ Model Đạo Diễn -> Chia nhỏ từng phân cảnh thành các Shot/Frame chi tiết (DeepSeek).
    """
    try:
        logger.info(f"Model 2 (Bóc tách phân cảnh DeepSeek): '{request.story_plan.title}' với {len(request.story_plan.scenes)} cảnh")
        
        breakdown_output: SceneBreakdownOutput = await scene_agent.breakdown_scenes(request)
        
        return SceneBreakdownResponse(
            success=True,
            message=f"Đã bóc tách thành công {breakdown_output.total_frames} khung hình chi tiết!",
            data=breakdown_output
        )
    except Exception as e:
        logger.error(f"Lỗi khi xử lý bóc tách phân cảnh: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi Hệ thống Chia Nhỏ Phân Cảnh: {str(e)}"
        )


# ================= 3. MODEL 3: TẠO ẢNH STORYBOARD (QWEN 3 PRO / OPENROUTER) =================
@router.post("/api/generate-frame-image", response_model=GenerateImageResponse)
async def generate_single_frame_image(request: GenerateImageRequest):
    """
    Model 3: Tạo ảnh riêng cho một khung hình, kế thừa ngữ cảnh khung trước.
    """
    try:
        res = await image_agent.generate_single_frame(request)
        return res
    except Exception as e:
        logger.error(f"Lỗi khi tạo ảnh khung #{request.frame_number}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi Model Tạo Ảnh Storyboard: {str(e)}"
        )


@router.post("/api/generate-storyboard-images", response_model=BatchStoryboardImageResponse)
async def generate_storyboard_images(request: BatchStoryboardImageRequest):
    """
    Model 3: Tạo ảnh tuần tự cho toàn bộ danh sách khung hình (kết quả ảnh khung trước nối tiếp khung sau).
    """
    try:
        logger.info(f"Model 3 (Tạo ảnh Storyboard tuần tự): {len(request.frames)} khung hình")
        res = await image_agent.generate_sequential_storyboard(request)
        return res
    except Exception as e:
        logger.error(f"Lỗi khi tạo ảnh Storyboard tuần tự: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo chuỗi ảnh Storyboard: {str(e)}"
        )


# ================= 4. FULL PIPELINE: TOÀN BỘ CHU TRÌNH 3 MODEL =================
@router.post("/api/pipeline/full", response_model=FullPipelineResponse)
async def run_full_pipeline(request: FullPipelineRequest):
    """
    Chạy tự động toàn bộ 3 Model Agentic:
    1. Model 1 (Đạo Diễn) -> Kịch bản phân cảnh
    2. Model 2 (DeepSeek) -> Bóc tách chi tiết từng khung hình
    3. Model 3 (Qwen 3 Pro OpenRouter) -> Sinh ảnh tuần tự giữ vững tính nhất quán
    """
    try:
        # Bước 1: Model 1
        story_req = StoryRequest(
            story=request.story,
            story_type=request.story_type,
            style=request.style
        )
        director_out = await director_agent.generate_story_plan(story_req)
        
        # Bước 2: Model 2
        breakdown_req = SceneBreakdownRequest(
            story_plan=director_out,
            style=request.style
        )
        breakdown_out = await scene_agent.breakdown_scenes(breakdown_req)
        
        # Bước 3: Model 3 (Tùy chọn tạo ảnh)
        final_frames: list[StoryboardFrame] = breakdown_out.frames
        if request.generate_images and len(final_frames) > 0:
            batch_req = BatchStoryboardImageRequest(
                frames=final_frames,
                style=request.style
            )
            img_res = await image_agent.generate_sequential_storyboard(batch_req)
            final_frames = img_res.frames
            
        return FullPipelineResponse(
            success=True,
            message="Đã hoàn thành toàn bộ chu trình Storyboard AI Agentic 3 giai đoạn!",
            director_output=director_out,
            breakdown_output=breakdown_out,
            frames=final_frames
        )
    except Exception as e:
        logger.error(f"Lỗi quy trình Full Pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong chu trình Multi-Agent: {str(e)}"
        )
