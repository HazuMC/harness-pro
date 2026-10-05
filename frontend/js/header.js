// header.js - Script nạp Component Header & Mobile Dock siêu bền vững (Chạy trên cả localhost:8000, Live Server & file://)

const HEADER_TEMPLATE = `
<header class="sticky top-0 z-40 apple-blur border-b border-white/[0.08] transition-all duration-300">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-14">

            <!-- Apple Style Logo Brand -->
            <div class="flex-shrink-0 flex items-center gap-3">
                <a href="/" class="flex items-center gap-2.5 group">
                    <div class="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:scale-105 transition duration-200">
                        <i class="fa-solid fa-clapperboard text-xs text-[#2997ff]"></i>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold tracking-tight text-[#f5f5f7]">HARNESS<span class="text-[#2997ff]">.PRO</span></span>
                        <span class="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-[#86868b] border-l border-white/15 pl-2">KHKT JSB12</span>
                    </div>
                </a>
            </div>

            <!-- Apple Desktop Nav Menu -->
            <nav class="hidden md:flex items-center space-x-7 text-xs font-normal" id="desktop-nav">
                <a href="/" data-nav="home"
                    class="nav-item text-[#f5f5f7]/75 hover:text-white transition-colors duration-150 py-1">
                    Tổng Quan
                </a>
                <a href="/storyboard" data-nav="storyboard"
                    class="nav-item text-[#f5f5f7]/75 hover:text-white transition-colors duration-150 py-1">
                    Storyboard Studio
                </a>
                <a href="/chat" data-nav="chat"
                    class="nav-item text-[#f5f5f7]/75 hover:text-white transition-colors duration-150 py-1">
                    Trợ Lý Hướng Nghiệp
                </a>
                <a href="/gallery" data-nav="gallery"
                    class="nav-item text-[#f5f5f7]/75 hover:text-white transition-colors duration-150 py-1">
                    Kho Portfolio
                </a>
                <a href="/info" data-nav="info"
                    class="nav-item text-[#f5f5f7]/75 hover:text-white transition-colors duration-150 py-1">
                    Thông Tin Dự Án
                </a>
            </nav>

            <!-- Status & Action Buttons -->
            <div class="flex items-center gap-2 sm:gap-3">
                
                <!-- Research Status Badge -->
                <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-[#86868b]">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse"></span>
                    <span class="font-mono text-[11px] text-[#f5f5f7]">GPT Image 2.5</span>
                </div>

                <!-- Apple Style CTA -->
                <a href="/storyboard"
                    class="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-sm">
                    Vào Studio
                </a>

                <!-- Mobile Quick Media Widget Pill Button (Top Bar) -->
                <button type="button" id="btn-toggle-media-top" aria-label="Trung tâm AI & Media"
                    class="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-[11px] font-medium text-white transition active:scale-95 cursor-pointer">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-ping"></span>
                    <span class="text-[#2997ff]"><i class="fa-solid fa-sparkles text-[10px]"></i> AI Media</span>
                </button>

                <!-- Mobile Hamburger Button -->
                <button id="hamburger-btn" type="button" aria-label="Toggle Navigation"
                    class="inline-flex md:hidden items-center justify-center p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/10 border border-white/10 focus:outline-none transition cursor-pointer">
                    <svg id="hamburger-icon" class="block h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg id="close-icon" class="hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

        </div>
    </div>

    <!-- Mobile Top Navigation Drawer -->
    <div id="mobile-menu"
        class="hidden md:hidden border-t border-white/[0.08] apple-blur transition-all duration-300">
        <div class="px-6 py-4 space-y-3 text-sm font-normal">
            <a href="/" data-nav="home"
                class="mobile-nav-item block text-[#f5f5f7]/80 hover:text-white py-1">
                <i class="fa-solid fa-house text-[#86868b] mr-2 w-4"></i> Tổng Quan
            </a>
            <a href="/storyboard" data-nav="storyboard"
                class="mobile-nav-item block text-[#f5f5f7]/80 hover:text-white py-1">
                <i class="fa-solid fa-clapperboard text-[#2997ff] mr-2 w-4"></i> Storyboard Studio
            </a>
            <a href="/chat" data-nav="chat"
                class="mobile-nav-item block text-[#f5f5f7]/80 hover:text-white py-1">
                <i class="fa-solid fa-comment-dots text-[#30d158] mr-2 w-4"></i> Trợ Lý Hướng Nghiệp
            </a>
            <a href="/gallery" data-nav="gallery"
                class="mobile-nav-item block text-[#f5f5f7]/80 hover:text-white py-1">
                <i class="fa-solid fa-images text-[#ffd60a] mr-2 w-4"></i> Kho Portfolio
            </a>
            <a href="/info" data-nav="info"
                class="mobile-nav-item block text-[#f5f5f7]/80 hover:text-white py-1">
                <i class="fa-solid fa-circle-info text-[#86868b] mr-2 w-4"></i> Thông Tin Dự Án
            </a>
        </div>
    </div>
</header>

<!-- ================= 📱 MOBILE FLOATING DOCK & MEDIA WIDGET (CHỈ HIỂN THỊ TRÊN ĐIỆN THOẠI) ================= -->
<nav id="apple-mobile-dock" aria-label="Mobile Navigation Dock"
    class="md:hidden fixed bottom-3 left-3 right-3 max-w-md mx-auto z-50 rounded-3xl bg-[#161617]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)] px-2.5 py-1.5 flex items-center justify-between transition-all duration-300">

    <!-- 1. Home Tab -->
    <a href="/" data-dock-nav="home"
        class="dock-item flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-[#86868b] hover:text-white transition-all">
        <i class="fa-solid fa-house text-base mb-0.5"></i>
        <span class="text-[10px] font-medium tracking-tight">Trang Chủ</span>
    </a>

    <!-- 2. Storyboard Studio Tab -->
    <a href="/storyboard" data-dock-nav="storyboard"
        class="dock-item flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-[#86868b] hover:text-[#2997ff] transition-all">
        <i class="fa-solid fa-clapperboard text-base mb-0.5"></i>
        <span class="text-[10px] font-medium tracking-tight">Studio</span>
    </a>

    <!-- 3. CENTER: FLOATING MEDIA & AI WIDGET BUTTON -->
    <button type="button" id="btn-mobile-media-widget" aria-label="Trung Tâm Điều Khiển AI"
        class="relative -mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#2997ff] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,113,227,0.5)] border-[2.5px] border-black hover:scale-105 active:scale-95 transition-all cursor-pointer group">
        <i class="fa-solid fa-wand-magic-sparkles text-sm group-hover:rotate-12 transition-transform"></i>
        <span class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#30d158] border-2 border-black rounded-full"></span>
    </button>

    <!-- 4. Chat Copilot Tab -->
    <a href="/chat" data-dock-nav="chat"
        class="dock-item flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-[#86868b] hover:text-[#30d158] transition-all">
        <i class="fa-solid fa-comment-dots text-base mb-0.5"></i>
        <span class="text-[10px] font-medium tracking-tight">Trợ Lý</span>
    </a>

    <!-- 5. Gallery Portfolio Tab -->
    <a href="/gallery" data-dock-nav="gallery"
        class="dock-item flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-[#86868b] hover:text-[#ffd60a] transition-all">
        <i class="fa-solid fa-images text-base mb-0.5"></i>
        <span class="text-[10px] font-medium tracking-tight">Kho Ảnh</span>
    </a>

</nav>

<!-- ================= 🎛️ EXPANDABLE MOBILE MEDIA & AI CONTROL SHEET ================= -->
<div id="mobile-media-sheet"
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md hidden opacity-0 transition-opacity duration-300 md:hidden flex items-end">
    
    <!-- Backdrop Overlay Click -->
    <div id="media-sheet-backdrop" class="absolute inset-0"></div>

    <!-- Sheet Content Container -->
    <div class="relative w-full max-w-lg mx-auto bg-[#1c1c1e] border-t border-white/20 rounded-t-3xl p-6 shadow-2xl space-y-5 animate-slideUp">
        
        <!-- Drag Handle Indicator -->
        <div class="w-12 h-1.5 bg-white/25 rounded-full mx-auto -mt-2"></div>

        <!-- Sheet Header -->
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#0071e3]/20 border border-[#0071e3]/40 flex items-center justify-center text-[#2997ff]">
                    <i class="fa-solid fa-sliders text-xs"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-white tracking-tight">Trung Tâm AI & Media Widget</h3>
                    <p class="text-[11px] text-[#86868b]">HARNESS PRO Studio Mobile Control</p>
                </div>
            </div>
            <button type="button" id="btn-close-media-sheet"
                class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#86868b] hover:text-white transition cursor-pointer">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        </div>

        <!-- 1. Active AI Models Status Grid -->
        <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono text-[#86868b] uppercase">Model Kịch Bản</span>
                    <span class="w-2 h-2 rounded-full bg-[#30d158]"></span>
                </div>
                <div class="text-xs font-bold text-white">DeepSeek V4 Pro</div>
                <div class="text-[10px] text-[#86868b]">Đạo diễn & Bóc tách cảnh</div>
            </div>

            <div class="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono text-[#86868b] uppercase">Model Tạo Ảnh</span>
                    <span class="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse"></span>
                </div>
                <div class="text-xs font-bold text-[#2997ff]">GPT Image 2.5</div>
                <div class="text-[10px] text-[#86868b]">OpenRouter Pro Engine</div>
            </div>
        </div>

        <!-- 2. Quick Media & Storyboard Fast Actions -->
        <div class="space-y-2">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Hành Động Nhanh</div>
            <div class="grid grid-cols-2 gap-2">
                <a href="/storyboard"
                    class="p-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-2.5 transition active:scale-95 shadow-md">
                    <i class="fa-solid fa-plus-circle text-base"></i>
                    <div>
                        <div class="text-xs font-bold">Tạo Storyboard</div>
                        <div class="text-[10px] text-white/80">Khởi chạy kịch bản mới</div>
                    </div>
                </a>

                <a href="/chat"
                    class="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center gap-2.5 transition active:scale-95 border border-white/10">
                    <i class="fa-solid fa-headset text-base text-[#30d158]"></i>
                    <div>
                        <div class="text-xs font-bold">Trợ Lý 24/7</div>
                        <div class="text-[10px] text-[#86868b]">Tư vấn nghề & ý tưởng</div>
                    </div>
                </a>
            </div>
        </div>

        <!-- 3. Quick Story Sample Presets for Phone -->
        <div class="space-y-2 pt-1">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">Ý Tưởng Mẫu Nhanh Cho Điện Thoại</div>
            <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none" id="mobile-quick-prompts">
                <button type="button" onclick="launchMobileStoryPrompt('Một phi hành gia phát hiện khu rừng pha lê phát sáng dưới lòng đại dương sao Hỏa.')"
                    class="flex-shrink-0 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-left text-xs text-[#f5f5f7] transition active:scale-95 cursor-pointer">
                    🚀 Sao Hỏa Pha Lê
                </button>
                <button type="button" onclick="launchMobileStoryPrompt('Thám tử cyberpunk điều tra vụ án ký ức biến mất tại Neo-Hà Nội 2088.')"
                    class="flex-shrink-0 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-left text-xs text-[#f5f5f7] transition active:scale-95 cursor-pointer">
                    🌆 Neo-Hà Nội 2088
                </button>
                <button type="button" onclick="launchMobileStoryPrompt('Một cậu bé tìm thấy bản đồ bay của người cha thợ đồng hồ cổ.')"
                    class="flex-shrink-0 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-left text-xs text-[#f5f5f7] transition active:scale-95 cursor-pointer">
                    🕰️ Bản Đồ Thợ Đồng Hồ
                </button>
            </div>
        </div>

    </div>
</div>
`;

