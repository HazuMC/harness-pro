// =========================================================================================
// chat.js - TRỢ LÝ HƯỚNG NGHIỆP & BIÊN KỊCH SỐ (CAREER & SCREENPLAY COPILOT)
// Dự án: HARNESS PRO (JSB12) | Tác giả: bigblyatcccp
// =========================================================================================
// 
// [TỔNG QUAN VỀ CƠ CHẾ HOẠT ĐỘNG]:
// 1. Khởi tạo (DOMContentLoaded):
//    - Lắng nghe sự kiện gửi form chat, phím tắt Enter/Shift+Enter, nút xoá hội thoại, các nút mẫu (preset).
// 2. Xử lý tin nhắn (handleUserMessage):
//    - Lấy text người dùng, hiển thị tin nhắn lên màn hình.
//    - Bật hiệu ứng đang gõ 3 chấm (showTypingIndicator).
//    - Sau 600ms, tắt hiệu ứng gõ và gọi hàm phân loại ý định (generateAssistantResponse).
// 3. Phân loại ý định (generateAssistantResponse):
//    - Nếu chứa từ khóa thuộc IDEA_REQUEST_KEYWORDS -> Chuyển vào generateScreenplayIdea (sinh kịch bản phân cảnh).
//    - Ngược lại -> Chuyển vào handleNormalConversation (hướng nghiệp, thuật ngữ điện ảnh DoP/Storyboard, tác giả).
// 4. Định dạng và tương tác:
//    - formatBotResponse(): Chuyển đổi Markdown (**bold**, *italic*, \n) thành HTML phù hợp dark mode.
//    - useInStoryboard(): Trích xuất nội dung kịch bản, lưu vào sessionStorage và chuyển hướng sang Studio Storyboard.
// =========================================================================================

// Khi DOM đã tải xong thì bắt đầu gắn các sự kiện cho giao diện chat
document.addEventListener("DOMContentLoaded", () => {
    initChatModule();
});

// -----------------------------------------------------------------------------------------
// BỘ TỪ KHÓA NHẬN DIỆN Ý ĐỊNH TẠO KỊCH BẢN / PHÂN CẢNH
// Hệ thống dùng danh sách này để phân loại xem người dùng đang hỏi chuyện hay yêu cầu viết kịch bản.
// -----------------------------------------------------------------------------------------
const IDEA_REQUEST_KEYWORDS = [
    "ý tưởng", "y tuong", "kịch bản", "kich ban", "cốt truyện", "cot truyen",
    "phân cảnh", "phan canh", "gợi ý", "goi y", "tạo cho", "tao cho", "viết cho",
    "viet cho", "hãy viết", "hay viet", "hãy tạo", "hay tao", "làm cho", "lam cho",
    "kể câu chuyện", "ke cau chuyen", "viết một", "viet mot", "tạo một", "tao mot",
    "lên kịch bản", "len kich ban", "lên ý tưởng", "len y tuong", "phim về", "phim ve",
    "câu chuyện về", "cau chuyen ve", "storyboard về", "storyboard ve",
    "tvc về", "tvc ve", "quảng cáo về", "quang cao ve", "video tiktok", "video ngắn"
];

/**
 * Khởi tạo toàn bộ module chat: gắn sự kiện form chat và các nút câu hỏi gợi ý nhanh
 */
function initChatModule() {
    bindChatEvents();
    bindPresetButtons();
}

/**
 * Gắn sự kiện gửi tin nhắn (Submit/Enter) và nút làm mới đoạn hội thoại
 */
function bindChatEvents() {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const clearBtn = document.getElementById("btn-clear-chat");

    // Sự kiện 1: Nhấn nút gửi hoặc Submit form
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            handleUserMessage();
        });
    }

    // Sự kiện 2: Phím tắt bàn phím (Enter = gửi, Shift + Enter = xuống dòng)
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });
    }

    // Sự kiện 3: Nút "Làm mới" cuộc trò chuyện về trạng thái ban đầu
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const container = document.getElementById("chat-messages");
            if (container) {
                container.innerHTML = `
                    <div class="flex items-start gap-3 animate-appleFadeIn">
                        <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white flex-shrink-0 mt-0.5">
                            <i class="fa-solid fa-clapperboard text-[#2997ff]"></i>
                        </div>
                        <div class="bg-[#1d1d1f] border border-white/10 rounded-2xl rounded-tl-none p-5 max-w-2xl text-xs sm:text-sm text-[#f5f5f7] leading-relaxed space-y-3 shadow-sm">
                            <p class="font-bold text-white text-sm">Đã làm mới cuộc hội thoại.</p>
                            <p class="text-[#86868b]">Hãy hỏi tôi về định hướng kỹ năng sáng tạo số hoặc yêu cầu tôi hỗ trợ phác thảo kịch bản phân cảnh nhé!</p>
                        </div>
                    </div>
                `;
            }
        });
    }
}

