import os
import json
import logging
import re
from typing import Optional, Dict, Any, List
from app.config import settings
from app.models.schemas import (
    DirectorStoryOutput,
    SceneBreakdownRequest,
    SceneBreakdownOutput,
    StoryboardFrame
)

logger = logging.getLogger(__name__)

SCENE_BREAKDOWN_SYSTEM_PROMPT = """Bạn là CHUYÊN GIA ĐẠO DIỄN HÌNH ẢNH & BÓC TÁCH PHÂN CẢNH ĐIỆN ẢNH (Master Cinematography & Storyboard Breakdown Agent).

NHIỆM VỤ:
Tiếp nhận kịch bản từ Đạo Diễn và bóc tách từng phân cảnh thành chuỗi khung hình (Shots / Frames) điện ảnh hoàn chỉnh, giữ vững tính liên tục (Continuity) của nhân vật và bối cảnh.

QUY TẮC BÓC TÁCH ĐIỆN ẢNH:
1. Mỗi phân cảnh (Scene) được chia thành 2-3 khung hình tuần tự theo nhịp điệu kể chuyện:
   - Khung thiết lập (Establishing / Wide Shot): Xác định không gian, vị trí tương quan của các nhân vật.
   - Khung trung cảnh / cận cảnh tương tác (Medium Shot / Over-the-Shoulder / Tracking): Thể hiện hành động, xung đột, đối thoại.
   - Khung điểm nhấn cảm xúc (Close-Up / High Angle / Dutch Tilt / Dynamic Shot): Thể hiện biểu cảm đắt giá hoặc cao trào.
2. Với MỖI khung hình (Frame), bắt buộc có các trường sau:
   - frame_number: Đánh số liên tục từ 1, 2, 3...
   - scene_number: Số thứ tự phân cảnh (1, 2, 3...).
   - scene_title: Tiêu đề phân cảnh ngắn gọn.
   - shot_type: Cỡ cảnh chuẩn điện ảnh (Extreme Wide Shot, Wide Shot, Medium Shot, Close-Up, Extreme Close-Up, Over-The-Shoulder, POV).
   - camera_angle: Góc máy (Eye-Level, Low Angle, High Angle, Dutch Angle, Bird's Eye).
   - camera_movement: Chuyển động máy (Static, Pan Left, Pan Right, Tilt Up, Tilt Down, Dolly In, Tracking Shot).
   - action_description: Miêu tả chi tiết bằng TIẾNG VIỆT về hành động, cử chỉ, biểu cảm và tương tác của nhân vật.
   - visual_prompt: Câu lệnh mô tả hình ảnh bằng TIẾNG ANH thật chi tiết để Model AI sinh ảnh chuẩn xác (ghi rõ nhân vật, hành động, bối cảnh, ánh sáng, góc máy, phong cách).
   - continuity_notes: Ghi chú bằng TIẾNG VIỆT về tính nhất quán (giữ nguyên màu lông/trang phục nhân vật, bối cảnh thời gian, ánh sáng từ khung trước).

ĐỊNH DẠNG ĐẦU RA:
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản thừa ngoài JSON) theo cấu trúc:
{
  "title": "Tên kịch bản",
  "story_type": "Truyện ngắn hoặc Truyện dài",
  "total_frames": 6,
  "frames": [
    {
      "frame_number": 1,
      "scene_number": 1,
      "scene_title": "Bối cảnh khởi đầu",
      "shot_type": "Wide Shot",
      "camera_angle": "Eye-Level",
      "camera_movement": "Slow Pan Right",
      "action_description": "Con mèo mướp vàng đang thong thả đi dạo trong sân vườn đầy nắng...",
      "visual_prompt": "Cinematic wide shot of an orange tabby cat walking peacefully in a sunlit rustic farmyard, comic book style, vibrant colors, clear outlines, bright daytime lighting, 8k",
      "continuity_notes": "Thiết lập tạo hình nhân vật: mèo lông vàng vằn cam, sân vườn cỏ xanh buổi sáng."
    }
  ]
}
"""

