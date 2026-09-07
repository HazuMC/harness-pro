// gallery.js - Quản lý Kho Portfolio & Hồ Sơ Năng Lực Thương Mại (Commercial & Career Showcase)

document.addEventListener("DOMContentLoaded", () => {
    initGalleryModule();
});

let currentFilter = "all";
let currentSearch = "";
let selectedProject = null;

// Các dự án mẫu chuẩn thương mại & hướng nghiệp khởi tạo ban đầu
const STARTER_COMMERCIAL_PROJECTS = [
    {
        id: "proj_tvc_beverage_01",
        title: "TVC 30s: Nước Khoáng Thể Thao Tươi Mát Bứt Phá",
        category: "commercial",
        style: "TVC Commercial 4K",
        type: "TVC Ngắn",
        summary: "Chiến dịch quảng bá dòng nước khoáng điện giải thiên nhiên cho giới trẻ năng động. Cấu trúc gồm cảnh vận động viên kiệt sức, khoảnh khắc bùng nổ năng lượng khi mở nắp lon và cảnh chạm đích chiến thắng rực rỡ.",
        cover_image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format&fit=crop&q=80",
        frames_count: 4,
        created_at: "2026-03-01",
        frames: [
            {
                frame_number: 1,
                scene_number: 1,
                scene_title: "Cơn Khát Giữa Trưa Nắng",
                shot_type: "Extreme Wide Shot",
                camera_angle: "Low-angle",
                camera_movement: "Tracking",
                action_description: "Vận động viên dừng bước trên đường chạy nóng bỏng, giọt mồ hôi rơi chạm mặt đường bốc hơi; ánh nắng trưa gay gắt chiếu qua vai.",
                continuity_notes: "Áo thể thao màu xanh lam đậm, khăn thấm mồ hôi trên cổ.",
                image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format&fit=crop&q=80"
            },
            {
                frame_number: 2,
                scene_number: 2,
                scene_title: "Bật Nắp Bùng Nổ Năng Lượng",
                shot_type: "Macro Extreme Close-Up",
                camera_angle: "Eye-level",
                camera_movement: "Slow-motion 240fps",
                action_description: "Bàn tay mở nắp lon kim loại lạnh ngắt; tia nước ion và bọt khí khoáng chất bắn tóe lấp lánh như kim cương trong ánh đèn studio mát lạnh.",
                continuity_notes: "Lon nước màu xanh lam bạc, logo thương hiệu in nổi 3D sắc nét.",
                image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80"
            },
            {
                frame_number: 3,
                scene_number: 3,
                scene_title: "Bứt Phá Về Đích",
                shot_type: "Medium Tracking Shot",
                camera_angle: "Dutch Tilt",
                camera_movement: "Dolly",
                action_description: "Ánh mắt rực sáng quyết tâm, đôi chân sải bước dũng mãnh vượt qua đối thủ để chạm tay vào dải băng đích vinh quang trong tiếng vỗ tay.",
                continuity_notes: "Nhân vật giữ nguyên trang phục xanh lam, nụ cười rạng rỡ tự tin.",
                image_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80"
            },
            {
                frame_number: 4,
                scene_number: 4,
                scene_title: "Khẳng Định Thương Hiệu",
                shot_type: "Close-Up Packshot",
                camera_angle: "Eye-level",
                camera_movement: "Static",
                action_description: "Sản phẩm đặt trên bệ đá băng tuyết phát sáng; slogan xuất hiện: 'Bứt Phá Mọi Giới Hạn - Năng Lượng Từ Tự Nhiên'.",
                continuity_notes: "Ánh sáng studio bao quanh chai nước, hiệu ứng giọt nước đọng trên thân chai.",
                image_url: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop&q=80"
            }
        ]
    },
    {
        id: "proj_corporate_tech_02",
        title: "Phim Thương Hiệu: Khát Vọng Doanh Nhân 10 Năm Vươn Xa",
        category: "corporate",
        style: "Cinematic",
        type: "Chiến dịch Dài",
        summary: "Phim kỷ niệm 10 năm thành lập tập đoàn công nghệ tiên phong. Tái hiện hành trình từ gian phòng trọ của 2 kỹ sư trẻ vượt qua thăng trầm để xây dựng tổ hợp công nghệ quy mô hàng ngàn nhân sự.",
        cover_image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
        frames_count: 4,
        created_at: "2026-03-02",
        frames: [
            {
                frame_number: 1,
                scene_number: 1,
                scene_title: "Gian Phòng Trọ Khởi Nghiệp",
                shot_type: "Wide Shot",
                camera_angle: "Eye-level",
                camera_movement: "Static",
                action_description: "Hai kỹ sư trẻ làm việc say mê bên màn hình máy tính cũ trong đêm muộn, ánh sáng đèn bàn ấm áp tương phản với không gian tĩnh mịch.",
                continuity_notes: "Bàn gỗ mộc, các bản vẽ sơ đồ hệ thống dán trên tường.",
                image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
            },
            {
                frame_number: 2,
                scene_number: 2,
                scene_title: "Trụ Sở Công Nghệ Hiện Đại",
                shot_type: "High-angle Flycam",
                camera_angle: "High-angle",
                camera_movement: "Pan",
                action_description: "Flycam bay lướt qua tòa tháp kính hiện đại đón ánh bình minh rực rỡ, bên trong là không gian làm việc năng động và hiện đại.",
                continuity_notes: "Tông màu xanh dương và xám bạc hiện đại của thương hiệu.",
                image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80"
            }
        ]
    },
    {
        id: "proj_edu_scifi_03",
        title: "Đồ Án Hướng Nghiệp: Trạm Không Gian Vọng Âm Sao Mộc",
        category: "education",
        style: "Cyberpunk",
        type: "Truyện ngắn",
        summary: "Đồ án rèn luyện kỹ năng phân cảnh kịch bản khoa học viễn tưởng. Nữ kỹ sư không gian khám phá tín hiệu âm thanh cổ xưa được phát ra từ lòng hành tinh Sao Mộc.",
        cover_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        frames_count: 3,
        created_at: "2026-03-04",
        frames: [
            {
                frame_number: 1,
                scene_number: 1,
                scene_title: "Tiếp Cận Trạm Không Gian Bỏ Hoang",
                shot_type: "Wide Shot",
                camera_angle: "Low-angle",
                camera_movement: "Dolly in",
                action_description: "Con tàu thám hiểm đơn độc chầm chậm tiến vào quỹ đạo trạm nghiên cứu khổng lồ lơ lửng giữa vùng không gian sâu thẳm.",
                continuity_notes: "Tàu thám hiểm màu trắng bạc, phản chiếu ánh sáng cực quang xanh tím.",
                image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"
            }
        ]
    }
];

