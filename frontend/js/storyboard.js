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

// CHẠY TỰ ĐỘNG TOÀN BỘ 3 BƯỚC THEO CƠ CHẾ STREAMING ĐA WORKER CLONE QWEN 3 PRO
async function handleRunFullAutoPipeline() {
    const prompt = document.getElementById("sb-story-prompt")?.value.trim();
    const storyType = document.getElementById("sb-story-type")?.value || "short";
    const style = document.getElementById("sb-style")?.value || "Cinematic";

    if (!prompt || prompt.length < 3) {
        showToast("Vui lòng nhập ý tưởng câu chuyện!", "warning");
        document.getElementById("sb-story-prompt")?.focus();
        return;
    }

    // 1. Tạo Storyboard trực tiếp phục vụ nghiên cứu & học tập (Không giới hạn)

    const btn = document.getElementById("btn-create-storyboard");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang Tạo Storyboard...`;
    }

    setLoading(true, "Khởi động Multi-Agent Pipeline...", "Đang kết nối Đạo Diễn, Bóc Tách Phân Cảnh và các clone Qwen 3 Pro...");
    updateStepIndicators(1);

    // Khởi chạy Mini Game giải trí
    if (typeof startWaitingMiniGame === "function") {
        startWaitingMiniGame();
    }

    try {
        const response = await fetch("/api/pipeline/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                story: prompt,
                story_type: storyType,
                style: style,
                generate_images: true
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Lỗi máy chủ (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const messages = buffer.split("\n\n");
            buffer = messages.pop() || ""; // Giữ lại phần chưa hoàn chỉnh

            for (const rawMsg of messages) {
                if (!rawMsg.trim()) continue;
                parseAndHandleSSE(rawMsg);
            }
        }

        if (buffer.trim()) {
            parseAndHandleSSE(buffer);
        }

    } catch (err) {
        console.error("Lỗi full streaming pipeline:", err);
        showToast(err.message || "Xảy ra lỗi khi tạo Storyboard", "error");
    } finally {
        if (typeof stopWaitingMiniGame === "function") {
            stopWaitingMiniGame();
        }
        setLoading(false);
        if (studioState.frames) {
            studioState.frames.forEach(f => {
                if (f.is_rendering) {
                    f.is_rendering = false;
                    const slot = document.getElementById(`frame-img-slot-${f.frame_number}`);
                    if (slot && !f.image_url) {
                        slot.innerHTML = renderFrameImageSlot(f);
                    }
                }
            });
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-amber-300 mr-2"></i> <span>Tạo Storyboard</span>`;
        }
    }
}

// Bóc tách gói tin SSE và điều phối Event
function parseAndHandleSSE(rawMsg) {
    const lines = rawMsg.split("\n");
    let eventName = "message";
    let dataStr = "";

    for (const line of lines) {
        if (line.startsWith("event:")) {
            eventName = line.substring(6).trim();
        } else if (line.startsWith("data:")) {
            dataStr = line.substring(5).trim();
        }
    }

    if (!dataStr) return;

    try {
        const data = JSON.parse(dataStr);
        handleStreamEvent(eventName, data);
    } catch (e) {
        console.warn("Lỗi parse SSE JSON:", e, dataStr);
    }
}

// Xử lý từng Event nhận từ Backend theo thời gian thực
function handleStreamEvent(eventName, data) {
    switch (eventName) {
        case "step":
            handleStepEvent(data);
            break;

        case "director_complete":
            studioState.directorOutput = data;
            break;

        case "breakdown_complete":
            handleBreakdownComplete(data);
            break;

        case "frame_ready":
            handleFrameReady(data);
            break;

        case "complete":
            handlePipelineComplete(data);
            break;

        case "error":
            showToast(data.detail || "Có lỗi trong quá trình xử lý!", "error");
            setLoading(false);
            if (studioState.frames) {
                studioState.frames.forEach(f => {
                    if (f.is_rendering) {
                        f.is_rendering = false;
                        const slot = document.getElementById(`frame-img-slot-${f.frame_number}`);
                        if (slot && !f.image_url) {
                            slot.innerHTML = renderFrameImageSlot(f);
                        }
                    }
                });
            }
            break;

        default:
            break;
    }
}

