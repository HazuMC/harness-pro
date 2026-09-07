// test_director.js - Logic cho trang Test Đạo Diễn Kịch Bản (White Studio Theme)

document.addEventListener("DOMContentLoaded", () => {
    initTestPage();
});

const PRESETS = [
    {
        title: "Cyberpunk Sài Gòn 2099",
        type: "short",
        style: "Cyberpunk",
        prompt: "Một nữ thám tử trẻ với cánh tay robot nhận được chiếc thẻ nhớ chứa bí mật về tập đoàn năng lượng ngầm tại khu chợ đêm nổi Sài Gòn năm 2099, nơi ánh đèn neon phản chiếu trên mặt nước mưa."
    },
    {
        title: "Cậu Bé & Chú Rồng Sấm Sét",
        type: "short",
        style: "3D Pixar",
        prompt: "Một cậu bé mồ côi sống trên ngọn núi tuyết tình cờ nhặt được một quả trứng phát sáng, nở ra chú rồng sấm sét tí hon và cùng nhau bảo vệ ngôi làng khỏi cơn bão tuyết quái ác."
    },
    {
        title: "Truyền Thuyết Sơn Tinh - Phong Cách Hiện Đại",
        type: "long",
        style: "Cinematic",
        prompt: "Cuộc đối đầu kinh điển giữa Sơn Tinh - vị thần điều khiển đất đá và Thủy Tinh - chúa tể đại dương để giành lấy bảo vật cổ xưa gìn giữ sự cân bằng của đất trời."
    },
    {
        title: "Thám Tử Điều Tra Dòng Thời Gian",
        type: "long",
        style: "Dark Fantasy",
        prompt: "Một thám tử có khả năng nhìn thấy ký ức 5 phút trước của đồ vật đang điều tra một vụ án mất tích bí ẩn tại thư viện cổ chứa những cuốn sách thời gian."
    },
    {
        title: "Học Viện Phép Thuật Tinh Tú",
        type: "short",
        style: "Anime",
        prompt: "Một cô gái không có phép thuật bất ngờ đánh thức chòm sao cổ đại trong ngày thi tuyển sinh của học viện phép thuật danh giá nhất vương quốc."
    }
];

let currentStoryData = null;
let activeTab = "grid"; // 'grid' | 'script' | 'json'
let startTime = 0;
let timerInterval = null;

function initTestPage() {
    checkBackendHealth();
    bindEvents();
    renderPresets();
    setupCharacterCounter();
}

// 1. Kiểm tra trạng thái Hệ thống
async function checkBackendHealth() {
    const statusBadge = document.getElementById("backend-status-badge");
    const statusText = document.getElementById("backend-status-text");
    const statusDot = document.getElementById("backend-status-dot");

    try {
        const res = await fetch("/api/health");
        if (res.ok) {
            const data = await res.json();
            if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
            if (statusBadge) statusBadge.className = "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-50 border border-zinc-200 text-zinc-700 shadow-2xs";
            if (statusText) statusText.textContent = "Hệ thống: Sẵn sàng (Online)";
        } else {
            throw new Error("HTTP " + res.status);
        }
    } catch (err) {
        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-red-500";
        if (statusBadge) statusBadge.className = "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700 shadow-2xs";
        if (statusText) statusText.textContent = "Hệ thống: Chưa kết nối (Offline)";
    }
}

