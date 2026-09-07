import os
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings
from app.models.schemas import StoryRequest, DirectorStoryOutput, Scene

logger = logging.getLogger(__name__)

DIRECTOR_SYSTEM_PROMPT = """Bạn là một ĐẠO DIỄN AI (Director Agent) chuyên nghiệp. Nhiệm vụ duy nhất của bạn là đọc hiểu Ý TƯỞNG (PROMPT) của người dùng và bóc tách câu chuyện thành các PHÂN CẢNH (Scenes) rõ ràng, đặt tên cho từng phân cảnh và mô tả hình ảnh chi tiết.

QUY TẮC PHÂN CẢNH:
- Nếu story_type là 'short' (Truyện ngắn): Tạo ĐÚNG 3 phân cảnh (Cảnh 1: Mở đầu -> Cảnh 2: Diễn biến/Cao trào -> Cảnh 3: Kết thúc).
- Nếu story_type là 'long' (Truyện dài): Tạo từ 5 đến 7 phân cảnh thể hiện sự phát triển xuyên suốt của câu chuyện.
- BẮT BUỘC: Đặt TÊN / TIÊU ĐỀ (title) ngắn gọn, hấp dẫn và gợi hình ảnh cho TỪNG PHÂN CẢNH.

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một JSON hợp lệ có cấu trúc sau (không kèm văn bản hay markdown giải thích):
{
  "title": "Tiêu đề toàn bộ câu chuyện",
  "story_type": "Truyện ngắn" hoặc "Truyện dài",
  "scenes": [
    {
      "scene_number": 1,
      "title": "Tên ngắn gọn của phân cảnh này (Ví dụ: Khởi Đầu Bí Ẩn, Cuộc Chạm Trán Đêm Mưa...)",
      "description": "Diễn biến/hành động chính trong phân cảnh này",
      "visual_prompt": "Mô tả hình ảnh chi tiết (nhân vật, ánh sáng, góc nhìn, phong cách) để AI vẽ tranh"
    }
  ]
}
"""