function handleStepEvent(data) {
    const stepNum = data.step || 1;
    updateStepIndicators(stepNum);

    const step1 = document.getElementById("sb-prog-step-1");
    const step2 = document.getElementById("sb-prog-step-2");
    const step3 = document.getElementById("sb-prog-step-3");

    if (stepNum === 1) {
        if (step1) step1.className = "flex items-center gap-2 text-white text-xs font-semibold animate-pulse";
        if (step2) step2.className = "flex items-center gap-2 text-[#6e6e73] text-xs";
        if (step3) step3.className = "flex items-center gap-2 text-[#6e6e73] text-xs";
        setLoading(true, "Giai đoạn 1: Đạo diễn kịch bản", data.message || "Đang thiết lập cấu trúc và hồi truyện...");
    } else if (stepNum === 2) {
        if (step1) step1.className = "flex items-center gap-2 text-[#30d158] text-xs font-semibold";
        if (step2) step2.className = "flex items-center gap-2 text-white text-xs font-semibold animate-pulse";
        if (step3) step3.className = "flex items-center gap-2 text-[#6e6e73] text-xs";
        setLoading(true, "Giai đoạn 2: Bóc tách góc máy & Cỡ cảnh", data.message || "Đang chia khung hình và tính nhất quán...");
    } else if (stepNum === 3) {
        if (step1) step1.className = "flex items-center gap-2 text-[#30d158] text-xs font-semibold";
        if (step2) step2.className = "flex items-center gap-2 text-[#30d158] text-xs font-semibold";
        if (step3) step3.className = "flex items-center gap-2 text-white text-xs font-semibold animate-pulse";
        setLoading(true, "Giai đoạn 3: Khởi chạy các clone Qwen 3 Pro", data.message || "Đang render đồng thời tất cả các khung hình...");
    }
}

