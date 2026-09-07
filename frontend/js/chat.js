// chat.js - Trợ Lý Hướng Nghiệp & Biên Kịch Thương Mại (Career & Commercial Copilot)

document.addEventListener("DOMContentLoaded", () => {
    initChatModule();
});

// Từ khóa nhận diện người dùng YÊU CẦU TẠO Ý TƯỞNG / KỊCH BẢN
const IDEA_REQUEST_KEYWORDS = [
    "ý tưởng", "y tuong", "kịch bản", "kich ban", "cốt truyện", "cot truyen",
    "phân cảnh", "phan canh", "gợi ý", "goi y", "tạo cho", "tao cho", "viết cho",
    "viet cho", "hãy viết", "hay viet", "hãy tạo", "hay tao", "làm cho", "lam cho",
    "kể câu chuyện", "ke cau chuyen", "viết một", "viet mot", "tạo một", "tao mot",
    "lên kịch bản", "len kich ban", "lên ý tưởng", "len y tuong", "phim về", "phim ve",
    "câu chuyện về", "cau chuyen ve", "storyboard về", "storyboard ve",
    "tvc về", "tvc ve", "quảng cáo về", "quang cao ve", "video tiktok", "video ngắn"
];

function initChatModule() {
    bindChatEvents();
    bindPresetButtons();
}

