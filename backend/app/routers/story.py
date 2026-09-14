import json
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
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
@router.post("/breakdown-scenes", response_model=SceneBreakdownResponse)
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
@router.post("/generate-frame-image", response_model=GenerateImageResponse)
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


@router.post("/generate-storyboard-images", response_model=BatchStoryboardImageResponse)
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
@router.post("/pipeline/full", response_model=FullPipelineResponse)
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


# ================= 5. STREAMING PIPELINE: SSE REAL-TIME CLONE WORKERS =================
@router.post("/pipeline/stream")
@router.post("/api/pipeline/stream")
async def stream_full_pipeline(request: FullPipelineRequest):
    """
    Chạy tự động toàn bộ 3 Model Agentic theo dạng Streaming (SSE - Server-Sent Events):
    1. Model 1 (Đạo Diễn) -> Stream kịch bản
    2. Model 2 (DeepSeek) -> Stream bóc tách góc máy (Frontend render ngay dàn khung)
    3. Model 3 (Nhiều clone Qwen 3 Pro song song) -> Stream ảnh từng khung ngay khi render xong
    """
    async def event_generator():
        try:
            # 1. Báo bắt đầu Model 1
            yield f"event: step\ndata: {json.dumps({'step': 1, 'title': 'Đạo diễn kịch bản', 'message': 'Đang phân bổ kịch bản và hồi truyện...'}, ensure_ascii=False)}\n\n"
            
            story_req = StoryRequest(
                story=request.story,
                story_type=request.story_type,
                style=request.style
            )
            director_out = await director_agent.generate_story_plan(story_req)
            yield f"event: director_complete\ndata: {json.dumps(director_out.model_dump(), ensure_ascii=False)}\n\n"

            # 2. Báo bắt đầu Model 2
            yield f"event: step\ndata: {json.dumps({'step': 2, 'title': 'Bóc tách góc máy', 'message': 'Đang chia khung hình, cỡ cảnh và tính nhất quán...'}, ensure_ascii=False)}\n\n"
            
            breakdown_req = SceneBreakdownRequest(
                story_plan=director_out,
                style=request.style
            )
            breakdown_out = await scene_agent.breakdown_scenes(breakdown_req)
            
            # Gửi dàn khung hình ban đầu về để Frontend vẽ trước cấu trúc
            yield f"event: breakdown_complete\ndata: {json.dumps({'director': director_out.model_dump(), 'breakdown': breakdown_out.model_dump(), 'frames': [f.model_dump() for f in breakdown_out.frames]}, ensure_ascii=False)}\n\n"

            final_frames = [f.model_dump() for f in breakdown_out.frames]

            # 3. Model 3: Chạy song song nhiều clone Qwen 3 Pro
            if request.generate_images and len(breakdown_out.frames) > 0:
                total_frames = len(breakdown_out.frames)
                yield f"event: step\ndata: {json.dumps({'step': 3, 'title': 'Khởi động các clone Qwen 3 Pro', 'message': f'Đang kích hoạt đồng thời {total_frames} worker clone Qwen 3 Pro vẽ song song...', 'total_frames': total_frames}, ensure_ascii=False)}\n\n"

                async for frame_update in image_agent.generate_parallel_storyboard_stream(
                    frames=breakdown_out.frames,
                    style=request.style or "Cinematic",
                    max_concurrency=2
                ):
                    # Cập nhật kết quả vào danh sách lưu trữ
                    f_num = frame_update["frame_number"]
                    for f in final_frames:
                        if f["frame_number"] == f_num:
                            f["image_url"] = frame_update["image_url"]
                            break
                    
                    # Bắn event frame_ready về Client ngay khi worker này vẽ xong
                    yield f"event: frame_ready\ndata: {json.dumps(frame_update, ensure_ascii=False)}\n\n"

            # 4. Gửi event hoàn tất
            yield f"event: complete\ndata: {json.dumps({'message': 'Hoàn thành toàn bộ Storyboard!', 'frames': final_frames, 'director_output': director_out.model_dump(), 'breakdown_output': breakdown_out.model_dump()}, ensure_ascii=False)}\n\n"

        except Exception as e:
            logger.error(f"Lỗi trong streaming pipeline: {e}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'detail': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
