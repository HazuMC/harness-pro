import sys
import os
import asyncio

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
from app.models.schemas import StoryRequest
from app.agents.director_agent import director_agent

async def main():
    print("========================================")
    print("TEST 1: TRUYỆN NGẮN (3 PHÂN CẢNH)")
    print("========================================")
    req_short = StoryRequest(
        story="Một chú mèo robot du hành về thời phong kiến và giúp một đầu bếp hoàng cung nấu món ăn kỳ diệu.",
        story_type="short",
        style="Anime Ghibli"
    )
    result_short = await director_agent.generate_story_plan(req_short)
    print(f"Tiêu đề: {result_short.title}")
    print(f"Thể loại: {result_short.story_type}")
    print(f"Tổng số phân cảnh: {len(result_short.scenes)}")
    for s in result_short.scenes:
        print(f"  - Cảnh {s.scene_number} [{s.title}]: {s.description}")
        print(f"    Visual Prompt: {s.visual_prompt}")

    print("\n========================================")
    print("TEST 2: TRUYỆN DÀI (5-7 PHÂN CẢNH)")
    print("========================================")
    req_long = StoryRequest(
        story="Cuộc thám hiểm xuyên qua hố sâu không gian tìm kiếm nguồn năng lượng cứu rỗi Trái Đất của phi hành đoàn tàu Genesis.",
        story_type="long",
        style="Cinematic Sci-Fi"
    )
    result_long = await director_agent.generate_story_plan(req_long)
    print(f"Tiêu đề: {result_long.title}")
    print(f"Thể loại: {result_long.story_type}")
    print(f"Tổng số phân cảnh: {len(result_long.scenes)}")
    for s in result_long.scenes:
        print(f"  - Cảnh {s.scene_number} [{s.title}]: {s.description}")
        print(f"    Visual Prompt: {s.visual_prompt}")

    print("\n Director Agent tối giản hoạt động chính xác!")


if __name__ == "__main__":
    asyncio.run(main())