// 2. Gán các sự kiện giao diện
function bindEvents() {
    // Nút Gửi phân tích
    const btnSubmit = document.getElementById("btn-generate-story");
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleGenerateStory);
    }

    // Nút Ngẫu nhiên ý tưởng
    const btnRandom = document.getElementById("btn-random-preset");
    if (btnRandom) {
        btnRandom.addEventListener("click", () => {
            const randomIndex = Math.floor(Math.random() * PRESETS.length);
            applyPreset(PRESETS[randomIndex]);
        });
    }

    // Nút Xóa form
    const btnClear = document.getElementById("btn-clear-form");
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            const input = document.getElementById("story-prompt-input");
            if (input) input.value = "";
            const count = document.getElementById("char-count");
            if (count) count.textContent = "0";
        });
    }

    // Chuyển Tab xem kết quả
    const tabBtns = document.querySelectorAll("[data-view-tab]");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabName = btn.getAttribute("data-view-tab");
            switchTab(tabName);
        });
    });

    // Nút Copy toàn bộ Visual Prompts
    const btnCopyAll = document.getElementById("btn-copy-all-prompts");
    if (btnCopyAll) {
        btnCopyAll.addEventListener("click", copyAllVisualPrompts);
    }

    // Nút Tải file JSON
    const btnDownloadJson = document.getElementById("btn-download-json");
    if (btnDownloadJson) {
        btnDownloadJson.addEventListener("click", downloadJsonFile);
    }

    // Nút Sao chép JSON
    const btnCopyJson = document.getElementById("btn-copy-raw-json");
    if (btnCopyJson) {
        btnCopyJson.addEventListener("click", copyRawJson);
    }

    // Nút Tiếp tục tạo Storyboard
    const btnForward = document.getElementById("btn-forward-to-storyboard");
    if (btnForward) {
        btnForward.addEventListener("click", forwardToStoryboardStudio);
    }
}

function forwardToStoryboardStudio() {
    if (!currentStoryData) {
        showNotification("Vui lòng phân tích kịch bản trước khi chuyển tiếp!", "warning");
        return;
    }
    sessionStorage.setItem("imported_director_story", JSON.stringify(currentStoryData));
    showNotification("Đang chuyển kịch bản sang Storyboard Studio...", "success");
    setTimeout(() => {
        window.location.href = "/storyboard";
    }, 400);
}

// 3. Render danh sách mẫu ý tưởng nhanh
function renderPresets() {
    const container = document.getElementById("preset-container");
    if (!container) return;

    container.innerHTML = PRESETS.map((p, idx) => `
        <button type="button" onclick="selectPresetByIndex(${idx})"
            class="text-left p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all duration-200 group">
            <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-xs font-bold text-zinc-900 group-hover:text-black line-clamp-1">${p.title}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-700 font-mono">${p.style}</span>
            </div>
            <p class="text-[11px] text-zinc-500 line-clamp-1">${p.prompt}</p>
        </button>
    `).join("");
}

window.selectPresetByIndex = function(idx) {
    if (PRESETS[idx]) {
        applyPreset(PRESETS[idx]);
    }
};

function applyPreset(preset) {
    const input = document.getElementById("story-prompt-input");
    const styleSelect = document.getElementById("style-select");
    const radios = document.querySelectorAll('input[name="story_type"]');

    if (input) {
        input.value = preset.prompt;
        updateCharCount(preset.prompt.length);
    }

    if (styleSelect) {
        styleSelect.value = preset.style;
    }

    radios.forEach(radio => {
        if (radio.value === preset.type) {
            radio.checked = true;
        }
    });

    showNotification(`Đã áp dụng mẫu: "${preset.title}"`, "info");
}

function setupCharacterCounter() {
    const input = document.getElementById("story-prompt-input");
    if (!input) return;

    input.addEventListener("input", (e) => {
        updateCharCount(e.target.value.length);
    });
}

function updateCharCount(count) {
    const countEl = document.getElementById("char-count");
    if (countEl) {
        countEl.textContent = count;
        if (count > 200) {
            countEl.className = "text-zinc-900 font-bold";
        } else {
            countEl.className = "text-zinc-400";
        }
    }
}

