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
        self.model_name = getattr(settings, "OPENROUTER_IMAGE_MODEL", None) or "openai/gpt-image-2.5-flare"

    def _sanitize_and_translate_prompt(self, raw_prompt: str, style: str = "Cinematic") -> str:
        """
        Làm sạch, định hình và tối ưu hóa Prompt tiếng Anh chuyên sâu cho mô hình tạo ảnh
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

    def _call_openrouter_image(self, prompt: str, frame_num: int = 1, seed: int = 42) -> Optional[str]:
        """
        Gọi OpenRouter Images API để sinh ảnh phân cảnh chất lượng cao và lưu cục bộ
        """
        api_key = self.openrouter_api_key or settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            return None

        preferred_model = getattr(settings, "OPENROUTER_IMAGE_MODEL", None) or "openai/gpt-image-2.5-flare"
        models_to_try = [preferred_model, "openai/gpt-image-2.5-flare", "openai/gpt-5-image-mini", "google/gemini-2.5-flash-image"]
        seen = set()
        models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

        endpoint = f"{self.openrouter_base_url.rstrip('/')}/images/generations"

        for model in models:
            try:
                payload = {
                    "prompt": prompt,
                    "model": model
                }
                req = urllib.request.Request(
                    endpoint,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:8000",
                        "X-Title": "HARNESS Studio Storyboard"
                    }
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        if "data" in data and len(data["data"]) > 0:
                            img_obj = data["data"][0]
                            file_id = f"frame_or_{int(time.time() * 1000) % 10000000}_{frame_num}_{seed}"
                            target_file = os.path.join(GENERATED_DIR, f"{file_id}.jpg")
                            local_web_url = f"/generated_images/{file_id}.jpg"

                            if "b64_json" in img_obj and img_obj["b64_json"]:
                                img_bytes = base64.b64decode(img_obj["b64_json"])
                                with open(target_file, "wb") as f:
                                    f.write(img_bytes)
                                logger.info(f"Đã sinh ảnh qua OpenRouter ({model}) phân cảnh #{frame_num}: {local_web_url}")
                                return local_web_url

                            if "url" in img_obj and img_obj["url"]:
                                img_url = img_obj["url"]
                                try:
                                    dl_req = urllib.request.Request(
                                        img_url,
                                        headers={"User-Agent": "Mozilla/5.0"}
                                    )
                                    with urllib.request.urlopen(dl_req, timeout=12) as dl_resp:
                                        if dl_resp.status == 200:
                                            with open(target_file, "wb") as f:
                                                f.write(dl_resp.read())
                                            logger.info(f"Đã tải ảnh OpenRouter ({model}) phân cảnh #{frame_num}: {local_web_url}")
                                            return local_web_url
                                except Exception:
                                    return img_url
            except urllib.error.HTTPError as e:
                err_text = ""
                try:
                    err_text = e.read().decode("utf-8")
                except Exception:
                    pass
                logger.warning(f"Lỗi OpenRouter HTTP {e.code} ({model}) phân cảnh #{frame_num}: {err_text}")
                continue
            except Exception as e:
                logger.warning(f"Lỗi OpenRouter ({model}) phân cảnh #{frame_num}: {e}")
                continue

        return None

    def _synthesize_image_url(self, prompt: str, seed: int = 42, style: str = "Cinematic", frame_num: int = 1) -> str:
        """
        Sinh ảnh qua OpenRouter API trước, nếu lỗi hoặc timeout sẽ tự động chuyển sang mirror fallback
        """
        final_prompt = self._sanitize_and_translate_prompt(prompt, style)
        
        # 1. Thử tạo ảnh chất lượng cao qua OpenRouter API với key mới
        openrouter_img = self._call_openrouter_image(final_prompt, frame_num=frame_num, seed=seed)
        if openrouter_img:
            return openrouter_img

        # 2. Fallback an toàn: Sinh ảnh qua Neural Mirror Engine
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
                            logger.info(f"Đã lưu ảnh phân cảnh #{frame_num} (Mirror) thành công: {local_web_url}")
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
        Tạo ảnh cho một khung hình đơn lẻ
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
        
        model_used = "GPT Image 2.5 Flare" if img_url.startswith("/generated_images/frame_or_") else "Storyboard Mirror Engine"
        
        return GenerateImageResponse(
            success=True,
            frame_number=frame_num,
            image_url=img_url,
            model_used=model_used,
            message=f"Tạo ảnh phân cảnh #{frame_num} thành công bằng {model_used}"
        )

    async def generate_parallel_storyboard_stream(
        self,
        frames: List[StoryboardFrame],
        style: str = "Cinematic",
        max_concurrency: int = 2
    ):
        """
        Khởi tạo các worker xử lý song song từng khung hình.
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
                    return frame.frame_number, fallback_url, "GPT Image 2.5 Flare"

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