function initGalleryModule() {
    ensureInitialProjects();
    renderGallery();
    bindGalleryEvents();
}

function ensureInitialProjects() {
    const existing = localStorage.getItem("saved_storyboard_projects");
    if (!existing || JSON.parse(existing).length === 0) {
        localStorage.setItem("saved_storyboard_projects", JSON.stringify(STARTER_COMMERCIAL_PROJECTS));
    }
}

function getStoredProjects() {
    try {
        const data = localStorage.getItem("saved_storyboard_projects");
        if (!data) return STARTER_COMMERCIAL_PROJECTS;
        const parsed = JSON.parse(data);
        return parsed.length > 0 ? parsed : STARTER_COMMERCIAL_PROJECTS;
    } catch (e) {
        console.error("Lỗi đọc projects từ localStorage:", e);
        return STARTER_COMMERCIAL_PROJECTS;
    }
}

function saveProjectsToStorage(projects) {
    try {
        localStorage.setItem("saved_storyboard_projects", JSON.stringify(projects));
    } catch (e) {
        console.error("Lỗi lưu projects:", e);
    }
}

function bindGalleryEvents() {
    // 1. Filter tabs
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => {
                b.className = "filter-btn px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition";
            });
            btn.className = "filter-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-white shadow-2xs transition";
            currentFilter = btn.getAttribute("data-filter") || "all";
            renderGallery();
        });
    });

    // 2. Search input
    const searchInput = document.getElementById("gallery-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderGallery();
        });
    }

    // 3. Modal close
    const closeBtn = document.getElementById("btn-close-modal");
    const modal = document.getElementById("gallery-modal");
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });
    }

    // 4. Modal Load to Storyboard
    const loadBtn = document.getElementById("btn-modal-load-storyboard");
    if (loadBtn) {
        loadBtn.addEventListener("click", () => {
            if (selectedProject) {
                sessionStorage.setItem("imported_chat_prompt", selectedProject.summary || selectedProject.title);
                window.location.href = "/storyboard";
            }
        });
    }

    // 5. Modal Delete Project
    const modalDeleteBtn = document.getElementById("btn-modal-delete");
    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener("click", () => {
            if (selectedProject && confirm(`Bạn có chắc muốn xóa dự án "${selectedProject.title}" khỏi kho lưu trữ?`)) {
                deleteProject(selectedProject.id);
                if (modal) modal.classList.add("hidden");
            }
        });
    }

    // 6. Nút Xóa tất cả dự án
    const clearAllBtn = document.getElementById("btn-clear-all-gallery");
    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            const projects = getStoredProjects();
            if (projects.length === 0) {
                alert("Kho lưu trữ hiện đang trống.");
                return;
            }
            if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dự án đã lưu trong kho lưu trữ?")) {
                localStorage.removeItem("saved_storyboard_projects");
                renderGallery();
            }
        });
    }
}

function renderGallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;

    const projects = getStoredProjects();

    const filtered = projects.filter(p => {
        let matchesFilter = false;
        if (currentFilter === "all") {
            matchesFilter = true;
        } else if (currentFilter === "commercial") {
            matchesFilter = p.category === "commercial" || (p.style && p.style.toLowerCase().includes("commercial")) || (p.title && p.title.toLowerCase().includes("tvc"));
        } else if (currentFilter === "corporate") {
            matchesFilter = p.category === "corporate" || (p.title && (p.title.toLowerCase().includes("doanh nghiệp") || p.title.toLowerCase().includes("thương hiệu")));
        } else if (currentFilter === "education") {
            matchesFilter = p.category === "education" || (p.title && (p.title.toLowerCase().includes("hướng nghiệp") || p.title.toLowerCase().includes("đồ án") || p.title.toLowerCase().includes("học đường")));
        } else if (currentFilter === "cinema") {
            matchesFilter = p.style === "Cinematic" || (p.title && p.title.toLowerCase().includes("phim"));
        } else if (currentFilter === "viral") {
            matchesFilter = (p.title && (p.title.toLowerCase().includes("tiktok") || p.title.toLowerCase().includes("viral"))) || p.style === "TikTok Viral Dynamic";
        } else {
            matchesFilter = p.style === currentFilter;
        }

        const matchesSearch = (!currentSearch || 
            (p.title && p.title.toLowerCase().includes(currentSearch)) || 
            (p.summary && p.summary.toLowerCase().includes(currentSearch)));
        return matchesFilter && matchesSearch;
    });

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 px-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-2xl mx-auto shadow-sm">
                    <i class="fa-solid fa-box-archive text-indigo-500"></i>
                </div>
                <div class="max-w-md mx-auto space-y-1">
                    <h3 class="text-base font-bold text-slate-950">Kho Portfolio Trống</h3>
                    <p class="text-xs text-slate-500 leading-relaxed">
                        Bạn chưa lưu dự án nào. Hãy vào <b>Storyboard Studio</b> và bấm <b>"Lưu Vào Kho Portfolio"</b> để quản lý tác phẩm thương mại của bạn tại đây.
                    </p>
                </div>
                <div class="pt-2">
                    <a href="/storyboard" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-950 text-white hover:bg-indigo-600 transition shadow-sm">
                        <i class="fa-solid fa-plus text-amber-300"></i> Khởi Tạo Storyboard Ngay &rarr;
                    </a>
                </div>
            </div>
        `;
        return;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-500 space-y-2 bg-slate-50 border border-slate-200 rounded-3xl">
                <i class="fa-solid fa-magnifying-glass text-2xl mb-1 text-slate-400"></i>
                <div class="text-sm font-semibold text-slate-800">Không tìm thấy dự án phù hợp</div>
                <div class="text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc chọn tab danh mục khác.</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(proj => {
        const coverImg = proj.cover_image && proj.cover_image.length > 5 ? proj.cover_image : "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80";
        
        let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/60";
        let badgeLabel = "Commercial Ready";
        if (proj.category === "education" || proj.title.includes("Hướng nghiệp") || proj.title.includes("Đồ án")) {
            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
            badgeLabel = "Student Portfolio";
        } else if (proj.category === "corporate") {
            badgeColor = "bg-purple-50 text-purple-700 border-purple-200/60";
            badgeLabel = "Corporate Pitch";
        }

        return `
            <div class="apple-bento overflow-hidden flex flex-col justify-between group">
                
                <!-- Project Cover Image -->
                <div class="aspect-video relative overflow-hidden bg-black cursor-pointer" onclick="openProjectModal('${proj.id}')">
                    <img src="${coverImg}" alt="${escapeHtml(proj.title)}"
                        class="w-full h-full object-cover transition duration-500 group-hover:scale-105" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4 justify-between">
                        <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-white text-black font-semibold font-mono">
                            ${escapeHtml(proj.style || 'Cinematic')}
                        </span>
                        <span class="text-[10px] text-white font-mono font-medium">
                            ${proj.frames_count || (proj.frames ? proj.frames.length : 0)} Khung hình
                        </span>
                    </div>
                </div>

                <!-- Project Content -->
                <div class="p-6 space-y-4 flex-grow flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-1.5">
                            <span class="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${badgeColor}">
                                ${badgeLabel}
                            </span>
                        </div>
                        <h3 class="text-base font-bold text-white group-hover:text-[#2997ff] transition line-clamp-1 cursor-pointer" onclick="openProjectModal('${proj.id}')">
                            ${escapeHtml(proj.title)}
                        </h3>
                        <p class="text-xs text-[#86868b] line-clamp-2 mt-1 leading-relaxed">
                            ${escapeHtml(proj.summary || 'Không có mô tả chi tiết.')}
                        </p>
                    </div>

                    <div class="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                        <span class="text-[11px] text-[#86868b] font-mono">${proj.created_at || 'Mới lưu'}</span>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="deleteProject('${proj.id}')" title="Xóa dự án"
                                class="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/20 text-[#86868b] hover:text-red-400 flex items-center justify-center transition cursor-pointer">
                                <i class="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
                            <button type="button" onclick="openProjectModal('${proj.id}')"
                                class="text-xs font-semibold text-white hover:text-[#2997ff] flex items-center gap-1 transition cursor-pointer">
                                Chi tiết &rarr;
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }).join("");
}

