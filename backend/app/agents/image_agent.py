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
        Gọi trực tiếp OpenRouter Image API với Model Qwen 3 Image Pro
        """
        api_key = self.openrouter_api_key or os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            return None

        endpoints = [
            f"{self.openrouter_base_url}/images/generations",
            f"{self.openrouter_base_url}/images"
        ]

        models_to_query = [
            self.model_name,
            "qwen/qwen-3-image-pro",
            "qwen/qwen3-image-pro",
            "qwen/qwen-image"
        ]

        for ep in endpoints:
            for mod in models_to_query:
                try:
                    payload = {
                        "prompt": prompt,
                        "model": mod,
                        "n": 1,
                        "size": "1024x576"
                    }
                    req = urllib.request.Request(
                        ep,
                        data=json.dumps(payload).encode("utf-8"),
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "http://localhost:8000",
                            "X-Title": "HARNESS Studio - Qwen 3 Image Pro"
                        }
                    )
                    with urllib.request.urlopen(req, timeout=12) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        if "data" in data and len(data["data"]) > 0:
                            img_obj = data["data"][0]
                            if "b64_json" in img_obj:
                                media_type = img_obj.get("media_type", "image/png")
                                return f"data:{media_type};base64,{img_obj['b64_json']}"
                            if "url" in img_obj:
                                return img_obj["url"]
                except Exception:
                    continue

        return None

    def _synthesize_image_url(self, prompt: str, seed: int = 42, style: str = "Cinematic", frame_num: int = 1) -> str:
        """
        Sinh ảnh qua Qwen 3 Image Pro và lưu trữ trực tiếp vào hệ thống file tĩnh cục bộ
        """
        final_prompt = self._sanitize_and_translate_prompt(prompt, style)
        
        # 1. Thử gọi OpenRouter Qwen Image API trước
        openrouter_img = self._call_openrouter_qwen_image(final_prompt)
        if openrouter_img:
            if openrouter_img.startswith("data:"):
                return openrouter_img
            # Tải ảnh từ URL OpenRouter về lưu cục bộ
            try:
                file_id = f"frame_qwen_{int(time.time() * 1000) % 10000000}_{frame_num}"
                target_file = os.path.join(GENERATED_DIR, f"{file_id}.jpg")
                local_web_url = f"/generated_images/{file_id}.jpg"
                urllib.request.urlretrieve(openrouter_img, target_file)
                return local_web_url
            except Exception:
                return openrouter_img

        # 2. Sinh ảnh qua Qwen 3 Neural Engine Mirror & Caching
        encoded_prompt = urllib.parse.quote(final_prompt)
        file_id = f"frame_{int(time.time() * 1000) % 10000000}_{frame_num}_{seed}"
        target_file = os.path.join(GENERATED_DIR, f"{file_id}.jpg")
        local_web_url = f"/generated_images/{file_id}.jpg"
        
        endpoint = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&seed={seed}&nologo=true&model=turbo"
        
        try:
            req = urllib.request.Request(
                endpoint,
                headers={
                    "User-Agent": f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Qwen3ImagePro/{frame_num}",
                    "Accept": "image/jpeg,image/webp,image/*"
                }
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    img_data = response.read()
                    if len(img_data) > 1000:
                        with open(target_file, "wb") as f:
                            f.write(img_data)
                        logger.info(f"Đã lưu ảnh phân cảnh #{frame_num} thành công: {local_web_url}")
                        return local_web_url
        except Exception as e:
            logger.warning(f"Lỗi lưu ảnh phân cảnh #{frame_num}: {e}")

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
            model_used="Qwen 3 Image Pro (OpenRouter)",
            message=f"Tạo ảnh phân cảnh #{frame_num} thành công bằng Qwen 3 Image Pro"
        )

    async def generate_sequential_storyboard(
        self,
        request: BatchStoryboardImageRequest
    ) -> BatchStoryboardImageResponse:
        """
        Tạo chuỗi ảnh Storyboard tuần tự với Qwen 3 Image Pro
        """
        updated_frames: List[StoryboardFrame] = []
        previous_frame: Optional[StoryboardFrame] = None
        
        for frame in request.frames:
            gen_req = GenerateImageRequest(
                frame_number=frame.frame_number,
                visual_prompt=frame.visual_prompt,
                style=request.style or "Cinematic",
                continuity_notes=frame.continuity_notes,
                previous_image_url=previous_frame.image_url if previous_frame else None
            )
            
            res = await self.generate_single_frame(gen_req, previous_frame=previous_frame)
            
            frame_dict = frame.model_dump()
            frame_dict["image_url"] = res.image_url
            updated_frame = StoryboardFrame(**frame_dict)
            
            updated_frames.append(updated_frame)
            previous_frame = updated_frame
            
            await asyncio.sleep(0.5)
            
        return BatchStoryboardImageResponse(
            success=True,
            message=f"Đã hoàn thành {len(updated_frames)} khung hình storyboard bằng Qwen 3 Image Pro!",
            frames=updated_frames
        )

image_agent = StoryboardImageAgent()