function renderHeaderComponent() {
    const container = document.getElementById("header-container");
    if (!container) return;

    // 1. Render ngay lập tức template nội tại (Đảm bảo 100% không bao giờ bị trắng header)
    container.innerHTML = HEADER_TEMPLATE;

    // 2. Tự động điều chỉnh liên kết nếu đang chạy dạng file tĩnh (file:// hoặc .html)
    adaptLinksForEnvironment(container);

    // 3. Khởi tạo logic tương tác
    initHeaderLogic(container);
    initMobileDockLogic(container);
}

function adaptLinksForEnvironment(container) {
    const isStaticFile = window.location.protocol === 'file:' || 
                         window.location.pathname.endsWith('.html') ||
                         window.location.port === '5500';

    if (isStaticFile) {
        const linkMap = {
            '/': 'index.html',
            '/storyboard': 'storyboard.html',
            '/chat': 'chat.html',
            '/gallery': 'gallery.html',
            '/info': 'info.html'
        };

        container.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (linkMap[href]) {
                a.setAttribute('href', linkMap[href]);
            }
        });
    }
}

function initHeaderLogic(container) {
    // 1. Toggle Menu Hamburger
    const btn = container.querySelector('#hamburger-btn');
    const menu = container.querySelector('#mobile-menu');
    const hamburgerIcon = container.querySelector('#hamburger-icon');
    const closeIcon = container.querySelector('#close-icon');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                if (hamburgerIcon) hamburgerIcon.classList.add('hidden');
                if (closeIcon) closeIcon.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
                if (hamburgerIcon) hamburgerIcon.classList.remove('hidden');
                if (closeIcon) closeIcon.classList.add('hidden');
            }
        });
    }

    // 2. Tự động Active nút menu theo thuộc tính data-active hoặc URL hiện tại
    const activePage = container.getAttribute('data-active') || getActiveFromPath();
    if (activePage) {
        const desktopLink = container.querySelector(`.nav-item[data-nav="${activePage}"]`);
        if (desktopLink) {
            desktopLink.className = "nav-item text-white font-semibold border-b-2 border-[#2997ff] pb-0.5 transition-colors duration-150";
        }

        const mobileLink = container.querySelector(`.mobile-nav-item[data-nav="${activePage}"]`);
        if (mobileLink) {
            mobileLink.className = "mobile-nav-item block text-[#2997ff] font-semibold py-1 bg-white/[0.06] px-3 rounded-xl";
        }

        // Highlight icon trên Mobile Dock
        const dockLink = container.querySelector(`.dock-item[data-dock-nav="${activePage}"]`);
        if (dockLink) {
            dockLink.classList.remove('text-[#86868b]');
            dockLink.classList.add('text-[#2997ff]', 'bg-white/[0.08]', 'scale-105');
            const icon = dockLink.querySelector('i');
            if (icon) icon.classList.add('text-[#2997ff]');
        }
    }

    // 3. Cập nhật số dư Token trên Header
    if (typeof updateTokenDisplay === "function") {
        updateTokenDisplay();
    }
}