/**
 * Gắn sự kiện cho các nút gợi ý mẫu (Preset buttons) ở cột bên trái
 * Khi người dùng bấm vào một gợi ý, tự động điền câu hỏi vào ô chat và gửi đi
 */
function bindPresetButtons() {
    const presetBtns = document.querySelectorAll(".chat-preset-btn");
    const input = document.getElementById("chat-input");

    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const prompt = btn.getAttribute("data-preset-prompt");
            if (input && prompt) {
                input.value = prompt;
                handleUserMessage();
            }
        });
    });
}

/**
 * Luồng chính điều phối tin nhắn người dùng:
 * 1. Đọc và làm sạch nội dung nhập vào.
 * 2. Hiển thị tin nhắn người dùng lên khung chat.
 * 3. Hiển thị hiệu ứng AI đang gõ (typing indicator).
 * 4. Tạo câu trả lời thông minh sau độ trễ nhân tạo 600ms để tạo cảm giác tự nhiên.
 */
function handleUserMessage() {
    const input = document.getElementById("chat-input");
    const text = input ? input.value.trim() : "";
    if (!text) return;

    // Bước 1: Render tin nhắn của User và reset ô nhập liệu
    appendMessage(text, "user");
    input.value = "";

    // Bước 2: Hiển thị animation 3 chấm đang phản hồi
    const typingId = showTypingIndicator();

    // Bước 3: Giả lập thời gian xử lý suy nghĩ (600ms) trước khi trả lời
    setTimeout(() => {
        removeTypingIndicator(typingId);
        const { responseText, isIdea } = generateAssistantResponse(text);
        appendMessage(responseText, "bot", isIdea);
    }, 600);
}

/**
 * Chèn một bong bóng tin nhắn mới vào khung chat (hỗ trợ cả bot và user)
 * @param {string} content - Nội dung văn bản thô
 * @param {string} sender - 'user' hoặc 'bot'
 * @param {boolean} isIdea - True nếu là kịch bản phân cảnh (để kích hoạt nút 'Mở Trong Studio')
 */
