// tokens.js - Hệ thống Quản Lý Tài Nguyên KHKT HARNESS STUDIO (Mở & Không giới hạn)

const UNLIMITED_TOKENS = 9999;

function getUserTokens() {
    return UNLIMITED_TOKENS;
}

function setUserTokens(amount) {
    // Không giới hạn trong phiên bản nghiên cứu KHKT
}

function deductTokens(amount = 0) {
    // Luôn cho phép thực thi không giới hạn
    return true;
}

function addTokens(amount = 0) {
    return UNLIMITED_TOKENS;
}

function updateTokenDisplay() {
    const tokenBadges = document.querySelectorAll(".user-token-display");
    tokenBadges.forEach(el => {
        el.textContent = "Không giới hạn";
    });
}

function showClaimTokensModal() {
    // Không cần modal nạp token vì hệ thống hoàn toàn mở và miễn phí phục vụ giáo dục/nghiên cứu
    console.info("Hệ thống mở hoàn toàn, không giới hạn lượt tạo.");
}

document.addEventListener("DOMContentLoaded", () => {
    updateTokenDisplay();
});