// 4. Xử lý gọi API Phân tích Kịch bản
async function handleGenerateStory() {
    const input = document.getElementById("story-prompt-input");
    const promptText = input ? input.value.trim() : "";
    const styleSelect = document.getElementById("style-select");
    const selectedStyle = styleSelect ? styleSelect.value : "Cinematic";
    const selectedType = document.querySelector('input[name="story_type"]:checked')?.value || "short";

    if (!promptText || promptText.length < 3) {
        showNotification("Vui lòng nhập ý tưởng câu chuyện (tối thiểu 3 ký tự)!", "warning");
        if (input) input.focus();
        return;
    }

    // Set UI sang trạng thái Loading
    setLoadingState(true);
    startElapsedTimer();

    try {
        const response = await fetch("/makestory", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                story: promptText,
                story_type: selectedType,
                style: selectedStyle
            })
        });

        const elapsedSeconds = stopElapsedTimer();

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Lỗi máy chủ (${response.status})`);
        }

        const resData = await response.json();
        
        if (!resData.data) {
            throw new Error("Không nhận được dữ liệu kịch bản hợp lệ từ máy chủ.");
        }

        currentStoryData = resData.data;
        renderResults(currentStoryData, elapsedSeconds);
        showNotification("Phân tích kịch bản thành công!", "success");

    } catch (err) {
        stopElapsedTimer();
        console.error("Lỗi khi tạo kịch bản:", err);
        renderErrorState(err.message || "Xảy ra lỗi không xác định.");
        showNotification(err.message || "Lỗi tạo kịch bản", "error");
    } finally {
        setLoadingState(false);
    }
}

function startElapsedTimer() {
    startTime = Date.now();
    const timerEl = document.getElementById("elapsed-timer");
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const diff = ((Date.now() - startTime) / 1000).toFixed(1);
        if (timerEl) timerEl.textContent = `${diff}s`;
    }, 100);
}

function stopElapsedTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    return elapsed;
}

function setLoadingState(isLoading) {
    const btn = document.getElementById("btn-generate-story");
    const loadingBanner = document.getElementById("loading-progress-banner");
    const emptyState = document.getElementById("empty-results-state");
    const resultsContainer = document.getElementById("results-dashboard");
    const errorState = document.getElementById("error-results-state");

    if (isLoading) {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang phân tích kịch bản...`;
        }
        if (loadingBanner) loadingBanner.classList.remove("hidden");
        if (emptyState) emptyState.classList.add("hidden");
        if (resultsContainer) resultsContainer.classList.add("hidden");
        if (errorState) errorState.classList.add("hidden");

        simulateProgressSteps();
    } else {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-clapperboard mr-2"></i> Bắt đầu phân tích & Tạo kịch bản`;
        }
        if (loadingBanner) loadingBanner.classList.add("hidden");
    }
}

function simulateProgressSteps() {
    const step1 = document.getElementById("prog-step-1");
    const step2 = document.getElementById("prog-step-2");
    const step3 = document.getElementById("prog-step-3");

    if (step1) step1.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    if (step2) step2.className = "flex items-center gap-2 text-zinc-400 text-xs";
    if (step3) step3.className = "flex items-center gap-2 text-zinc-400 text-xs";

    setTimeout(() => {
        if (step1) step1.className = "flex items-center gap-2 text-emerald-600 text-xs font-semibold";
        if (step2) step2.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    }, 1500);

    setTimeout(() => {
        if (step2) step2.className = "flex items-center gap-2 text-emerald-600 text-xs font-semibold";
        if (step3) step3.className = "flex items-center gap-2 text-black text-xs font-semibold animate-pulse";
    }, 3200);
}