function initMobileDockLogic(container) {
    const btnMedia = container.querySelector('#btn-mobile-media-widget');
    const btnMediaTop = container.querySelector('#btn-toggle-media-top');
    const sheet = container.querySelector('#mobile-media-sheet');
    const btnClose = container.querySelector('#btn-close-media-sheet');
    const backdrop = container.querySelector('#media-sheet-backdrop');

    function openMediaSheet() {
        if (!sheet) return;
        sheet.classList.remove('hidden');
        requestAnimationFrame(() => {
            sheet.classList.remove('opacity-0');
            sheet.classList.add('opacity-100');
        });
    }

    function closeMediaSheet() {
        if (!sheet) return;
        sheet.classList.remove('opacity-100');
        sheet.classList.add('opacity-0');
        setTimeout(() => {
            sheet.classList.add('hidden');
        }, 250);
    }

    if (btnMedia) btnMedia.addEventListener('click', openMediaSheet);
    if (btnMediaTop) btnMediaTop.addEventListener('click', openMediaSheet);
    if (btnClose) btnClose.addEventListener('click', closeMediaSheet);
    if (backdrop) backdrop.addEventListener('click', closeMediaSheet);
}

// Khởi chạy nhanh ý tưởng câu chuyện trên điện thoại
window.launchMobileStoryPrompt = function(promptText) {
    if (!promptText) return;
    sessionStorage.setItem("imported_chat_prompt", promptText);
    const target = (window.location.protocol === 'file:' || window.location.pathname.endsWith('.html')) 
        ? "storyboard.html" 
        : "/storyboard";
    window.location.href = target;
};

function getActiveFromPath() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('gallery')) return 'gallery';
    if (path.includes('storyboard')) return 'storyboard';
    if (path.includes('chat')) return 'chat';
    if (path.includes('info')) return 'info';
    return 'home';
}

// Chạy khởi tạo ngay lập tức
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeaderComponent);
} else {
    renderHeaderComponent();
}
