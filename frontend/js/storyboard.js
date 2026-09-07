// storyboard.js - Điều phối 3 Giai Đoạn Storyboard Tự Động (Ẩn Prompts Tạo Ảnh)

document.addEventListener("DOMContentLoaded", () => {
    initStoryboardStudio();
});

let studioState = {
    directorOutput: null,
    breakdownOutput: null,
    frames: []
};

function initStoryboardStudio() {
    bindStudioEvents();
    checkForImportedStory();
}

function checkForImportedStory() {
    // 1. Nhận từ Director Agent (test.html hoặc index.html)
    const importedJson = sessionStorage.getItem("imported_director_story");
    if (importedJson) {
        try {
            const parsed = JSON.parse(importedJson);
            sessionStorage.removeItem("imported_director_story");
            studioState.directorOutput = parsed;
            
            const storyInput = document.getElementById("sb-story-prompt");
            if (storyInput) storyInput.value = parsed.title || "";
            
            updateStepIndicators(2);
            showToast("Đã nạp kịch bản! Nhấn 'Tạo Storyboard' để hoàn tất các bước tiếp theo.", "info");
            return;
        } catch (e) {
            console.error("Lỗi parse imported story:", e);
        }
    }

    // 2. Nhận từ Trợ Lý Kịch Bản (chat.html) hoặc Kho Lưu Trữ (gallery.html)
    const importedChatPrompt = sessionStorage.getItem("imported_chat_prompt");
    if (importedChatPrompt) {
        sessionStorage.removeItem("imported_chat_prompt");
        const storyInput = document.getElementById("sb-story-prompt");
        if (storyInput) {
            storyInput.value = importedChatPrompt;
            showToast("Đã chuyển ý tưởng sang Storyboard! Nhấn 'Tạo Storyboard' để bắt đầu.", "info");
        }
    }
}

function bindStudioEvents() {
    // 1. Nút "Tạo Storyboard" (Chạy tự động toàn bộ 3 bước)
    const btnCreate = document.getElementById("btn-create-storyboard");
    if (btnCreate) {
        btnCreate.addEventListener("click", handleRunFullAutoPipeline);
    }

    // 2. Tải JSON
    const btnDownload = document.getElementById("sb-btn-download-json");
    if (btnDownload) {
        btnDownload.addEventListener("click", downloadStoryboardJson);
    }

    // 3. Lưu vào Kho Lưu Trữ
    const btnSaveGallery = document.getElementById("sb-btn-save-gallery");
    if (btnSaveGallery) {
        btnSaveGallery.addEventListener("click", saveToGalleryArchive);
    }
}

// CHẠY TỰ ĐỘNG TOÀN BỘ 3 BƯỚC KHI NHẤN NÚT "TẠO"
async function handleRunFullAutoPipeline() {
    const prompt = document.getElementById("sb-story-prompt")?.value.trim();
    const storyType = document.getElementById("sb-story-type")?.value || "short";
    const style = document.getElementById("sb-style")?.value || "Cinematic";

    if (!prompt || prompt.length < 3) {
        showToast("Vui lòng nhập ý tưởng câu chuyện!", "warning");
        document.getElementById("sb-story-prompt")?.focus();
        return;
    }

    // 1. Kiểm tra và trừ Token
    if (typeof deductTokens === "function") {
        const hasEnough = deductTokens(50);
        if (!hasEnough) {
            showToast("Bạn không đủ Token để tạo Storyboard! Cần 50 Tokens.", "warning");
            if (typeof showClaimTokensModal === "function") {
                showClaimTokensModal();
            }
            return;
        }
    }

    const btn = document.getElementById("btn-create-storyboard");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang Tạo Storyboard...`;
    }

    setLoading(true, "Hệ thống đang tự động xử lý 3 giai đoạn...", "Đang phân bổ kịch bản, bóc tách góc máy và kết xuất chuỗi hình ảnh...");
    updateStepIndicators(1);
    simulateLoadingSteps();

    // 2. Khởi chạy Mini Game giải trí trong lúc chờ
    if (typeof startWaitingMiniGame === "function") {
        startWaitingMiniGame();
    }

    try {
        const res = await fetch("/api/pipeline/full", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                story: prompt,
                story_type: storyType,
                style: style,
                generate_images: true
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Lỗi trong quá trình tạo Storyboard");
        }

        const data = await res.json();

        studioState.directorOutput = data.director_output;
        studioState.breakdownOutput = data.breakdown_output;
        studioState.frames = data.frames || [];

        // Kiểm tra và tải trước toàn bộ hình ảnh vào bộ nhớ trước khi hiển thị
        setLoading(true, "Đang kiểm tra và tải toàn bộ hình ảnh...", "Đảm bảo 100% các phân cảnh đã sinh ảnh hoàn chỉnh...");
        await preloadAllStoryboardImages(studioState.frames);

        updateStepIndicators(3);
        renderFrames(studioState.frames);
        showToast("Đã tạo và nạp thành công toàn bộ hình ảnh Storyboard!", "success");

        // Cuộn nhẹ tới kết quả
        document.getElementById("sb-results-container")?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error("Lỗi full pipeline:", err);
        showToast(err.message || "Xảy ra lỗi khi tạo Storyboard", "error");
    } finally {
        if (typeof stopWaitingMiniGame === "function") {
            stopWaitingMiniGame();
        }
        setLoading(false);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-amber-300 mr-2"></i> <span>Tạo Storyboard</span>`;
        }
    }
}