window.openProjectModal = function(projId) {
    const projects = getStoredProjects();
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    selectedProject = proj;

    document.getElementById("modal-title").textContent = proj.title;
    document.getElementById("modal-badge-style").textContent = proj.style || "Commercial";
    document.getElementById("modal-date-text").textContent = `Lưu ngày: ${proj.created_at || '2026'} • HARNESS PRO Portfolio`;

    const body = document.getElementById("modal-body");
    const frames = proj.frames || [];

    body.innerHTML = `
        <div class="p-4 bg-[#1d1d1f] rounded-2xl border border-white/10 text-xs text-[#86868b] leading-relaxed space-y-2">
            <div class="font-semibold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-file-lines text-[#2997ff]"></i> Tóm tắt kịch bản / Commercial Brief:
            </div>
            <p class="text-[#f5f5f7]">${escapeHtml(proj.summary || proj.title)}</p>
        </div>

        <div class="space-y-4 pt-2">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                <i class="fa-solid fa-film text-[#2997ff]"></i> Các phân cảnh Storyboard (${frames.length} khung hình):
            </h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${frames.map(f => `
                    <div class="bg-[#1d1d1f] border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                        <div class="aspect-video rounded-xl overflow-hidden bg-black relative">
                            <img src="${f.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'}" alt="Khung #${f.frame_number}" class="w-full h-full object-cover">
                            <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 text-white font-mono text-[9px] font-bold border border-white/20">Khung #${f.frame_number}</span>
                        </div>
                        <div>
                            <div class="text-[11px] font-bold text-white">${escapeHtml(f.shot_type || 'Shot')} • <span class="text-[#86868b] font-normal">${escapeHtml(f.camera_angle || 'Eye-level')}</span></div>
                            <p class="text-[11px] text-[#86868b] line-clamp-2 mt-1">${escapeHtml(f.action_description || '')}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    document.getElementById("gallery-modal")?.classList.remove("hidden");
};

window.deleteProject = function(projId) {
    if (confirm("Bạn có chắc muốn xóa dự án này khỏi Portfolio?")) {
        let projects = getStoredProjects();
        projects = projects.filter(p => p.id !== projId);
        saveProjectsToStorage(projects);
        renderGallery();
    }
};

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
