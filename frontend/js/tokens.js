// tokens.js - Hệ thống Quản Lý Token cho HARNESS STUDIO

const DEFAULT_INITIAL_TOKENS = 500;
const STORYBOARD_CREATION_COST = 50;

function getUserTokens() {
    try {
        const stored = localStorage.getItem("harness_user_tokens");
        if (stored === null) {
            localStorage.setItem("harness_user_tokens", DEFAULT_INITIAL_TOKENS.toString());
            return DEFAULT_INITIAL_TOKENS;
        }
        return parseInt(stored, 10) || DEFAULT_INITIAL_TOKENS;
    } catch (e) {
        return DEFAULT_INITIAL_TOKENS;
    }
}

function setUserTokens(amount) {
    try {
        localStorage.setItem("harness_user_tokens", amount.toString());
        updateTokenDisplay();
    } catch (e) {
        console.error("Lỗi lưu token:", e);
    }
}

function deductTokens(amount = STORYBOARD_CREATION_COST) {
    const current = getUserTokens();
    if (current < amount) {
        return false;
    }
    setUserTokens(current - amount);
    return true;
}

function addTokens(amount = 100) {
    const current = getUserTokens();
    setUserTokens(current + amount);
    return current + amount;
}

function updateTokenDisplay() {
    const tokens = getUserTokens();
    const tokenBadges = document.querySelectorAll(".user-token-display");
    tokenBadges.forEach(el => {
        el.textContent = tokens.toLocaleString('vi-VN');
    });
}

function showClaimTokensModal() {
    let modal = document.getElementById("token-claim-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "token-claim-modal";
        modal.className = "fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-appleFadeIn";
        modal.innerHTML = `
            <div class="bg-[#161617] border border-white/15 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
                <div class="w-12 h-12 rounded-full bg-white/10 border border-white/10 text-[#ffd60a] flex items-center justify-center text-xl mx-auto">
                    <i class="fa-solid fa-bolt"></i>
                </div>
                <div class="space-y-1">
                    <h3 class="text-base font-bold text-white">Nhận Thêm Token Miễn Phí</h3>
                    <p class="text-xs text-[#86868b]">Mỗi lượt tạo Storyboard cần <b>${STORYBOARD_CREATION_COST} Tokens</b>. Nhận ngay <b>+100 Tokens</b> miễn phí mỗi ngày!</p>
                </div>
                <div class="p-3.5 bg-[#1d1d1f] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                    <span class="text-[#86868b]">Số dư hiện tại:</span>
                    <span class="font-bold text-white font-mono"><span class="user-token-display">${getUserTokens()}</span> ⚡</span>
                </div>
                <div class="space-y-2 pt-1">
                    <button type="button" id="btn-claim-free-tokens"
                        class="apple-btn-white w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-gift text-black"></i> Nhận +100 Tokens Ngay
                    </button>
                    <button type="button" onclick="document.getElementById('token-claim-modal').remove()"
                        class="w-full py-2 px-4 rounded-full font-medium text-xs text-[#86868b] hover:text-white transition">
                        Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector("#btn-claim-free-tokens").addEventListener("click", () => {
            addTokens(100);
            alert("Chúc mừng! Bạn đã nhận thành công +100 Tokens.");
            modal.remove();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateTokenDisplay();
});
