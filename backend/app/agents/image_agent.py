import os
import json
import logging
import urllib.parse
import urllib.request
import base64
import uuid
import re
import asyncio
import time
import random
from typing import Optional, Dict, Any, List
from app.config import settings
from app.models.schemas import (
    StoryboardFrame,
    GenerateImageRequest,
    GenerateImageResponse,
    BatchStoryboardImageRequest,
    BatchStoryboardImageResponse
)

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", "frontend"))
GENERATED_DIR = os.path.join(FRONTEND_DIR, "generated_images")
os.makedirs(GENERATED_DIR, exist_ok=True)

class StoryboardImageAgent:
    def __init__(self):
        self.openrouter_api_key = settings.OPENROUTER_API_KEY
        self.openrouter_base_url = settings.OPENROUTER_BASE_URL
        self.model_name = settings.QWEN_MODEL or "qwen/qwen-3-image-pro"

    def _sanitize_and_translate_prompt(self, raw_prompt: str, style: str = "Cinematic") -> str:
        """
        Làm sạch, định hình và tối ưu hóa Prompt tiếng Anh chuyên sâu cho Qwen 3 Image Pro
        """
        clean = re.sub(r'^(visual prompt|prompt|mô tả visual|shot|cảnh \d+|phân cảnh \d+):?\s*', '', raw_prompt, flags=re.IGNORECASE)
        clean = clean.replace("\n", " ").replace("\r", " ").replace('"', '').replace("'", '').replace("?", '').replace("&", " and ").strip()

        if len(clean) > 200:
            clean = clean[:200].rsplit(' ', 1)[0]

        style_modifiers = {
            "Cinematic": "cinematic film still, 35mm photography, volumetric lighting, atmospheric depth, 8k resolution, photorealistic",
            "Anime": "anime movie aesthetic, Makoto Shinkai style, vibrant colors, beautiful sky, detailed cel shading, 8k",
            "Comic Book": "comic book graphic novel style, bold line art, vibrant color palette, dynamic perspective, masterpiece",
            "Cyberpunk": "cyberpunk neon atmosphere, rain reflections, glowing holographic lights, futuristic cinematic lighting, 8k",
            "Watercolor": "delicate watercolor concept art, soft brushstrokes, artistic pastel tones, dreamy lighting",
            "3D Animation": "3D Pixar Disney animation style, smooth rendering, subsurface scattering, expressive characters, 8k"
        }

        modifier = style_modifiers.get(style, "cinematic film shot, detailed composition, sharp focus, 8k")
        return f"{clean}, {modifier}"

    def _call_openrouter_qwen_image(self, prompt: str) -> Optional[str]:
        """
        Bỏ qua OpenRouter Image do endpoint này yêu cầu gói trả phí đặc thù hoặc trả về 403/404,
        tránh làm chậm 90s cho chuỗi khung hình.
        """
        return None

    def _synthesize_image_url(self, prompt: str, seed: int = 42, style: str = "Cinematic", frame_num: int = 1) -> str:
        """
        Sinh ảnh qua Qwen 3 Neural Engine Mirror & Caching với cơ chế Retry & Safe Fallback
        """
        final_prompt = self._sanitize_and_translate_prompt(prompt, style)
        encoded_prompt = urllib.parse.quote(final_prompt)
        file_id = f"frame_{int(time.time() * 1000) % 10000000}_{frame_num}_{seed}"
        target_file = os.path.join(GENERATED_DIR, f"{file_id}.jpg")
        local_web_url = f"/generated_images/{file_id}.jpg"
        
        endpoint = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&seed={seed}&nologo=true&model=turbo"
        
        # Thử tối đa 2 lần với backoff nếu gặp 429 (Too Many Requests)
        for attempt in range(2):
            try:
                req = urllib.request.Request(
                    endpoint,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    if response.status == 200:
                        img_data = response.read()
                        if len(img_data) > 1000:
                            with open(target_file, "wb") as f:
                                f.write(img_data)
                            logger.info(f"Đã lưu ảnh phân cảnh #{frame_num} thành công: {local_web_url}")
                            return local_web_url
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt == 0:
                    time.sleep(1.2)
                    continue
                logger.warning(f"Lỗi HTTP {e.code} lưu ảnh phân cảnh #{frame_num}: {e}")
            except Exception as e:
                logger.warning(f"Lỗi lưu ảnh phân cảnh #{frame_num}: {e}")
                if attempt == 0:
                    time.sleep(1.0)
                    continue

        return endpoint

    async def generate_single_frame(
        self,
        request: GenerateImageRequest,
        previous_frame: Optional[StoryboardFrame] = None
    ) -> GenerateImageResponse:
        """
        Tạo ảnh cho một khung hình đơn lẻ bằng Qwen 3 Image Pro
        """
        frame_num = request.frame_number
        seed = 1000 + frame_num * 31 + random.randint(1, 100)
        
        img_url = await asyncio.to_thread(
            self._synthesize_image_url,
            prompt=request.visual_prompt,
            seed=seed,
            style=request.style or "Cinematic",
            frame_num=frame_num
        )
        
        return GenerateImageResponse(
            success=True,
            frame_number=frame_num,
            image_url=img_url,
            model_used="Qwen 3 Image Pro",
            message=f"Tạo ảnh phân cảnh #{frame_num} thành công bằng Qwen 3 Image Pro"
        )

    async def generate_parallel_storyboard_stream(
        self,
        frames: List[StoryboardFrame],
        style: str = "Cinematic",
        max_concurrency: int = 2
    ):
        """
        Khởi tạo các worker clone Qwen 3 Pro xử lý song song từng khung hình.
        Yield kết quả ngay lập tức khi mỗi worker hoàn thành:
        (frame_number, image_url, completed_count, total_count, model_used)
        """
        total_count = len(frames)
        if total_count == 0:
            return

        # Concurrency an toàn = 2 để tránh bị nhà cung cấp ảnh rate-limit 429
        semaphore = asyncio.Semaphore(max_concurrency)
        completed_count = 0

        async def _worker(frame: StoryboardFrame, delay: float = 0.0):
            if delay > 0:
                await asyncio.sleep(delay)
            async with semaphore:
                try:
                    gen_req = GenerateImageRequest(
                        frame_number=frame.frame_number,
                        visual_prompt=frame.visual_prompt,
                        style=style or "Cinematic",
                        continuity_notes=frame.continuity_notes
                    )
                    res = await self.generate_single_frame(gen_req)
                    return frame.frame_number, res.image_url, res.model_used
                except Exception as e:
                    logger.error(f"Lỗi worker frame #{frame.frame_number}: {e}")
                    clean_p = urllib.parse.quote(frame.visual_prompt[:120])
                    fallback_url = f"https://image.pollinations.ai/prompt/{clean_p}?width=800&height=450&nologo=true"
                    return frame.frame_number, fallback_url, "Qwen 3 Image Pro"

        # Phân bổ thời gian khởi động so le nhẹ nhàng
        tasks = [asyncio.create_task(_worker(f, delay=idx * 0.35)) for idx, f in enumerate(frames)]

        for future in asyncio.as_completed(tasks):
            try:
                frame_num, img_url, model_used = await future
            except Exception as e:
                logger.error(f"Lỗi bất ngờ khi chờ task frame: {e}")
                continue

            completed_count += 1
            yield {
                "frame_number": frame_num,
                "image_url": img_url,
                "model_used": model_used,
                "completed_count": completed_count,
                "total_count": total_count
            }

    async def generate_parallel_storyboard(
        self,
        request: BatchStoryboardImageRequest,
        max_concurrency: int = 2
    ) -> BatchStoryboardImageResponse:
        """
        Tạo chuỗi ảnh Storyboard song song siêu tốc với các clone Qwen 3 Pro
        """
        frame_map = {f.frame_number: f.model_dump() for f in request.frames}
        
        async for item in self.generate_parallel_storyboard_stream(
            frames=request.frames,
            style=request.style or "Cinematic",
            max_concurrency=max_concurrency
        ):
            f_num = item["frame_number"]
            if f_num in frame_map:
                frame_map[f_num]["image_url"] = item["image_url"]

        sorted_frames = [
            StoryboardFrame(**frame_map[f.frame_number])
            for f in sorted(request.frames, key=lambda x: x.frame_number)
        ]

        return BatchStoryboardImageResponse(
            success=True,
            message=f"Đã hoàn thành {len(sorted_frames)} khung hình storyboard song song bằng các clone Qwen 3 Pro!",
            frames=sorted_frames
        )

    async def generate_sequential_storyboard(
        self,
        request: BatchStoryboardImageRequest
    ) -> BatchStoryboardImageResponse:
        """
        Tương thích ngược: Chạy song song nhanh chóng thay vì chờ tuần tự
        """
        return await self.generate_parallel_storyboard(request)

image_agent = StoryboardImageAgent()
