// Script nạp Component Header duy nhất cho tất cả các trang
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("header-container");
    if (!container) return;

    try {
        const response = await fetch("/components/header.html");
        if (response.ok) {
            container.innerHTML = await response.text();
            initHeaderLogic(container);
        } else {
            console.error("Không thể tải file /components/header.html");
        }
    } catch (error) {
        console.error("Lỗi kết nối khi tải Header Component:", error);
    }
});

function initHeaderLogic(container) {
    // 1. Xử lý Toggle Menu Hamburger trên Mobile
    const btn = container.querySelector('#hamburger-btn');
    const menu = container.querySelector('#mobile-menu');
    const hamburgerIcon = container.querySelector('#hamburger-icon');
    const closeIcon = container.querySelector('#close-icon');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                hamburgerIcon.classList.add('hidden');
                closeIcon.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
                hamburgerIcon.classList.remove('hidden');
                closeIcon.classList.add('hidden');
            }
        });
    }

    // 2. Tự động Active nút menu theo thuộc tính data-active hoặc URL hiện tại
    const activePage = container.getAttribute('data-active') || getActiveFromPath();
    if (activePage) {
        const desktopLink = container.querySelector(`.nav-item[data-nav="${activePage}"]`);
        if (desktopLink) {
            desktopLink.className = "nav-item text-white font-medium border-b-2 border-[#2997ff] pb-0.5 transition-colors duration-150";
        }

        const mobileLink = container.querySelector(`.mobile-nav-item[data-nav="${activePage}"]`);
        if (mobileLink) {
            mobileLink.className = "mobile-nav-item block text-[#2997ff] font-medium py-1";
        }
    }

    // 3. Cập nhật số dư Token trên Header
    if (typeof updateTokenDisplay === "function") {
        updateTokenDisplay();
    }
}

function getActiveFromPath() {
    const path = window.location.pathname;
    if (path.includes('gallery')) return 'gallery';
    if (path.includes('storyboard')) return 'storyboard';
    if (path.includes('chat')) return 'chat';
    if (path.includes('info')) return 'info';
    return 'home';
}