class SceneAgent:
    def __init__(self):
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.model = settings.DEEPSEEK_MODEL

    def _build_prompt(self, request: SceneBreakdownRequest) -> str:
        story_plan = request.story_plan
        style = request.style or "Cinematic"
        
        scenes_details = []
        for s in story_plan.scenes:
            scenes_details.append(
                f"[Phân cảnh {s.scene_number}: {s.title}]\n"
                f"- Diễn biến: {s.description}\n"
                f"- Gợi ý visual: {s.visual_prompt}\n"
            )
        
        scenes_str = "\n".join(scenes_details)
        
        return f"""KỊCH BẢN CẦN BÓC TÁCH:
Tiêu đề: {story_plan.title}
Thể loại: {story_plan.story_type}
Phong cách hình ảnh: {style}

DANH SÁCH PHÂN CẢNH:
{scenes_str}

YÊU CẦU:
Bóc tách toàn bộ kịch bản trên thành chuỗi 6-8 khung hình chi tiết (mỗi phân cảnh 2 khung hình), đảm bảo tính logic liền mạch, góc máy điện ảnh đa dạng và câu lệnh visual prompt tiếng Anh chuẩn xác cho từng khung."""

    def _call_ai_service(self, prompt: str) -> Optional[Dict[str, Any]]:
        # 1. Thử gọi DeepSeek V4 Flash / V4 Pro
        api_key = self.deepseek_api_key or os.getenv("DEEPSEEK_API_KEY", "")
        if api_key:
            models_to_try = [
                settings.DEEPSEEK_MODEL or "deepseek-v4-flash",
                settings.DEEPSEEK_MODEL_PRO or "deepseek-v4-pro",
                "deepseek-chat"
            ]
            for model_name in models_to_try:
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=api_key, base_url=self.base_url)
                    resp = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": SCENE_BREAKDOWN_SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.7
                    )
                    raw_text = resp.choices[0].message.content
                    logger.info(f"Model 2 (Bóc Tách Phân Cảnh): Đã bóc tách thành công với {model_name}")
                    return json.loads(raw_text)
                except Exception as e:
                    logger.warning(f"Lỗi gọi DeepSeek model {model_name} trong SceneAgent: {e}")
                    continue

        # 2. Thử gọi OpenRouter Qwen fallback
        openrouter_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=openrouter_key, base_url=settings.OPENROUTER_BASE_URL)
                resp = client.chat.completions.create(
                    model="qwen/qwen-2.5-72b-instruct",
                    messages=[
                        {"role": "system", "content": SCENE_BREAKDOWN_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                raw_text = resp.choices[0].message.content
                return json.loads(raw_text)
            except Exception as e:
                logger.warning(f"OpenRouter breakdown error: {e}")

        return None

    def _generate_deterministic_breakdown(self, request: SceneBreakdownRequest) -> Dict[str, Any]:
        """
        Bộ sinh phân cảnh thông minh nội bộ đảm bảo 100% không bao giờ gián đoạn
        """
        story_plan = request.story_plan
        style = request.style or "Cinematic"
        
        frames: List[Dict[str, Any]] = []
        frame_idx = 1
        
        # Mẫu góc máy điện ảnh linh hoạt
        shot_templates = [
            {"shot": "Wide Establishing Shot", "angle": "Eye-Level", "move": "Slow Pan", "focus": "thiết lập không gian toàn cảnh và các nhân vật"},
            {"shot": "Medium Shot", "angle": "Low Angle", "move": "Tracking In", "focus": "tập trung vào hành động chính và tương tác đối diện"},
            {"shot": "Close-Up Shot", "angle": "Eye-Level", "move": "Static Focus", "focus": "bộc lộ biểu cảm cảm xúc và phản ứng bất ngờ"},
            {"shot": "Over-The-Shoulder Shot", "angle": "Over-the-Shoulder", "move": "Slow Dolly", "focus": "góc nhìn tương quan giữa 2 nhân vật đối thoại/đối đầu"},
            {"shot": "Dynamic High Angle", "angle": "High Angle", "move": "Tilt Down", "focus": "toàn cảnh bao quát khoảnh khắc giải quyết cao trào"}
        ]
        
        for s_idx, scene in enumerate(story_plan.scenes, 1):
            # Khung 1 của phân cảnh
            t1 = shot_templates[(frame_idx - 1) % len(shot_templates)]
            frames.append({
                "frame_number": frame_idx,
                "scene_number": scene.scene_number,
                "scene_title": scene.title or f"Phân cảnh {scene.scene_number}",
                "shot_type": t1["shot"],
                "camera_angle": t1["angle"],
                "camera_movement": t1["move"],
                "action_description": f"Phân đoạn {scene.scene_number} ({scene.title}): {scene.description}",
                "visual_prompt": f"{style} style, {t1['shot'].lower()} of {scene.description}, {scene.visual_prompt}, dynamic composition, sharp details, masterwork, 8k",
                "continuity_notes": "Thiết lập bối cảnh không gian và nhân vật mở đầu." if frame_idx == 1 else f"Kế thừa tạo hình nhân vật và ánh sáng từ khung #{frame_idx-1}."
            })
            frame_idx += 1
            
            # Khung 2 của phân cảnh
            t2 = shot_templates[(frame_idx - 1) % len(shot_templates)]
            frames.append({
                "frame_number": frame_idx,
                "scene_number": scene.scene_number,
                "scene_title": scene.title or f"Phân cảnh {scene.scene_number}",
                "shot_type": t2["shot"],
                "camera_angle": t2["angle"],
                "camera_movement": t2["move"],
                "action_description": f"Diễn biến cao trào phân cảnh {scene.scene_number}: {scene.description}. {t2['focus']}.",
                "visual_prompt": f"{style} style, {t2['shot'].lower()} from {t2['angle'].lower()}, dramatic focus on {scene.description}, vivid character expressions, cinema lighting, 8k",
                "continuity_notes": f"Bảo toàn trang phục, màu sắc và hướng chuyển động từ khung #{frame_idx-1}."
            })
            frame_idx += 1

        return {
            "title": story_plan.title or "Kịch Bản Storyboard",
            "story_type": story_plan.story_type or "Truyện ngắn",
            "total_frames": len(frames),
            "frames": frames
        }

    async def breakdown_scenes(self, request: SceneBreakdownRequest) -> SceneBreakdownOutput:
        prompt = self._build_prompt(request)
        result_json = self._call_ai_service(prompt)
        
        if not result_json or "frames" not in result_json or len(result_json["frames"]) == 0:
            result_json = self._generate_deterministic_breakdown(request)
            
        try:
            return SceneBreakdownOutput(**result_json)
        except Exception as e:
            logger.error(f"Lỗi parse SceneBreakdownOutput: {e}")
            fallback = self._generate_deterministic_breakdown(request)
            return SceneBreakdownOutput(**fallback)

scene_agent = SceneAgent()