function simulateLoadingSteps() {
    const step1 = document.getElementById("sb-prog-step-1");
    const step2 = document.getElementById("sb-prog-step-2");
    const step3 = document.getElementById("sb-prog-step-3");

    if (step1) step1.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    if (step2) step2.className = "flex items-center gap-2 text-zinc-400 text-xs";
    if (step3) step3.className = "flex items-center gap-2 text-zinc-400 text-xs";

    setTimeout(() => {
        updateStepIndicators(2);
        if (step1) step1.className = "flex items-center gap-2 text-emerald-600 text-xs font-semibold";
        if (step2) step2.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    }, 2000);

    setTimeout(() => {
        updateStepIndicators(3);
        if (step2) step2.className = "flex items-center gap-2 text-emerald-600 text-xs font-semibold";
        if (step3) step3.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    }, 4500);
}

// HÀM KIỂM TRA VÀ TẢI TOÀN BỘ ẢNH TRƯỚC KHI HIỂN THỊ
async function preloadAllStoryboardImages(frames) {
    if (!frames || frames.length === 0) return;
    
    const preloads = frames.map(frame => {
        return new Promise((resolve) => {
            if (!frame.image_url || frame.image_url.length < 5) {
                resolve();
                return;
            }
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = frame.image_url;
            
            // Timeout an toàn
            setTimeout(() => resolve(), 8000);
        });
    });
    
    await Promise.all(preloads);
}