function handleBreakdownComplete(data) {
    studioState.directorOutput = data.director;
    studioState.breakdownOutput = data.breakdown;
    
    // Đánh dấu toàn bộ frames là đang chờ render song song
    studioState.frames = (data.frames || []).map(f => ({
        ...f,
        is_rendering: true,
        image_url: null
    }));

    // Hiển thị ngay toàn bộ dàn khung hình lên màn hình
    renderFrames(studioState.frames);

    // Kích hoạt badge tiến độ streaming song song
    const streamBadge = document.getElementById("sb-res-badge-streaming");
    const streamCount = document.getElementById("sb-streaming-count");
    if (streamBadge) streamBadge.classList.remove("hidden");
    if (streamCount) streamCount.textContent = `Song song: 0/${studioState.frames.length} khung`;

    // Cuộn nhẹ tới vùng kết quả
    document.getElementById("sb-results-container")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Đã bóc tách xong ${studioState.frames.length} khung hình! Đang khởi động các clone Qwen 3 Pro song song...`, "info");
}

function handleFrameReady(data) {
    // data: { frame_number, image_url, model_used, completed_count, total_count }
    const fNum = data.frame_number;
    const targetFrame = studioState.frames.find(f => f.frame_number === fNum);
    if (targetFrame) {
        targetFrame.image_url = data.image_url;
        targetFrame.is_rendering = false;
        targetFrame.model_used = data.model_used;
    }

    // Cập nhật slot ảnh trực tiếp trên DOM với hiệu ứng mượt mà
    updateSingleFrameDomSlot(fNum, data.image_url);

    // Cập nhật số lượng hoàn thành
    const streamCount = document.getElementById("sb-streaming-count");
    if (streamCount) {
        streamCount.textContent = `Đã vẽ: ${data.completed_count}/${data.total_count} khung`;
    }

    const descEl = document.getElementById("sb-loading-desc");
    if (descEl) {
        descEl.textContent = `Các clone Qwen 3 Pro đã hoàn thành ${data.completed_count}/${data.total_count} khung hình...`;
    }
}

function handlePipelineComplete(data) {
    if (data.frames && data.frames.length > 0) {
        studioState.frames = data.frames.map(f => ({
            ...f,
            is_rendering: false
        }));
    }

    updateStepIndicators(3);
    setLoading(false);
    if (typeof stopWaitingMiniGame === "function") {
        stopWaitingMiniGame();
    }

    const streamBadge = document.getElementById("sb-res-badge-streaming");
    const streamCount = document.getElementById("sb-streaming-count");
    if (streamBadge) streamBadge.classList.remove("hidden");
    if (streamCount) {
        streamCount.innerHTML = `<i class="fa-solid fa-circle-check text-[#30d158] mr-1"></i> Hoàn thành 100%`;
    }

    // Đảm bảo tất cả frame hiển thị đúng
    studioState.frames.forEach(f => {
        if (f.image_url) {
            updateSingleFrameDomSlot(f.frame_number, f.image_url);
        }
    });

    showToast("Toàn bộ chuỗi ảnh Storyboard đã hoàn tất siêu tốc bằng các clone Qwen 3 Pro!", "success");
}

// Cập nhật DOM của 1 khung hình riêng lẻ ngay lập tức mà không render lại cả trang
function updateSingleFrameDomSlot(frameNumber, imageUrl) {
    const slot = document.getElementById(`frame-img-slot-${frameNumber}`);
    if (slot) {
        slot.innerHTML = `
            <div class="relative group aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-sm transition-all duration-500 animate-appleFadeIn">
                <img src="${imageUrl}" alt="Khung ${frameNumber}"
                    class="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    onerror="handleStoryboardImageError(this, ${frameNumber})" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3 justify-between">
                    <span class="text-[10px] text-white font-mono bg-black/80 px-2 py-0.5 rounded border border-white/20">Khung #${frameNumber}</span>
                    <a href="${imageUrl}" target="_blank" download="frame_${frameNumber}.png" class="text-xs text-white bg-white/20 hover:bg-white/40 p-1.5 rounded-lg transition" title="Tải ảnh">
                        <i class="fa-solid fa-expand"></i>
                    </a>
                </div>
            </div>
        `;
    }

    // Cập nhật nút vẽ lại ở header của frame
    const actionSlot = document.getElementById(`frame-action-btn-${frameNumber}`);
    if (actionSlot) {
        actionSlot.innerHTML = `
            <button type="button" onclick="generateSingleFrameImage(${frameNumber})" id="btn-gen-img-${frameNumber}"
                class="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1 font-medium cursor-pointer">
                <i class="fa-solid fa-rotate-right text-[10px]"></i> Vẽ lại
            </button>
        `;
    }
}

// Trả về HTML cho slot ảnh (Có 3 trạng thái: Đã có ảnh / Đang vẽ song song / Chưa có)
function renderFrameImageSlot(frame) {
    const hasImage = frame.image_url && frame.image_url.length > 5;
    
    if (hasImage) {
        return `
            <div class="relative group aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-sm transition-all duration-500">
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
        `;
    }

    if (frame.is_rendering) {
        return `
            <div class="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#1c1c1e] to-[#0d0d10] border border-indigo-500/30 flex flex-col items-center justify-center text-center p-4 shadow-inner">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-pulse"></div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center mb-2.5 shadow-lg shadow-indigo-500/20">
                        <i class="fa-solid fa-wand-magic-sparkles text-indigo-400 text-sm animate-spin"></i>
                    </div>
                    <span class="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                        Clone Qwen 3 Pro #${frame.frame_number}
                    </span>
                    <span class="text-[11px] font-mono text-indigo-300/80 mt-1 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span> Đang kết xuất song song...
                    </span>
                </div>
            </div>
        `;
    }

    return `
        <div class="aspect-video rounded-2xl bg-[#1d1d1f] border border-dashed border-white/15 flex flex-col items-center justify-center text-center p-4">
            <i class="fa-solid fa-image text-[#6e6e73] text-3xl mb-2"></i>
            <span class="text-xs text-[#86868b] font-medium">Chưa có hình ảnh</span>
            <button type="button" onclick="generateSingleFrameImage(${frame.frame_number})" id="btn-gen-img-${frame.frame_number}"
                class="mt-3 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-paintbrush text-[10px] text-[#2997ff]"></i> Tạo ảnh phân cảnh
            </button>
        </div>
    `;
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
        updateSingleFrameDomSlot(frameNumber, data.image_url);
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

// RENDER GIAO DIỆN KHUNG HÌNH STORYBOARD
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
        const imageContent = renderFrameImageSlot(frame);

        return `
            <div class="apple-bento p-6 space-y-4" id="frame-card-${frame.frame_number}">
                
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
                        <div id="frame-action-btn-${frame.frame_number}">
                            ${hasImage ? `
                                <button type="button" onclick="generateSingleFrameImage(${frame.frame_number})" id="btn-gen-img-${frame.frame_number}"
                                    class="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition flex items-center gap-1 font-medium cursor-pointer">
                                    <i class="fa-solid fa-rotate-right text-[10px]"></i> Vẽ lại
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- 2-Columns: Image Preview vs Cinematography Details -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    <!-- Image Preview (5 Cols) -->
                    <div class="md:col-span-5" id="frame-img-slot-${frame.frame_number}">
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
    if (str === null || str === undefined) return "";
    return String(str)
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