// 5. Render kết quả kịch bản
function renderResults(data, elapsedSeconds) {
    const resultsContainer = document.getElementById("results-dashboard");
    const emptyState = document.getElementById("empty-results-state");
    const errorState = document.getElementById("error-results-state");

    if (emptyState) emptyState.classList.add("hidden");
    if (errorState) errorState.classList.add("hidden");
    if (resultsContainer) resultsContainer.classList.remove("hidden");

    // Header thông số
    const titleEl = document.getElementById("res-title");
    if (titleEl) titleEl.textContent = data.title || "Kịch bản Phân cảnh";
    
    const typeBadge = document.getElementById("res-type-badge");
    if (typeBadge) typeBadge.textContent = data.story_type || "Kịch bản";
    
    const countBadge = document.getElementById("res-scene-count");
    if (countBadge) countBadge.textContent = `${data.scenes ? data.scenes.length : 0} phân cảnh`;
    
    const timeBadge = document.getElementById("res-time-badge");
    if (timeBadge) timeBadge.textContent = `Thời gian xử lý: ${elapsedSeconds}s`;

    // Render 3 Views
    renderGridView(data.scenes);
    renderScriptView(data);
    renderJsonView(data);

    // Cuộn nhẹ xuống xem kết quả
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderErrorState(message) {
    const errorState = document.getElementById("error-results-state");
    const emptyState = document.getElementById("empty-results-state");
    const resultsContainer = document.getElementById("results-dashboard");

    if (emptyState) emptyState.classList.add("hidden");
    if (resultsContainer) resultsContainer.classList.add("hidden");
    if (errorState) {
        errorState.classList.remove("hidden");
        const msgText = document.getElementById("error-message-text");
        if (msgText) msgText.textContent = message;
    }
}

// View 1: Grid Storyboard Cards
function renderGridView(scenes) {
    const container = document.getElementById("view-grid-content");
    if (!container) return;

    if (!scenes || scenes.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-zinc-500">Không có phân cảnh nào được trả về.</div>`;
        return;
    }

    container.innerHTML = scenes.map((scene, idx) => `
        <div class="scene-card bg-white border border-zinc-200 hover:border-zinc-400 rounded-3xl p-6 shadow-sm transition-all duration-300 flex flex-col justify-between group">
            <div>
                <!-- Scene Header -->
                <div class="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-xl bg-black text-white font-extrabold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            #${scene.scene_number || idx + 1}
                        </span>
                        <div>
                            <span class="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Phân đoạn ${scene.scene_number || idx + 1}</span>
                            <h4 class="text-base font-bold text-zinc-900">${escapeHtml(scene.title || `Phân cảnh ${scene.scene_number || idx + 1}`)}</h4>
                        </div>
                    </div>
                    <span class="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 flex-shrink-0 font-medium">
                        <i class="fa-solid fa-clapperboard text-zinc-500 text-[10px]"></i> Đạo diễn
                    </span>
                </div>

                <!-- Scene Description (Nội dung diễn biến) -->
                <div class="mb-4">
                    <div class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <i class="fa-solid fa-align-left text-zinc-400"></i> Diễn biến cốt truyện
                    </div>
                    <p class="text-sm text-zinc-800 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                        ${escapeHtml(scene.description)}
                    </p>
                </div>

                <!-- Visual Prompt -->
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-1.5">
                        <div class="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-palette text-zinc-500"></i> Visual Prompt (Dành cho Storyboard)
                        </div>
                        <button type="button" onclick="copyScenePrompt(${idx})"
                            class="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all flex items-center gap-1.5 font-medium"
                            id="btn-copy-scene-${idx}">
                            <i class="fa-regular fa-copy text-zinc-500"></i> Sao chép
                        </button>
                    </div>
                    <div class="text-xs text-zinc-800 font-mono bg-zinc-50 p-4 rounded-2xl border border-zinc-200 leading-relaxed select-all">
                        ${escapeHtml(scene.visual_prompt)}
                    </div>
                </div>
            </div>

            <!-- Card Footer Quick Action -->
            <div class="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span class="text-[11px] text-zinc-400 font-mono">Độ dài: ${scene.visual_prompt ? scene.visual_prompt.length : 0} ký tự</span>
                <span class="text-[11px] text-zinc-600 font-medium">Giai đoạn 1: Đạo Diễn Kịch Bản</span>
            </div>
        </div>
    `).join("");
}

// View 2: Kịch bản Điện ảnh (Screenplay Format)
function renderScriptView(data) {
    const container = document.getElementById("view-script-content");
    if (!container) return;

    const scenes = data.scenes || [];
    let scriptHtml = `
        <div class="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <!-- Screenplay Title Header -->
            <div class="text-center pb-6 mb-6 border-b border-zinc-100">
                <span class="text-xs font-bold uppercase tracking-widest text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">KỊCH BẢN PHÂN CẢNH ĐẠO DIỄN</span>
                <h2 class="text-2xl sm:text-3xl font-black text-black mt-3">${escapeHtml(data.title || "Kịch bản")}</h2>
                <div class="flex items-center justify-center gap-4 text-xs text-zinc-500 mt-2 font-mono">
                    <span>Thể loại: <b class="text-zinc-900">${data.story_type}</b></span>
                    <span>•</span>
                    <span>Tổng số cảnh: <b class="text-zinc-900">${scenes.length}</b></span>
                </div>
            </div>

            <!-- Screenplay Scenes -->
            <div class="space-y-6">
    `;

    scenes.forEach((scene, idx) => {
        scriptHtml += `
            <div class="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 font-mono">
                <div class="text-black font-bold text-sm tracking-wide mb-2 flex items-center justify-between">
                    <span>CẢNH ${scene.scene_number || idx + 1}: ${escapeHtml(scene.title || `PHÂN ĐOẠN ${idx + 1}`).toUpperCase()}</span>
                    <span class="text-xs text-zinc-400">DIRECTOR SHOT</span>
                </div>
                <div class="text-zinc-800 text-sm mb-3 pl-4 border-l-2 border-zinc-400 leading-relaxed font-sans">
                    ${escapeHtml(scene.description)}
                </div>
                <div class="text-xs text-zinc-800 bg-white p-3.5 rounded-xl border border-zinc-200">
                    <span class="font-bold text-zinc-500 uppercase text-[10px] block mb-1">Visual Prompt Direction:</span>
                    ${escapeHtml(scene.visual_prompt)}
                </div>
            </div>
        `;
    });

    scriptHtml += `
            </div>
        </div>
    `;

    container.innerHTML = scriptHtml;
}

// View 3: JSON Raw
function renderJsonView(data) {
    const preElement = document.getElementById("json-raw-display");
    if (preElement) {
        preElement.textContent = JSON.stringify(data, null, 2);
    }
}

// 6. Chuyển đổi Tab hiển thị
function switchTab(tabName) {
    activeTab = tabName;
    const tabBtns = document.querySelectorAll("[data-view-tab]");
    const tabContents = {
        grid: document.getElementById("view-grid-content"),
        script: document.getElementById("view-script-content"),
        json: document.getElementById("view-json-content")
    };

    tabBtns.forEach(btn => {
        if (btn.getAttribute("data-view-tab") === tabName) {
            btn.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black shadow-xs border border-zinc-200 transition-all flex items-center gap-2";
        } else {
            btn.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-600 hover:text-black hover:bg-white/60 transition-all flex items-center gap-2";
        }
    });

    Object.keys(tabContents).forEach(key => {
        if (tabContents[key]) {
            if (key === tabName) {
                tabContents[key].classList.remove("hidden");
            } else {
                tabContents[key].classList.add("hidden");
            }
        }
    });
}

// 7. Tiện ích Copy & Download
window.copyScenePrompt = function(idx) {
    if (!currentStoryData || !currentStoryData.scenes || !currentStoryData.scenes[idx]) return;
    const text = currentStoryData.scenes[idx].visual_prompt;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById(`btn-copy-scene-${idx}`);
        if (btn) {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i> Đã sao chép!`;
            setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
        }
        showNotification(`Đã sao chép Prompt Cảnh ${idx + 1}!`, "success");
    });
};

function copyAllVisualPrompts() {
    if (!currentStoryData || !currentStoryData.scenes) return;
    const allPrompts = currentStoryData.scenes.map((s, i) => `=== CẢNH ${s.scene_number || i + 1} ===\n${s.visual_prompt}\n`).join("\n");
    navigator.clipboard.writeText(allPrompts).then(() => {
        showNotification("Đã sao chép toàn bộ Visual Prompts vào bộ nhớ tạm!", "success");
    });
}

function copyRawJson() {
    if (!currentStoryData) return;
    navigator.clipboard.writeText(JSON.stringify(currentStoryData, null, 2)).then(() => {
        showNotification("Đã sao chép dữ liệu JSON!", "success");
    });
}

function downloadJsonFile() {
    if (!currentStoryData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentStoryData, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeTitle = (currentStoryData.title || "storyboard").toLowerCase().replace(/[^a-z0-9]/g, "_");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${safeTitle}_director_output.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification("Đã tải xuống file JSON kịch bản!", "success");
}

// Thông báo Toast Notification
function showNotification(msg, type = "info") {
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

    requestAnimationFrame(() => {
        toast.classList.remove("translate-y-4", "opacity-0");
    });

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