// SINH ẢNH LẠI CHO 1 KHUNG HÌNH RIÊNG LẺ
window.generateSingleFrameImage = async function(frameNumber) {
    const frame = studioState.frames.find(f => f.frame_number === frameNumber);
    if (!frame) return;

    const style = document.getElementById("sb-style")?.value || "Cinematic";
    const btn = document.getElementById(`btn-gen-img-${frameNumber}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang vẽ...`;
    }

    try {
        const res = await fetch("/api/generate-frame-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                frame_number: frameNumber,
                visual_prompt: frame.visual_prompt,
                style: style,
                continuity_notes: frame.continuity_notes
            })
        });

        if (!res.ok) throw new Error("Lỗi khi tạo ảnh");
        const data = await res.json();

        frame.image_url = data.image_url;
        renderFrames(studioState.frames);
        showToast(`Đã tạo lại ảnh cho Khung #${frameNumber}!`, "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-rotate-right mr-1"></i> Vẽ lại`;
        }
    }
};

// RENDER GIAO DIỆN KHUNG HÌNH STORYBOARD (HOÀN TOÀN ẨN PHẦN PROMPT)
function renderFrames(frames) {
    const emptyState = document.getElementById("sb-empty-state");
    const resultsContainer = document.getElementById("sb-results-container");
    const framesGrid = document.getElementById("sb-frames-grid");

    if (emptyState) emptyState.classList.add("hidden");
    if (resultsContainer) resultsContainer.classList.remove("hidden");

    const title = studioState.directorOutput ? studioState.directorOutput.title : "Storyboard Kịch Bản";
    const storyType = studioState.directorOutput ? studioState.directorOutput.story_type : "Kịch bản";
    
    document.getElementById("sb-res-title").textContent = title;
    document.getElementById("sb-res-badge-type").textContent = storyType;
    document.getElementById("sb-res-badge-frames").textContent = `${frames.length} Khung hình`;

    framesGrid.innerHTML = frames.map((frame) => {
        const hasImage = frame.image_url && frame.image_url.length > 5;
        const imageContent = hasImage ? `
            <div class="relative group aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-sm">
                <img src="${frame.image_url}" alt="Khung ${frame.frame_number}"
                    class="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    onerror="handleStoryboardImageError(this, ${frame.frame_number})" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3 justify-between">
                    <span class="text-[10px] text-white font-mono bg-black/80 px-2 py-0.5 rounded border border-white/20">Khung #${frame.frame_number}</span>
                    <a href="${frame.image_url}" target="_blank" download="frame_${frame.frame_number}.png" class="text-xs text-white bg-white/20 hover:bg-white/40 p-1.5 rounded-lg transition" title="Tải ảnh">
                        <i class="fa-solid fa-expand"></i>
                    </a>
                </div>
            </div>
        ` : `
            <div class="aspect-video rounded-2xl bg-[#1d1d1f] border border-dashed border-white/15 flex flex-col items-center justify-center text-center p-4">
                <i class="fa-solid fa-image text-[#6e6e73] text-3xl mb-2"></i>
                <span class="text-xs text-[#86868b] font-medium">Chưa có hình ảnh</span>
                <button type="button" onclick="generateSingleFrameImage(${frame.frame_number})" id="btn-gen-img-${frame.frame_number}"
                    class="mt-3 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer">
                    <i class="fa-solid fa-paintbrush text-[10px] text-[#2997ff]"></i> Tạo ảnh phân cảnh
                </button>
            </div>
        `;

        return `
            <div class="apple-bento p-6 space-y-4">
                
                <!-- Frame Header -->
                <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                    <div class="flex items-center gap-3">
                        <span class="w-7 h-7 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            #${frame.frame_number}
                        </span>
                        <div>
                            <span class="text-[10px] font-mono font-medium text-[#86868b] uppercase tracking-wider block">Phân đoạn ${frame.scene_number}: ${escapeHtml(frame.scene_title || '')}</span>
                            <h3 class="text-sm font-semibold text-white">${escapeHtml(frame.shot_type || 'Shot')} • <span class="text-[#86868b] font-normal">${escapeHtml(frame.camera_movement || 'Tĩnh')}</span></h3>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.06] text-[#f5f5f7] font-mono border border-white/10">Góc: ${escapeHtml(frame.camera_angle || 'Eye-level')}</span>
                        ${hasImage ? `
                            <button type="button" onclick="generateSingleFrameImage(${frame.frame_number})" id="btn-gen-img-${frame.frame_number}"
                                class="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1 font-medium cursor-pointer">
                                <i class="fa-solid fa-rotate-right text-[10px]"></i> Vẽ lại
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- 2-Columns: Image Preview vs Cinematography Details -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    <!-- Image Preview (5 Cols) -->
                    <div class="md:col-span-5">
                        ${imageContent}
                    </div>

                    <!-- Details & Continuity (7 Cols) -->
                    <div class="md:col-span-7 space-y-3">
                        
                        <!-- Action Description -->
                        <div>
                            <div class="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">
                                <i class="fa-solid fa-clapperboard text-[#2997ff] mr-1"></i> Diễn biến & Hành động nhân vật:
                            </div>
                            <p class="text-xs text-[#f5f5f7] leading-relaxed bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
                                ${escapeHtml(frame.action_description)}
                            </p>
                        </div>

                        <!-- Continuity Notes -->
                        ${frame.continuity_notes ? `
                            <div>
                                <div class="text-[10px] font-semibold text-[#30d158] uppercase tracking-wider mb-1">
                                    <i class="fa-solid fa-link text-[#30d158] mr-1"></i> Tính liên tục (Continuity):
                                </div>
                                <p class="text-[11px] text-[#30d158] bg-[#30d158]/10 p-3 rounded-2xl border border-[#30d158]/20">
                                    ${escapeHtml(frame.continuity_notes)}
                                </p>
                            </div>
                        ` : ''}

                    </div>

                </div>

            </div>
        `;
    }).join("");
}

// Helpers
function updateStepIndicators(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`step-ind-${i}`);
        if (!ind) continue;
        if (i === activeStep) {
            ind.className = "flex items-center gap-3.5 p-4 rounded-2xl bg-white border-2 border-indigo-600 text-slate-950 shadow-sm transition-all";
            ind.querySelector("div:first-child").className = "w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0";
        } else if (i < activeStep) {
            ind.className = "flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 transition-all";
            ind.querySelector("div:first-child").className = "w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0";
        } else {
            ind.className = "flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 transition-all";
            ind.querySelector("div:first-child").className = "w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs flex-shrink-0";
        }
    }
}