function bindChatEvents() {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const clearBtn = document.getElementById("btn-clear-chat");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            handleUserMessage();
        });
    }

    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            const container = document.getElementById("chat-messages");
            if (container) {
                container.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-2xs">
                            <i class="fa-solid fa-clapperboard text-indigo-300 text-[10px]"></i>
                        </div>
                        <div class="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-5 max-w-xl text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2.5 shadow-2xs">
                            <p class="font-bold text-slate-950 text-sm">Đã làm mới cuộc hội thoại.</p>
                            <p>Hãy hỏi tôi về định hướng nghề nghiệp sáng tạo số hoặc yêu cầu tôi viết kịch bản TVC thương mại nhé!</p>
                        </div>
                    </div>
                `;
            }
        });
    }
}

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

function handleUserMessage() {
    const input = document.getElementById("chat-input");
    const text = input ? input.value.trim() : "";
    if (!text) return;

    // 1. Hiển thị tin nhắn người dùng
    appendMessage(text, "user");
    input.value = "";

    // 2. Hiển thị hiệu ứng đang gõ
    const typingId = showTypingIndicator();

    // 3. Phản hồi phù hợp
    setTimeout(() => {
        removeTypingIndicator(typingId);
        const { responseText, isIdea } = generateAssistantResponse(text);
        appendMessage(responseText, "bot", isIdea);
    }, 600);
}

function appendMessage(content, sender = "bot", isIdea = false) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    const messageWrapper = document.createElement("div");

    if (sender === "user") {
        messageWrapper.className = "flex items-start justify-end gap-2.5 animate-appleFadeIn";
        messageWrapper.innerHTML = `
            <div class="bg-[#0071e3] text-white font-normal rounded-2xl rounded-tr-none px-4 py-3 max-w-xl text-xs sm:text-sm leading-relaxed shadow-sm">
                ${escapeHtml(content).replace(/\n/g, "<br>")}
            </div>
        `;
    } else {
        messageWrapper.className = "flex items-start gap-2.5 animate-appleFadeIn";
        const formattedHtml = formatBotResponse(content);

        // Nút chuyển sang Storyboard xuất hiện khi phản hồi có kịch bản phân cảnh
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

    container.appendChild(messageWrapper);
    container.scrollTop = container.scrollHeight;
}

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
            <span class="ml-2 font-mono text-[11px] text-[#86868b]">Đang suy nghĩ...</span>
        </div>
    `;

    container.appendChild(typingWrapper);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

// BỘ XỬ LÝ PHẢN HỒI THÔNG MINH
function generateAssistantResponse(userText) {
    const lower = userText.toLowerCase().trim();

    // 1. Kiểm tra xem người dùng có đang YÊU CẦU TẠO Ý TƯỞNG / KỊCH BẢN không
    const isRequestingIdea = IDEA_REQUEST_KEYWORDS.some(kw => lower.includes(kw));

    if (isRequestingIdea) {
        return {
            isIdea: true,
            responseText: generateScreenplayIdea(lower, userText)
        };
    }

    // 2. NẾU KHÔNG YÊU CẦU Ý TƯỞNG -> TRÒ CHUYỆN / TƯ VẤN HƯỚNG NGHIỆP / HỎI ĐÁP
    return {
        isIdea: false,
        responseText: handleNormalConversation(lower, userText)
    };
}

// Xử lý trò chuyện thông thường & tư vấn hướng nghiệp
function handleNormalConversation(lower, rawText) {
    // Chào hỏi
    if (lower.includes("chào") || lower.includes("hello") || lower.includes("hi") || lower.includes("alo") || lower === "ê") {
        return `Chào bạn! Tôi là **Trợ Lý Hướng Nghiệp & Biên Kịch Thương Mại** của HARNESS PRO.\n\nTôi có thể giúp bạn:\n1. **Tư vấn định hướng nghề nghiệp:** Phân tích kỹ năng, cơ hội việc làm và lộ trình phát triển cho các vị trí Biên kịch, DoP, Storyboard Artist.\n2. **Sáng tạo kịch bản thương mại:** Viết kịch bản TVC 30s, video viral TikTok, phim doanh nghiệp.\n3. **Giải đáp thuật ngữ điện ảnh & quy chuẩn tiền kỳ.**\n\nBạn muốn tìm hiểu về nội dung nào hôm nay?`;
    }

    // Tư vấn so sánh: Biên kịch vs Copywriter
    if (lower.includes("biên kịch") && (lower.includes("copywriter") || lower.includes("hay") || lower.includes("nên chọn"))) {
        return `Đây là câu hỏi hướng nghiệp rất thực tế giữa hai nhánh sáng tạo nội dung:\n\n` +
        `**1. Biên Kịch (Screenwriter - Phim ảnh & Kịch bản dài):**\n` +
        `- *Thế mạnh:* Yêu thích xây dựng tâm lý nhân vật, thế giới giả tưởng, xung đột cao trào và nhịp điệu hồi truyện.\n` +
        `- *Cơ hội:* Hãng phim, nhà sản xuất phim ngắn, web-drama, game narrative.\n` +
        `- *Thu nhập:* 15M - 40M VNĐ/tháng (hoặc theo gói kịch bản 50M - 200M/dự án).\n\n` +
        `**2. Commercial Copywriter (Biên kịch Quảng cáo & TVC):**\n` +
        `- *Thế mạnh:* Tư duy logic ngắn gọn, nắm bắt tâm lý khách hàng (Customer Insight), viết slogan và hook 3s giữ chân.\n` +
        `- *Cơ hội:* Creative Agency, Nhãn hàng, Production House sản xuất TVC.\n` +
        `- *Thu nhập:* 18M - 50M VNĐ/tháng (nhu cầu tuyển dụng liên tục quanh năm).\n\n` +
        `💡 *Gợi ý cho bạn:* Nếu muốn có thu nhập nhanh và nhạy bén với thị trường, **Copywriter thương mại** là điểm khởi đầu lý tưởng; bạn hoàn toàn có thể dùng HARNESS STUDIO để luyện cả hai!`;
    }

    // Tư vấn: Đạo diễn hình ảnh (DoP)
    if (lower.includes("dop") || lower.includes("đạo diễn hình ảnh") || lower.includes("cinematographer")) {
        return `Để trở thành một **Đạo Diễn Hình Ảnh (DoP - Director of Photography)** chuyên nghiệp, bạn cần chuẩn bị 4 trụ cột kỹ năng:\n\n` +
        `1. **Tư duy Cỡ Cảnh & Bố Cục:** Làm chủ quy tắc một phần ba, góc nghiêng Dutch tilt, toàn cảnh Wide Shot và đặc tả Macro sản phẩm.\n` +
        `2. **Làm Chủ Ánh Sáng (Lighting Design):** Hiểu rõ hệ thống chiếu sáng 3 điểm (Key - Fill - Back light), ánh sáng tương phản cao (High-contrast) cho TVC sang trọng.\n` +
        `3. **Giao Tiếp & Phân Cảnh:** Phải biết cách đọc và vẽ Storyboard để chỉ đạo ê-kíp quay bấm máy chính xác từng giây.\n` +
        `4. **Portfolio Thực Chiến:** Bắt đầu từ việc tạo Storyboard mẫu trên **HARNESS STUDIO** để chứng minh tư duy góc máy với nhà tuyển dụng.\n\n` +
        `Thu nhập trung bình của DoP tại Việt Nam dao động từ **25.000.000đ đến 70.000.000đ/dự án TVC**.`;
    }

    // Tư vấn: Storyboard Artist
    if (lower.includes("storyboard artist") || lower.includes("họa sĩ phân cảnh") || lower.includes("vẽ storyboard")) {
        return `**Storyboard Artist** là cầu nối sống còn giữa đạo diễn và toàn bộ đoàn quay:\n\n` +
        `- **Nhiệm vụ chính:** Trực quan hóa kịch bản chữ thành các khung hình phác thảo, ghi chú rõ chuyển động máy quay và bảo toàn diện mạo nhân vật (Continuity).\n` +
        `- **Nhu cầu thị trường:** Rất cao trong ngành quảng cáo (TVC), hoạt hình 3D, game và điện ảnh.\n` +
        `- **Thu nhập:** 15M - 40M VNĐ/tháng (Freelancer nhận từ 300.000đ - 1.000.000đ/khung hình phác thảo).\n\n` +
        `Trong thời đại AI, một Storyboard Artist biết ứng dụng công cụ như HARNESS STUDIO sẽ tăng năng suất gấp 10 lần so với vẽ tay truyền thống!`;
    }

    // Thu nhập & Mức lương
    if (lower.includes("lương") || lower.includes("thu nhập") || lower.includes("tiền lương") || lower.includes("nhu cầu tuyển dụng")) {
        return `Báo cáo thị trường nhân lực ngành **Truyền Thông & Sáng Tạo Số 2026**:\n\n` +
        `- **Fresher / Mới ra trường:** 9.000.000đ - 14.000.000đ / tháng.\n` +
        `- **Commercial Copywriter (2-3 năm KN):** 20.000.000đ - 35.000.000đ / tháng.\n` +
        `- **DoP / Giám đốc hình ảnh:** 30.000.000đ - 80.000.000đ / dự án.\n` +
        `- **Creative Director (Giám đốc Sáng tạo Agency):** 50.000.000đ - 120.000.000đ / tháng.\n\n` +
        `Bí quyết để đạt mức lương cao là sở hữu một **Portfolio Storyboard chất lượng** chứng minh khả năng thương mại hóa ý tưởng.`;
    }

    // Hỏi về cỡ cảnh (Camera Shots)
    if (lower.includes("cỡ cảnh") || lower.includes("camera shot") || lower.includes("wide shot") || lower.includes("close up") || lower.includes("medium shot")) {
        return `Trong sản xuất TVC và điện ảnh, các cỡ cảnh kinh điển gồm:\n\n- **Wide Shot (WS):** Toàn cảnh bao quát, thiết lập không gian và vị trí nhân vật trong môi trường.\n- **Medium Shot (MS):** Trung cảnh ngang thắt lưng, nhấn mạnh tương tác và hành động.\n- **Close-Up (CU):** Cận cảnh gương mặt bộc lộ cảm xúc ánh mắt, hoặc cận cảnh thương hiệu sản phẩm.\n- **Extreme Close-Up / Macro:** Đặc tả giọt nước bắn tóe, chi tiết vi mạch điện thoại, kết cấu sợi vải cao cấp.\n- **Over-the-Shoulder (OTS):** Góc quay qua vai phục vụ các cảnh đối thoại hoặc đàm phán hợp đồng.`;
    }

    // Hỏi về tác giả & dự án
    if (lower.includes("bạn là ai") || lower.includes("ai tạo") || lower.includes("tác giả") || lower.includes("bigblyatcccp") || lower.includes("jsb12")) {
        return `Tôi là trợ lý AI được tích hợp trong nền tảng **HARNESS PRO**, thuộc **Dự án Nghiên Cứu Khoa Học Kỹ Thuật JSB12**, được nghiên cứu và phát triển bởi tác giả **bigblyatcccp**.\n\nHệ thống hướng đến mục tiêu kép: **Hướng nghiệp sáng tạo số cho thế hệ mới** và **Thương mại hóa quy trình sản xuất điện ảnh, truyền thông số**.`;
    }

    // Trò chuyện chung
    return `Tôi hiểu câu hỏi của bạn! Tôi có thể hỗ trợ bạn sâu hơn về cả hai hướng:\n\n- 🎓 **Định hướng nghề nghiệp:** Hỏi về kỹ năng, trường đào tạo, lộ trình thăng tiến trong ngành media.\n- 💼 **Biên kịch thương mại:** Nhắn tin yêu cầu: *"Hãy lên kịch bản TVC về..."* để nhận ngay kịch bản phân cảnh hoàn chỉnh!`;
}

// Xử lý khi người dùng YÊU CẦU TẠO Ý TƯỞNG / KỊCH BẢN
function generateScreenplayIdea(lower, userText) {
    // 1. TVC Nước giải khát / F&B
    if (lower.includes("nước") || lower.includes("thức uống") || lower.includes("giải khát") || lower.includes("thể thao") || lower.includes("f&b")) {
        return `Dưới đây là kịch bản TVC 30s Quảng Cáo Nước Uống Thể Thao Tăng Lực:

**CẢNH 1: CƠN KHÁT GIỮA TRƯA HÈ (Toàn cảnh - Wide Shot)**
- *Góc máy:* Wide Shot góc thấp, ánh nắng chói chang chiếu xuống đường chạy điền kinh bốc hơi nóng.
- *Diễn biến:* Vận động viên thở dốc, từng giọt mồ hôi rơi xuống mặt đường nứt nẻ; anh dừng chân trước vạch đích trong trạng thái cạn kiệt năng lượng.

**CẢNH 2: MỞ NẮP & NĂNG LƯỢNG BÙNG NỔ (Cận cảnh cực đại - Macro ECU)**
- *Góc máy:* Macro Extreme Close-Up với tốc độ quay siêu chậm (Slow-motion 240fps).
- *Diễn biến:* Bàn tay bật nắp lon; làn sóng hơi sương lạnh ngắt cùng các bọt khí khoáng chất bắn tóe lấp lánh phản chiếu ánh sáng studio xanh ngọc mát rượi.

**CẢNH 3: BỨT PHÁ VỀ ĐÍCH (Trung cảnh động - Medium Tracking Shot)**
- *Góc máy:* Medium Tracking Shot di chuyển song song với bước chạy mãnh liệt.
- *Diễn biến:* Đôi mắt rực sáng quyết tâm, cơ bắp cuồn cuộn bứt phá vượt qua đối thủ và chạm tay vào dải băng chiến thắng trong tiếng reo hò vang dội.

**CẢNH 4: KHẲNG ĐỊNH THƯƠNG HIỆU (Cận cảnh tĩnh - Close-Up Packshot)**
- *Góc máy:* Close-Up góc Eye-level trang trọng, ánh sáng studio xoay tròn.
- *Diễn biến:* Chai sản phẩm đặt trên bục băng tuyết lấp lánh; slogan xuất hiện: *"Bứt Phá Mọi Giới Hạn - Năng Lượng Từ Tự Nhiên".*`;
    }

    // 2. TVC Công nghệ / Smartphone / Hi-Tech
    if (lower.includes("smartphone") || lower.includes("điện thoại") || lower.includes("công nghệ") || lower.includes("tai nghe") || lower.includes("laptop")) {
        return `Dưới đây là kịch bản TVC Thương Mại 30s Ra Mắt Siêu Phẩm Smartphone 8K:

**CẢNH 1: KHÔNG GIAN BÓNG TỐI & ĐƯỜNG NÉT TITAN (Cận cảnh góc nghiêng - Dutch Close-Up)**
- *Góc máy:* Dutch Close-Up trong phông nền studio tối đen, dải đèn led xanh tím quét qua viền máy.
- *Diễn biến:* Thân máy titan siêu mỏng lơ lửng xoay nhẹ trong không trung, các đường cắt kim cương phản chiếu ánh sáng tinh tế và chuẩn xác đến từng micromet.

**CẢNH 2: ỐNG KÍNH TIỀM VỌNG THỨC TỈNH (Đại cận cảnh - Extreme Macro Shot)**
- *Góc máy:* Extreme Macro Shot nhìn sâu vào cụm 3 camera sapphire.
- *Diễn biến:* Ống kính cơ học mở khẩu độ tí tách, phản chiếu cả một dải ngân hà lấp lánh; cảm biến ánh sáng thế hệ mới bừng sáng tạo hiệu ứng ánh hào quang công nghệ.

**CẢNH 3: MÀN HÌNH VÔ CỰC TRÀN VIỀN (Trung cảnh - Medium Shot)**
- *Góc máy:* Medium Shot góc ngang Eye-level.
- *Diễn biến:* Màn hình AMOLED 8K bật sáng rực rỡ hiển thị thế giới tự nhiên sống động đến kinh ngạc, phá vỡ mọi đường biên thị giác thông thường.

**CẢNH 4: THÔNG ĐIỆP ĐỈNH CAO (Toàn cảnh Studio - Wide Packshot)**
- *Góc máy:* Wide Packshot kết hợp logo thương hiệu nổi 3D.
- *Diễn biến:* Chiếc điện thoại đáp xuống mặt đế sạc không dây phát sáng; dòng chữ định vị xuất hiện: *"Chạm Vào Tương Lai - Tiên Phong Đẳng Cấp".*`;
    }

    // 3. Phim Doanh nghiệp / Khởi nghiệp / Kỷ niệm
    if (lower.includes("doanh nghiệp") || lower.includes("công ty") || lower.includes("khởi nghiệp") || lower.includes("startup") || lower.includes("kỷ niệm")) {
        return `Dưới đây là kịch bản Phim Câu Chuyện Doanh Nghiệp (Corporate Brand Story):

**CẢNH 1: GIAN PHÒNG TRỌ KHỞI NGHIỆP BAN ĐẦU (Toàn cảnh tối - Low-key Wide Shot)**
- *Góc máy:* Wide Shot với ánh sáng vàng ấm từ chiếc đèn bàn đơn độc lúc nửa đêm.
- *Diễn biến:* Hai nhà sáng lập trẻ tuổi thức trắng đêm bên những bản vẽ phác thảo và dòng mã nguồn đầu tiên, ánh mắt kiên định dù xung quanh là những thùng mì gói dở dang.

**CẢNH 2: VƯỢT QUA SÓNG GIÓ THỊ TRƯỜNG (Trung cảnh qua vai - OTS Medium Shot)**
- *Góc máy:* Over-the-Shoulder Shot căng thẳng trong phòng họp.
- *Diễn biến:* Cả nhóm đối mặt với biểu đồ khủng hoảng; người sáng lập bước lên bảng gạch đi phương án cũ và vẽ nên con đường đột phá mới trong tiếng gật đầu đồng lòng của cộng sự.

**CẢNH 3: TRỤ SỞ HIỆN ĐẠI & TẦM NHÌN TOÀN CẦU (Toàn cảnh rộng - High-angle Wide Shot)**
- *Góc máy:* High-angle Wide Shot flycam lướt qua tòa tháp văn phòng kính hiện đại ngập tràn ánh nắng bình minh.
- *Diễn biến:* Hàng trăm nhân sự trẻ trung nhiệt huyết cùng nhau trao đổi, làm việc và bắt tay đối tác quốc tế; biểu trưng cho sự trưởng thành vượt bậc sau một thập kỷ.

**CẢNH 4: KHÁT VỌNG PHỤNG SỰ (Cận cảnh chân dung - Hero Close-Up)**
- *Góc máy:* Close-Up chính diện ánh mắt người lãnh đạo nhìn thẳng về phía trước.
- *Diễn biến:* Nụ cười tự tin và lời tuyên ngôn thương hiệu: *"Kiến Tạo Giá Trị Bền Vững - Đồng Hành Cùng Hàng Triệu Khách Hàng".*`;
    }

    // 4. Video TikTok / Reels E-Commerce
    if (lower.includes("tiktok") || lower.includes("reels") || lower.includes("viral") || lower.includes("bán hàng") || lower.includes("e-commerce")) {
        return `Dưới đây là kịch bản Video TikTok 45s Giữ Chân Người Xem & Chốt Đơn E-Commerce:

**CẢNH 1: HOOK 3S GÂY TÒ MÒ CỰC MẠNH (Cận cảnh nhanh - Dynamic Close-Up)**
- *Góc máy:* Cận cảnh góc quay nhanh từ trên xuống, âm thanh 'Drop' giật gân.
- *Diễn biến:* Một cốc cà phê sánh đặc bị đổ tung tóe lên bộ ghế sofa trắng tinh; nhân vật chính ôm đầu hét lên kinh hãi: *"Đừng vội vứt ghế đi, xem cách tôi xử lý trong 5 giây này!"*

**CẢNH 2: GIẢI PHÁP THẦN TỐC (Trung cảnh hành động - Medium Action Shot)**
- *Góc máy:* Trung cảnh chuyển động mượt, ánh sáng ban ngày rõ nét.
- *Diễn biến:* Nhân vật lấy chiếc bình xịt nano sinh học xịt nhẹ 2 lần; lớp bọt hoạt tính sủi bọt đẩy bật mọi vết ố cứng đầu ra khỏi sợi vải.

**CẢNH 3: KẾT QUẢ KINH NGẠC (Cận cảnh lau sạch - Macro Wipe Shot)**
- *Góc máy:* Macro cực nét miêu tả đường khăn lau qua đến đâu thì sofa trắng sáng tinh tươm đến đó.
- *Diễn biến:* Gương mặt thở phào nhẹ nhõm và nụ cười rạng rỡ của nhân vật khi chiếc ghế trở lại như mới mua từ showroom.

**CẢNH 4: CALL TO ACTION CHỐT ĐƠN (Cận cảnh màn hình - CTA Close-Up)**
- *Góc máy:* Cận cảnh điện thoại có ngón tay chỉ thẳng xuống góc trái màn hình.
- *Diễn biến:* Nhân vật cầm chai sản phẩm giơ lên: *"Hôm nay đang có flash sale giảm 40% chỉ còn 100 suất, bấm ngay vào giỏ hàng bên dưới để nhận ưu đãi nhé!"*`;
    }

    // 5. Ý tưởng tổng quát / Kịch bản phân cảnh khác
    return `Dưới đây là kịch bản phân cảnh dựa trên yêu cầu: **"${escapeHtml(userText)}"**

**CẢNH 1: THIẾT LẬP BỐI CẢNH & VẤN ĐỀ (Toàn cảnh - Wide Shot)**
- *Góc máy:* Wide Shot bao quát thiết lập không gian, nhân vật chính xuất hiện đối diện với thử thách hoặc nhu cầu then chốt.

**CẢNH 2: CAO TRÀO & BƯỚC ĐỘT PHÁ (Trung cảnh - Medium Shot)**
- *Góc máy:* Medium Shot bắt trọn hành động và chuyển biến tâm lý, giải pháp xuất hiện tháo gỡ nút thắt của câu chuyện.

**CẢNH 3: KẾT QUẢ & THÔNG ĐIỆP CHỐT HẠ (Cận cảnh biểu cảm - Close-Up Shot)**
- *Góc máy:* Close-Up cảm xúc hoặc cận cảnh sản phẩm/thương hiệu khẳng định giá trị và lan tỏa thông điệp sâu sắc.`;
}

function formatBotResponse(text) {
    let formatted = escapeHtml(text);
    
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-950 font-bold">$1</b>');
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<i class="text-slate-600 font-medium">$1</i>');
    // Newlines
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

window.useInStoryboard = function(btn) {
    const messageBox = btn.closest(".bg-slate-50");
    if (!messageBox) return;

    const text = messageBox.innerText;
    sessionStorage.setItem("imported_chat_prompt", text);
    window.location.href = "/storyboard";
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