function appendMessage(content, sender = "bot", isIdea = false) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    const messageWrapper = document.createElement("div");

    if (sender === "user") {
        // Giao diện bong bóng tin nhắn của người dùng (màu xanh thương hiệu Apple)
        messageWrapper.className = "flex items-start justify-end gap-2.5 animate-appleFadeIn";
        messageWrapper.innerHTML = `
            <div class="bg-[#0071e3] text-white font-normal rounded-2xl rounded-tr-none px-4 py-3 max-w-xl text-xs sm:text-sm leading-relaxed shadow-sm">
                ${escapeHtml(content).replace(/\n/g, "<br>")}
            </div>
        `;
    } else {
        // Giao diện tin nhắn từ Bot (Apple Dark Card)
        messageWrapper.className = "flex items-start gap-2.5 animate-appleFadeIn";
        const formattedHtml = formatBotResponse(content);

        // Chân trang tin nhắn: nếu là kịch bản thì hiển thị nút chuyển tiếp sang Storyboard Studio
        const actionFooter = isIdea ? `
            <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#86868b]">
                <span class="font-medium text-[#2997ff] flex items-center gap-1">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Phân Cảnh Sẵn Sàng
                </span>
                <button type="button" onclick="useInStoryboard(this)" class="apple-btn-white text-xs px-3 py-1.5 font-semibold flex items-center gap-1 cursor-pointer">
                    <span>Mở Trong Studio</span> &rarr;
                </button>
            </div>
        ` : `
            <div class="pt-2 border-t border-white/[0.06] text-[10px] text-[#86868b] font-mono flex items-center justify-between">
                <span>HARNESS Intelligence Copilot</span>
                <span class="text-[#30d158] font-medium">Trực tuyến</span>
            </div>
        `;

        messageWrapper.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-clapperboard text-[#2997ff]"></i>
            </div>
            <div class="bg-[#1d1d1f] border border-white/10 rounded-2xl rounded-tl-none p-5 max-w-2xl text-xs sm:text-sm text-[#f5f5f7] leading-relaxed space-y-3 shadow-sm">
                ${formattedHtml}
                ${actionFooter}
            </div>
        `;
    }

    // Đưa tin nhắn vào khung và tự động cuộn xuống dưới cùng
    container.appendChild(messageWrapper);
    container.scrollTop = container.scrollHeight;
}

/**
 * Hiển thị hiệu ứng 3 chấm nảy (typing indicator) khi bot đang chuẩn bị câu trả lời
 * @returns {string|null} ID duy nhất của phần tử đang gõ để xóa sau khi xong
 */
function showTypingIndicator() {
    const container = document.getElementById("chat-messages");
    if (!container) return null;

    const id = "typing-" + Date.now();
    const typingWrapper = document.createElement("div");
    typingWrapper.id = id;
    typingWrapper.className = "flex items-start gap-2.5 animate-appleFadeIn";
    typingWrapper.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-clapperboard text-[#2997ff]"></i>
        </div>
        <div class="bg-[#1d1d1f] border border-white/10 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-[#86868b] flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#2997ff] animate-bounce"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-[#2997ff] animate-bounce" style="animation-delay: 0.2s"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-[#2997ff] animate-bounce" style="animation-delay: 0.4s"></span>
        </div>
    `;
    container.appendChild(typingWrapper);
    container.scrollTop = container.scrollHeight;
    return id;
}

/**
 * Xóa hiệu ứng 3 chấm nảy theo ID khi bot đã sẵn sàng trả lời
 * @param {string} id - ID của phần tử typing indicator
 */
function removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

/**
 * BỘ NÃO ĐIỀU PHỐI PHẢN HỒI (Response Router):
 * Phân tích nội dung câu hỏi để định tuyến xử lý:
 * - Kịch bản/Ý tưởng -> generateScreenplayIdea
 * - Tư vấn nghề nghiệp/Kiến thức -> handleNormalConversation
 * @param {string} userText - Chuỗi tin nhắn người dùng
 * @returns {{ responseText: string, isIdea: boolean }}
 */
function generateAssistantResponse(userText) {
    const lower = userText.toLowerCase();

    // 1. Kiểm tra xem người dùng có đang yêu cầu TẠO KỊCH BẢN / PHÂN CẢNH hay không
    const isIdea = IDEA_REQUEST_KEYWORDS.some(kw => lower.includes(kw));

    if (isIdea) {
        return {
            responseText: generateScreenplayIdea(lower, userText),
            isIdea: true
        };
    }

    // 2. Các câu hỏi về hướng nghiệp, kỹ thuật, điện ảnh, tác giả
    return {
        responseText: handleNormalConversation(lower, userText),
        isIdea: false
    };
}

/**
 * XỬ LÝ TRÒ CHUYỆN THÔNG THƯỜNG & TƯ VẤN HƯỚNG NGHIỆP SÁNG TẠO
 * Bao gồm các chủ đề: Chào hỏi, So sánh nghề nghiệp, DoP, Storyboard Artist,
 * Lộ trình phát triển 2026, Thuật ngữ cỡ cảnh và Thông tin dự án JSB12.
 */
function handleNormalConversation(lower, rawText) {
    // 1. Lời chào ban đầu
    if (lower.includes("chào") || lower.includes("hello") || lower.includes("hi") || lower.includes("alo") || lower === "ê") {
        return `Chào bạn! Tôi là ** Trợ Lý Hướng Nghiệp & Biên Kịch ** của HARNESS PRO.\n\nTôi có thể giúp bạn: \n1. ** Tư vấn định hướng nghề nghiệp:** Phân tích kỹ năng, vai trò chuyên môn và lộ trình phát triển cho các vị trí Biên kịch, DoP, Storyboard Artist.\n2. ** Sáng tạo kịch bản phân cảnh:** Viết kịch bản video giới thiệu, video ngắn sáng tạo, phim học đường và phim tài liệu.\n3. ** Giải đáp thuật ngữ điện ảnh & quy chuẩn tiền kỳ.**\n\nBạn muốn tìm hiểu về nội dung nào hôm nay ? `;
    }

    // 2. Tư vấn so sánh: Biên kịch dài hơi vs Copywriter / Content Creator
    if (lower.includes("biên kịch") && (lower.includes("copywriter") || lower.includes("hay") || lower.includes("nên chọn"))) {
        return `Đây là câu hỏi hướng nghiệp rất thực tế giữa hai nhánh sáng tạo nội dung: \n\n` +
        `** 1. Biên Kịch (Screenwriter - Phim ảnh & Kịch bản dài):**\n` +
        `- * Thế mạnh:* Yêu thích xây dựng tâm lý nhân vật, thế giới giả tưởng, xung đột cao trào và nhịp điệu hồi truyện.\n` +
        `- * Môi trường làm việc:* Hãng phim, nhà sản xuất phim ngắn, web-drama, game narrative, dự án độc lập.\n` +
        `- * Kỹ năng cần có:* Cấu trúc 3 hồi kinh điển, xây dựng Profile nhân vật, viết lời thoại tự nhiên.\n\n` +
        `** 2. Biên Kịch Nội Dung Số & Truyền Thông (Content / Creative Writer):**\n` +
        `- * Thế mạnh:* Tư duy logic ngắn gọn, nắm bắt tâm lý người xem, tạo thông điệp súc tích và hook 3s giữ chân.\n` +
        `- * Môi trường làm việc:* Creative Agency, đơn vị sản xuất truyền thông, nhóm sáng tạo số.\n` +
        `- * Kỹ năng cần có:* Bắt nhịp xu hướng nội dung, viết phân cảnh ngắn, hiểu thị giác người xem.\n\n` +
        `💡 * Gợi ý cho bạn:* Bạn hoàn toàn có thể bắt đầu với ** HARNESS STUDIO ** để rèn luyện cả kỹ năng kể chuyện dài hơi lẫn phân cảnh ngắn cô đọng!`;
    }

    // 3. Tư vấn hướng nghiệp: Đạo diễn hình ảnh (DoP)
    if (lower.includes("dop") || lower.includes("đạo diễn hình ảnh") || lower.includes("cinematographer")) {
        return `Để trở thành một ** Đạo Diễn Hình Ảnh (DoP - Director of Photography) ** chuyên nghiệp, bạn cần chuẩn bị 4 trụ cột kỹ năng: \n\n` +
        `1. ** Tư duy Cỡ Cảnh & Bố Cục:** Làm chủ quy tắc một phần ba, góc nghiêng Dutch tilt, toàn cảnh Wide Shot và đặc tả Macro chi tiết.\n` +
        `2. ** Làm Chủ Ánh Sáng (Lighting Design):** Hiểu rõ hệ thống chiếu sáng 3 điểm (Key - Fill - Back light), ánh sáng tương phản cao và nhiệt độ màu.\n` +
        `3. ** Giao Tiếp & Phân Cảnh:** Phải biết cách đọc và vẽ Storyboard để chỉ đạo ê-kíp quay bấm máy chính xác từng giây.\n` +
        `4. ** Portfolio Thực Chiến:** Bắt đầu từ việc tạo Storyboard mẫu trên ** HARNESS STUDIO ** để chứng minh tư duy góc máy với nhà tuyển dụng.\n\n` +
        `DoP là vị trí cốt lõi định hình tính thẩm mỹ thị giác và linh hồn hình ảnh của toàn bộ tác phẩm điện ảnh.`;
    }

    // 4. Tư vấn hướng nghiệp: Họa sĩ phân cảnh (Storyboard Artist)
    if (lower.includes("storyboard artist") || lower.includes("họa sĩ phân cảnh") || lower.includes("vẽ storyboard")) {
        return `** Storyboard Artist ** là cầu nối sống còn giữa đạo diễn và toàn bộ đoàn quay: \n\n` +
        `- ** Nhiệm vụ chính:** Trực quan hóa kịch bản chữ thành các khung hình phác thảo, ghi chú rõ chuyển động máy quay và bảo toàn diện mạo nhân vật (Continuity).\n` +
        `- ** Môi trường ứng dụng:** Hoạt hình 3D, điện ảnh, video giới thiệu, game và truyền thông số.\n` +
        `- ** Kỹ năng cốt lõi:** Nắm vững ngôn ngữ điện ảnh, giải phẫu hình thể, phối cảnh không gian và tốc độ phác thảo ý tưởng nhanh.\n\n` +
        `Trong thời đại AI, một Storyboard Artist biết ứng dụng công cụ như HARNESS STUDIO sẽ tăng năng suất vượt trội so với phác thảo thủ công đơn thuần!`;
    }

    // 5. Báo cáo nghiên cứu kỹ năng & lộ trình phát triển ngành sáng tạo số
    if (lower.includes("lộ trình") || lower.includes("phát triển") || lower.includes("kỹ năng") || lower.includes("nghề nghiệp")) {
        return `Báo cáo nghiên cứu về ** Năng Lực Chuyên Môn & Lộ Trình Phát Triển Ngành Sáng Tạo Số 2026 **: \n\n` +
        `- ** Giai đoạn Khởi đầu (Fresher / Sinh viên):** Nắm vững Screenplay chuẩn, làm chủ các cỡ cảnh cơ bản (WS, MS, CU), sử dụng thành thạo các công cụ AI hỗ trợ phân cảnh.\n` +
        `- ** Biên Kịch Chuyên Nghiệp:** Khả năng nghiên cứu chủ đề sâu sắc, bóc tách nhịp điệu cốt truyện, tạo dựng xung đột hấp dẫn và truyền cảm hứng.\n` +
        `- ** DoP / Giám đốc Hình ảnh:** Tư duy chỉ đạo ánh sáng, bố cục chuyển động ống kính (Camera movement) và tính nhất quán thị giác.\n` +
        `- ** Giám Đốc Sáng Tạo (Creative Director):** Tầm nhìn nghệ thuật bao quát, khả năng gắn kết ê-kíp và truyền tải thông điệp nhân văn tới cộng đồng.\n\n` +
        `Chìa khóa quan trọng nhất để tiến xa trong ngành là sở hữu một ** Portfolio Storyboard chất lượng ** chứng minh năng lực trực quan hóa ý tưởng.`;
    }

    // 6. Cẩm nang thuật ngữ cỡ cảnh trong điện ảnh (Camera Shots)
    if (lower.includes("cỡ cảnh") || lower.includes("camera shot") || lower.includes("wide shot") || lower.includes("close up") || lower.includes("medium shot")) {
        return `Trong sản xuất video và điện ảnh, các cỡ cảnh kinh điển gồm: \n\n - ** Wide Shot (WS):** Toàn cảnh bao quát, thiết lập không gian và vị trí nhân vật trong môi trường.\n - ** Medium Shot (MS):** Trung cảnh ngang thắt lưng, nhấn mạnh tương tác và hành động.\n - ** Close-Up (CU):** Cận cảnh gương mặt bộc lộ cảm xúc ánh mắt, hoặc cận cảnh chi tiết chủ thể.\n - ** Extreme Close-Up / Macro:** Đặc tả giọt nước bắn tóe, chi tiết linh kiện máy bay, kết cấu sợi vải nghệ thuật.\n - ** Over-the-Shoulder (OTS):** Góc quay qua vai phục vụ các cảnh đối thoại hoặc tương tác giữa hai nhân vật.`;
    }

    // 7. Thông tin về tác giả và đề tài nghiên cứu JSB12
    if (lower.includes("bạn là ai") || lower.includes("ai tạo") || lower.includes("tác giả") || lower.includes("bigblyatcccp") || lower.includes("jsb12")) {
        return `Tôi là trợ lý AI được tích hợp trong nền tảng ** HARNESS PRO **, thuộc ** Dự án Nghiên Cứu Khoa Học Kỹ Thuật JSB12 **, được nghiên cứu và phát triển bởi tác giả ** bigblyatcccp **.\n\nHệ thống hướng đến mục tiêu: ** Hướng nghiệp sáng tạo số cho thế hệ trẻ ** và ** Nghiên cứu tự động hóa quy trình sản xuất điện ảnh, truyền thông số **.`;
    }

    // 8. Phản hồi mặc định khi không khớp chủ đề cụ thể
    return `Tôi hiểu câu hỏi của bạn! Tôi có thể hỗ trợ bạn sâu hơn về cả hai hướng: \n\n - 🎓 ** Định hướng nghề nghiệp:** Hỏi về kỹ năng, trường đào tạo, lộ trình phát triển trong ngành sáng tạo.\n - 🎬 ** Biên kịch & Phân cảnh:** Nhắn tin yêu cầu: * "Hãy lên kịch bản video về..." * để nhận ngay kịch bản phân cảnh hoàn chỉnh!`;
}

/**
 * XỬ LÝ SINH KỊCH BẢN PHÂN CẢNH MẪU (SCREENPLAY GENERATOR)
 * Hỗ trợ nhận diện các chủ đề: Nước uống/F&B, Công nghệ/Smartphone, Giới thiệu đơn vị/Startup,
 * Video ngắn TikTok/Reels, hoặc kịch bản 3 màn khái quát dựa theo yêu cầu của người dùng.
 * @param {string} lower - Tin nhắn dạng chữ thường
 * @param {string} userText - Tin nhắn gốc
 */
function generateScreenplayIdea(lower, userText) {
    // 1. Kịch bản Video Giới thiệu / F&B / Thức uống thể thao
    if (lower.includes("nước") || lower.includes("thức uống") || lower.includes("giải khát") || lower.includes("thể thao") || lower.includes("f&b")) {
        return `Dưới đây là kịch bản video 30s Giới Thiệu Nước Uống Thể Thao Tăng Lực:

** CẢNH 1: CƠN KHÁT GIỮA TRƯA HÈ (Toàn cảnh - Wide Shot) **
- * Góc máy:* Wide Shot góc thấp, ánh nắng chói chang chiếu xuống đường chạy điền kinh bốc hơi nóng.
- * Diễn biến:* Vận động viên thở dốc, từng giọt mồ hôi rơi xuống mặt đường nứt nẻ; anh dừng chân trước vạch đích trong trạng thái cạn kiệt năng lượng.

** CẢNH 2: MỞ NẮP & NĂNG LƯỢNG BÙNG NỔ (Cận cảnh cực đại - Macro ECU) **
- * Góc máy:* Macro Extreme Close-Up với tốc độ quay siêu chậm (Slow-motion 240fps).
- * Diễn biến:* Bàn tay bật nắp lon; làn sóng hơi sương lạnh ngắt cùng các bọt khí khoáng chất bắn tóe lấp lánh phản chiếu ánh sáng studio xanh ngọc mát rượi.

** CẢNH 3: BỨT PHÁ VỀ ĐÍCH (Trung cảnh động - Medium Tracking Shot) **
- * Góc máy:* Medium Tracking Shot di chuyển song song với bước chạy mãnh liệt.
- * Diễn biến:* Đôi mắt rực sáng quyết tâm, cơ bắp cuồn cuộn bứt phá vượt qua đối thủ và chạm tay vào dải băng chiến thắng trong tiếng reo hò vang dội.

** CẢNH 4: KHẲNG ĐỊNH THÔNG ĐIỆP (Cận cảnh tĩnh - Close-Up Shot) **
- * Góc máy:* Close-Up góc Eye-level trang trọng, ánh sáng studio xoay tròn.
- * Diễn biến:* Chai sản phẩm đặt trên bục băng tuyết lấp lánh; thông điệp xuất hiện: * "Bứt Phá Mọi Giới Hạn - Năng Lượng Từ Tự Nhiên".* `;
    }

    // 2. Kịch bản Video Công nghệ / Thiết bị số / Smartphone
    if (lower.includes("smartphone") || lower.includes("điện thoại") || lower.includes("công nghệ") || lower.includes("tai nghe") || lower.includes("laptop")) {
        return `Dưới đây là kịch bản video 30s Giới Thiệu Thiết Bị Smartphone Công Nghệ Mới:

** CẢNH 1: KHÔNG GIAN BÓNG TỐI & ĐƯỜNG NÉT TITAN (Cận cảnh góc nghiêng - Dutch Close-Up) **
- * Góc máy:* Dutch Close-Up trong phông nền studio tối đen, dải đèn led xanh tím quét qua viền máy.
- * Diễn biến:* Thân máy titan siêu mỏng lơ lửng xoay nhẹ trong không trung, các đường cắt kim cương phản chiếu ánh sáng tinh tế và chuẩn xác đến từng micromet.

** CẢNH 2: ỐNG KÍNH TIỀM VỌNG THỨC TỈNH (Đại cận cảnh - Extreme Macro Shot) **
- * Góc máy:* Extreme Macro Shot nhìn sâu vào cụm 3 camera sapphire.
- * Diễn biến:* Ống kính cơ học mở khẩu độ tí tách, phản chiếu cả một dải ngân hà lấp lánh; cảm biến ánh sáng thế hệ mới bừng sáng tạo hiệu ứng ánh hào quang công nghệ.

** CẢNH 3: MÀN HÌNH VÔ CỰC TRÀN VIỀN (Trung cảnh - Medium Shot) **
- * Góc máy:* Medium Shot góc ngang Eye-level.
- * Diễn biến:* Màn hình AMOLED 8K bật sáng rực rỡ hiển thị thế giới tự nhiên sống động đến kinh ngạc, phá vỡ mọi đường biên thị giác thông thường.

** CẢNH 4: THÔNG ĐIỆP TIÊN PHONG (Toàn cảnh Studio - Wide Packshot) **
- * Góc máy:* Wide Packshot kết hợp biểu tượng thiết kế 3D.
- * Diễn biến:* Chiếc điện thoại đáp xuống mặt đế sạc không dây phát sáng; dòng chữ xuất hiện: * "Chạm Vào Tương Lai - Tiên Phong Đẳng Cấp".* `;
    }

    // 3. Phim Giới thiệu Đơn vị / Hành trình khởi nghiệp / Phim kỷ niệm
    if (lower.includes("doanh nghiệp") || lower.includes("công ty") || lower.includes("khởi nghiệp") || lower.includes("startup") || lower.includes("kỷ niệm")) {
        return `Dưới đây là kịch bản Phim Kể Chuyện Hành Trình Phát Triển:

** CẢNH 1: GIAN PHÒNG KHỞI ĐẦU BAN ĐẦU (Toàn cảnh tối - Low-key Wide Shot) **
- * Góc máy:* Wide Shot với ánh sáng vàng ấm từ chiếc đèn bàn đơn độc lúc nửa đêm.
- * Diễn biến:* Hai nhà nghiên cứu trẻ tuổi thức trắng đêm bên những bản vẽ phác thảo và dòng mã nguồn đầu tiên, ánh mắt kiên định trước những thử thách ban đầu.

** CẢNH 2: VƯỢT QUA KHÓ KHĂN THỬ THÁCH (Trung cảnh qua vai - OTS Medium Shot) **
- * Góc máy:* Over-the-Shoulder Shot tập trung trong phòng làm việc.
- * Diễn biến:* Cả nhóm đối mặt với những bài toán hóc búa; người trưởng nhóm bước lên bảng phác thảo hướng đi mới trong tiếng gật đầu đồng lòng của cộng sự.

** CẢNH 3: MÔI TRƯỜNG HIỆN ĐẠI & TẦM NHÌN TƯƠNG LAI (Toàn cảnh rộng - High-angle Wide Shot) **
- * Góc máy:* High-angle Wide Shot flycam lướt qua không gian nghiên cứu sáng tạo ngập tràn ánh nắng bình minh.
- * Diễn biến:* Hàng chục nhà nghiên cứu trẻ tuổi cùng nhau trao đổi, làm việc và thử nghiệm sản phẩm; biểu trưng cho sự trưởng thành vượt bậc sau một chặng đường.

** CẢNH 4: KHÁT VỌNG CỐNG HIẾN (Cận cảnh chân dung - Hero Close-Up) **
- * Góc máy:* Close-Up chính diện ánh mắt người trưởng nhóm nhìn thẳng về phía trước.
- * Diễn biến:* Nụ cười tự tin và thông điệp lan tỏa: * "Kết Nối Đam Mê - Kiến Tạo Tương Lai Bền Vững".* `;
    }

    // 4. Video Ngắn Sáng Tạo (TikTok / Reels / YouTube Shorts)
    if (lower.includes("tiktok") || lower.includes("reels") || lower.includes("viral") || lower.includes("ngắn") || lower.includes("video")) {
        return `Dưới đây là kịch bản Video Ngắn 45s Sáng Tạo Đời Thường:

** CẢNH 1: HOOK 3S GÂY TÒ MÒ CỰC MẠNH (Cận cảnh nhanh - Dynamic Close-Up) **
- * Góc máy:* Cận cảnh góc quay nhanh từ trên xuống, âm thanh 'Drop' kịch tính.
- * Diễn biến:* Một cốc cà phê sánh đặc bị đổ tung tóe lên bộ ghế sofa trắng tinh; nhân vật chính giật mình: * "Đừng lo, hãy xem cách giải quyết sự cố trong 5 giây này!" *

** CẢNH 2: GIẢI PHÁP THÔNG MINH (Trung cảnh hành động - Medium Action Shot) **
- * Góc máy:* Trung cảnh chuyển động mượt, ánh sáng ban ngày rõ nét.
- * Diễn biến:* Nhân vật lấy chiếc bình xịt nano sinh học xịt nhẹ 2 lần; lớp bọt hoạt tính sủi bọt nhẹ nhàng đẩy vết ố ra khỏi sợi vải.

** CẢNH 3: KẾT QUẢ KINH NGẠC (Cận cảnh lau sạch - Macro Wipe Shot) **
- * Góc máy:* Macro cực nét miêu tả đường khăn lau qua đến đâu thì bề mặt sáng sạch tinh tươm đến đó.
- * Diễn biến:* Gương mặt thở phào nhẹ nhõm và nụ cười rạng rỡ của nhân vật khi mọi thứ trở lại nguyên vẹn như mới.

** CẢNH 4: KẾT LUẬN & THÔNG ĐIỆP (Cận cảnh nụ cười - Close-Up Shot) **
- * Góc máy:* Cận cảnh nụ cười tươi tắn của nhân vật.
- * Diễn biến:* Nhân vật chia sẻ thông điệp gần gũi: * "Công nghệ và sáng tạo luôn giúp cuộc sống đơn giản, tiện nghi hơn mỗi ngày!" * `;
    }

    // 5. Cấu trúc kịch bản phân cảnh 3 màn tổng quát cho mọi yêu cầu khác
    return `Dưới đây là kịch bản phân cảnh dựa trên yêu cầu: ** "${escapeHtml(userText)}" **

** CẢNH 1: THIẾT LẬP BỐI CẢNH & VẤN ĐỀ (Toàn cảnh - Wide Shot) **
- * Góc máy:* Wide Shot bao quát thiết lập không gian, nhân vật chính xuất hiện đối diện với thử thách hoặc nhu cầu then chốt.

** CẢNH 2: CAO TRÀO & BƯỚC ĐỘT PHÁ (Trung cảnh - Medium Shot) **
- * Góc máy:* Medium Shot bắt trọn hành động và chuyển biến tâm lý, giải pháp xuất hiện tháo gỡ nút thắt của câu chuyện.

** CẢNH 3: KẾT QUẢ & THÔNG ĐIỆP (Cận cảnh biểu cảm - Close-Up Shot) **
- * Góc máy:* Close-Up cảm xúc hoặc cận cảnh chủ thể khẳng định thông điệp và lan tỏa cảm xúc sâu sắc.`;
}

/**
 * Định dạng Markdown cơ bản của bot sang HTML:
 * - Chống XSS bằng escapeHtml trước khi bọc thẻ.
 * - Chuyển **chữ đậm** thành <b class="text-white font-bold">.
 * - Chuyển *chữ nghiêng* thành <i class="text-[#86868b] font-medium">.
 * - Chuyển dấu xuống dòng \n thành <br>.
 */
function formatBotResponse(text) {
    let formatted = escapeHtml(text);
    
    // In đậm (Bold text)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-bold">$1</b>');
    // In nghiêng (Italic text)
    formatted = formatted.replace(/\*(.*?)\*/g, '<i class="text-[#86868b] font-medium">$1</i>');
    // Xuống hàng (Line breaks)
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

/**
 * Nút hành động: "Mở Trong Studio"
 * Trích xuất toàn bộ văn bản kịch bản phân cảnh do AI gợi ý (đã loại bỏ nút con),
 * lưu vào sessionStorage với khóa 'imported_chat_prompt',
 * sau đó chuyển hướng người dùng trực tiếp sang trang /storyboard để tạo ảnh AI.
 */
window.useInStoryboard = function(btn) {
    const messageBox = btn.closest(".bg-\\[\\#1d1d1f\\]") || btn.closest(".bg-slate-50") || btn.parentElement;
    if (!messageBox) return;

    // Nhân bản DOM để bóc tách văn bản sạch (loại bỏ nút bấm)
    const clone = messageBox.cloneNode(true);
    const footer = clone.querySelector("div");
    if (footer && (clone.lastElementChild === footer || footer.classList.contains("border-t"))) {
        footer.remove();
    }
    const text = clone.innerText.trim();
    
    // Lưu vào bộ nhớ phiên làm việc và chuyển hướng sang Studio
    sessionStorage.setItem("imported_chat_prompt", text);
    window.location.href = "/storyboard";
};

/**
 * Hàm tiện ích: Escape các ký tự đặc biệt trong HTML để ngăn chặn tấn công XSS
 * @param {string} str - Chuỗi đầu vào
 * @returns {string} Chuỗi an toàn
 */
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