function setLoading(isLoading, title = "Đang xử lý...", desc = "Vui lòng đợi giây lát.") {
    const banner = document.getElementById("sb-loading-banner");
    const titleEl = document.getElementById("sb-loading-title");
    const descEl = document.getElementById("sb-loading-desc");

    if (isLoading) {
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (banner) banner.classList.remove("hidden");
    } else {
        if (banner) banner.classList.add("hidden");
    }
}

function downloadStoryboardJson() {
    const cleanOutput = {
        title: studioState.directorOutput?.title || "Storyboard",
        story_type: studioState.directorOutput?.story_type || "short",
        frames: (studioState.frames || []).map(f => ({
            frame_number: f.frame_number,
            scene_number: f.scene_number,
            scene_title: f.scene_title,
            shot_type: f.shot_type,
            camera_angle: f.camera_angle,
            camera_movement: f.camera_movement,
            action_description: f.action_description,
            continuity_notes: f.continuity_notes,
            image_url: f.image_url
        }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanOutput, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "storyboard_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Đã tải xuống file Storyboard JSON!", "success");
}

function saveToGalleryArchive() {
    if (!studioState.directorOutput && (!studioState.frames || studioState.frames.length === 0)) {
        showToast("Chưa có dữ liệu Storyboard để lưu vào kho!", "warning");
        return;
    }

    const title = studioState.directorOutput?.title || "Dự án Storyboard " + new Date().toLocaleDateString('vi-VN');
    const style = document.getElementById("sb-style")?.value || "Cinematic";
    const type = document.getElementById("sb-story-type")?.value === "long" ? "Truyện dài" : "Truyện ngắn";
    const prompt = document.getElementById("sb-story-prompt")?.value || "";

    const newProject = {
        id: "proj_" + Date.now(),
        title: title,
        style: style,
        type: type,
        summary: prompt,
        cover_image: studioState.frames.find(f => f.image_url)?.image_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
        frames_count: studioState.frames.length,
        created_at: new Date().toISOString().split('T')[0],
        frames: studioState.frames
    };

    try {
        const stored = JSON.parse(localStorage.getItem("saved_storyboard_projects") || "[]");
        stored.unshift(newProject);
        localStorage.setItem("saved_storyboard_projects", JSON.stringify(stored));
        showToast("Đã lưu dự án thành công vào Kho Lưu Trữ!", "success");
    } catch (e) {
        console.error("Lỗi lưu gallery:", e);
        showToast("Không thể lưu vào bộ nhớ trình duyệt.", "error");
    }
}

function showToast(msg, type = "info") {
    const toast = document.createElement("div");
    let bg = "bg-white border-zinc-200 text-zinc-900";
    let icon = '<i class="fa-solid fa-circle-info text-zinc-500"></i>';

    if (type === "success") {
        bg = "bg-white border-zinc-200 text-zinc-900";
        icon = '<i class="fa-solid fa-circle-check text-emerald-600"></i>';
    } else if (type === "warning") {
        bg = "bg-white border-amber-200 text-amber-900";
        icon = '<i class="fa-solid fa-triangle-exclamation text-amber-600"></i>';
    } else if (type === "error") {
        bg = "bg-white border-red-200 text-red-900";
        icon = '<i class="fa-solid fa-circle-xmark text-red-600"></i>';
    }

    toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 ${bg}`;
    toast.innerHTML = `
        ${icon}
        <span class="text-xs sm:text-sm font-medium">${msg}</span>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.remove("translate-y-4", "opacity-0"); });
    setTimeout(() => {
        toast.classList.add("translate-y-4", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.handleStoryboardImageError = function(img, frameNumber) {
    img.onerror = null;
    const parentContainer = img.closest('.group');
    if (parentContainer) {
        parentContainer.innerHTML = `
            <div class="aspect-video rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 flex flex-col items-center justify-center text-center p-4">
                <i class="fa-solid fa-image text-zinc-300 text-2xl mb-1"></i>
                <span class="text-[11px] text-zinc-500 font-medium">Đang xử lý ảnh...</span>
                <button type="button" onclick="generateSingleFrameImage(${frameNumber})" id="btn-gen-img-${frameNumber}"
                    class="mt-2 px-3 py-1 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 text-black border border-zinc-200 transition flex items-center gap-1 shadow-2xs cursor-pointer">
                    <i class="fa-solid fa-rotate-right text-[10px]"></i> Thử vẽ lại
                </button>
            </div>
        `;
    }
};