class DirectorAgent:
    def __init__(self):
        self.provider = "deepseek"
        self.deepseek_api_key = settings.DEEPSEEK_API_KEY

    def _build_user_prompt(self, request: StoryRequest) -> str:
        is_long = request.story_type in ["long", "truyen_dai", "dài", "dai"]
        mode_text = "Truyện dài (5-7 cảnh)" if is_long else "Truyện ngắn (3 cảnh)"
        style_text = request.style or "Cinematic"
        
        return f"""Ý TƯỞNG NGƯỜI DÙNG:
{request.story}

YÊU CẦU:
- Thể loại: {mode_text}
- Phong cách hình ảnh: {style_text}
- Đặt tên hấp dẫn cho từng phân cảnh (title).

Hãy phân tích và chia thành các phân cảnh JSON theo đúng cấu trúc."""

    def _call_deepseek(self, user_prompt: str) -> Optional[Dict[str, Any]]:
        api_key = self.deepseek_api_key or settings.DEEPSEEK_API_KEY or os.getenv("DEEPSEEK_API_KEY", "")
        if not api_key:
            return None
        
        models_to_try = [
            settings.DEEPSEEK_MODEL or "deepseek-v4-flash",
            settings.DEEPSEEK_MODEL_PRO or "deepseek-v4-pro",
            "deepseek-chat"
        ]
        
        for model_name in models_to_try:
            try:
                from openai import OpenAI
                client = OpenAI(
                    api_key=api_key,
                    base_url=settings.DEEPSEEK_BASE_URL
                )
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": DIRECTOR_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                content = response.choices[0].message.content
                logger.info(f"Model 1 (Đạo Diễn): Đã hoàn thành kịch bản với {model_name}")
                return json.loads(content)
            except Exception as e:
                logger.warning(f"Lỗi gọi DeepSeek model {model_name}: {e}")
                continue
        return None

    def _call_openai(self, user_prompt: str) -> Optional[Dict[str, Any]]:
        api_key = self.openai_api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": DIRECTOR_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"Lỗi gọi OpenAI: {e}")
            return None

    def _generate_fallback_template(self, request: StoryRequest) -> Dict[str, Any]:
        """Tạo phân cảnh trực tiếp bám sát prompt khi chưa có API key"""
        is_long = request.story_type in ["long", "truyen_dai", "dài", "dai"]
        mode_label = "Truyện dài" if is_long else "Truyện ngắn"
        style = request.style or "Cinematic"
        story_text = request.story.strip()
        
        scenes = []
        if is_long:
            scenes = [
                {
                    "scene_number": 1,
                    "title": "Khởi Nguồn Biến Cố",
                    "description": f"Mở đầu: Giới thiệu nhân vật và khởi nguồn câu chuyện: {story_text}",
                    "visual_prompt": f"{style} style, scene 1 opening establishing shot: {story_text}, cinematic lighting, ultra detailed."
                },
                {
                    "scene_number": 2,
                    "title": "Hành Trình Vượt Giới Tuyến",
                    "description": f"Khởi hành & Biến cố: Nhân vật bắt đầu hành trình và phát hiện những điều bất thường.",
                    "visual_prompt": f"{style} style, scene 2: character exploring new terrain, mysterious atmosphere, dynamic angle."
                },
                {
                    "scene_number": 3,
                    "title": "Đối Mặt Trở Ngại Đầu Tiên",
                    "description": f"Thử thách dâng cao: Đối mặt với trở ngại lớn đầu tiên.",
                    "visual_prompt": f"{style} style, scene 3: intense encounter, dramatic lighting, detailed foreground."
                },
                {
                    "scene_number": 4,
                    "title": "Đỉnh Điểm Cao Trào",
                    "description": f"Đỉnh điểm cao trào: Khoảnh khắc quyết định để giải quyết xung đột mấu chốt.",
                    "visual_prompt": f"{style} style, scene 4: climax action, explosive lighting, hero composition."
                },
                {
                    "scene_number": 5,
                    "title": "Bình Minh Tái Sinh",
                    "description": f"Hồi kết & Dư âm: Kết thúc câu chuyện với khung cảnh tươi sáng và bài học lắng đọng.",
                    "visual_prompt": f"{style} style, scene 5: serene ending scene, warm golden hour lighting, cinematic wide view."
                }
            ]
        else:
            # 3 scenes for short story
            scenes = [
                {
                    "scene_number": 1,
                    "title": "Mở Màn Câu Chuyện",
                    "description": f"Mở đầu: {story_text}",
                    "visual_prompt": f"{style} style, scene 1: {story_text}, sharp focus, cinematic lighting."
                },
                {
                    "scene_number": 2,
                    "title": "Nút Thắt & Cao Trào",
                    "description": f"Diễn biến & Cao trào: Diễn biến kịch tính phát triển từ: {story_text}",
                    "visual_prompt": f"{style} style, scene 2: dramatic climax, high detail, vivid color palette."
                },
                {
                    "scene_number": 3,
                    "title": "Khép Lại Dư Vị",
                    "description": f"Kết thúc: Đoạn kết ấn tượng và trọn vẹn của câu chuyện.",
                    "visual_prompt": f"{style} style, scene 3: resolving shot, emotional ending, artistic composition."
                }
            ]

        # Lấy tiêu đề ngắn gọn từ prompt
        short_title = story_text.split("\n")[0][:45]
        if len(story_text) > 45:
            short_title += "..."

        return {
            "title": short_title,
            "story_type": mode_label,
            "scenes": scenes
        }

    async def generate_story_plan(self, request: StoryRequest) -> DirectorStoryOutput:
        """Điều phối Đạo diễn AI lập kịch bản phân cảnh (Chuyên biệt DeepSeek)"""
        user_prompt = self._build_user_prompt(request)
        result_json = None

        # 1. Gọi DeepSeek làm Model Đạo Diễn chính
        result_json = self._call_deepseek(user_prompt)

        # 2. Fallback OpenAI (nếu có key)
        if not result_json:
            result_json = self._call_openai(user_prompt)

        # 3. Fallback thuật toán cấu trúc nội bộ nếu mất mạng/hết quota
        if not result_json:
            result_json = self._generate_fallback_template(request)

        try:
            return DirectorStoryOutput(**result_json)
        except Exception as e:
            logger.error(f"Lỗi parse DirectorStoryOutput: {e}")
            fallback = self._generate_fallback_template(request)
            return DirectorStoryOutput(**fallback)

director_agent = DirectorAgent()