// src/data/vocabulary.js
// ⚠️ DỮ LIỆU TẠM (mock) từ bản Figma prototype -- CHƯA gọi API backend thật.
// Sau này khi nối API /api/folders + /api/words, thay nội dung file này
// bằng dữ liệu lấy về từ server thay vì mảng cứng bên dưới.

const FOLDER_DATA = [
  {
    id: 1, name: "Gia đình", tag: "Family",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=700&h=420&fit=crop&auto=format",
    color: "#f97316",
    words: [
      { id: 101, word: "nurture", phonetic: "/ˈnɜːrtʃər/", pos: "v", meaning: "nuôi dưỡng, vun đắp",
        examples: [
          { en: "Parents ___ their children with love and care.", vi: "Cha mẹ nuôi dưỡng con cái bằng tình yêu và sự chăm sóc." },
          { en: "She tried to ___ her child's talent.", vi: "Cô ấy cố gắng vun đắp tài năng của con." },
        ], lv: 0 },
      { id: 102, word: "cherish", phonetic: "/ˈtʃerɪʃ/", pos: "v", meaning: "trân trọng, yêu quý",
        examples: [
          { en: "I ___ every moment with my family.", vi: "Tôi trân trọng từng khoảnh khắc với gia đình." },
          { en: "She will always ___ these memories.", vi: "Cô ấy sẽ luôn trân trọng những ký ức này." },
        ], lv: 0 },
      { id: 103, word: "sibling", phonetic: "/ˈsɪblɪŋ/", pos: "n", meaning: "anh chị em ruột",
        examples: [
          { en: "She has three ___s.", vi: "Cô ấy có ba anh chị em ruột." },
          { en: "My ___ and I grew up together.", vi: "Anh em tôi lớn lên cùng nhau." },
        ], lv: 1, next_review: Date.now() - 3600000 },
      { id: 104, word: "heritage", phonetic: "/ˈherɪtɪdʒ/", pos: "n", meaning: "di sản, gia sản",
        examples: [
          { en: "Our family ___ is something to be proud of.", vi: "Di sản gia đình là điều đáng tự hào." },
          { en: "She inherited her cultural ___.", vi: "Cô ấy thừa hưởng di sản văn hóa của mình." },
        ], lv: 0 },
      { id: 105, word: "reunion", phonetic: "/riːˈjuːniən/", pos: "n", meaning: "buổi đoàn tụ",
        examples: [
          { en: "The family ___ was held every year.", vi: "Buổi đoàn tụ gia đình được tổ chức hàng năm." },
          { en: "We had a wonderful ___ last summer.", vi: "Chúng tôi đã có một buổi đoàn tụ tuyệt vời mùa hè năm ngoái." },
        ], lv: 0 },
      { id: 106, word: "ancestor", phonetic: "/ˈænsestər/", pos: "n", meaning: "tổ tiên",
        examples: [
          { en: "My ___s came from the north.", vi: "Tổ tiên tôi đến từ miền Bắc." },
          { en: "She researched her family ___s.", vi: "Cô ấy nghiên cứu tổ tiên của gia đình mình." },
        ], lv: 2, next_review: Date.now() - 7200000 },
      { id: 107, word: "affection", phonetic: "/əˈfekʃən/", pos: "n", meaning: "tình cảm yêu thương",
        examples: [
          { en: "She showed great ___ for her parents.", vi: "Cô ấy thể hiện tình cảm sâu sắc với cha mẹ." },
          { en: "Children need ___ to grow up well.", vi: "Trẻ em cần tình yêu thương để phát triển tốt." },
        ], lv: 0 },
      { id: 108, word: "guardian", phonetic: "/ˈɡɑːrdiən/", pos: "n", meaning: "người giám hộ",
        examples: [
          { en: "His uncle became his legal ___.", vi: "Chú anh ấy trở thành người giám hộ hợp pháp của anh ấy." },
          { en: "Parents are the natural ___s of their children.", vi: "Cha mẹ là người bảo vệ tự nhiên của con cái." },
        ], lv: 0 },
    ],
  },
  {
    id: 2, name: "Du lịch", tag: "Travel",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=700&h=420&fit=crop&auto=format",
    color: "#06b6d4",
    words: [
      { id: 201, word: "itinerary", phonetic: "/aɪˈtɪnəreri/", pos: "n", meaning: "lịch trình hành trình",
        examples: [
          { en: "We planned a detailed ___ for the trip.", vi: "Chúng tôi lên kế hoạch lịch trình chi tiết cho chuyến đi." },
          { en: "Our tour guide handed us the ___.", vi: "Hướng dẫn viên đưa cho chúng tôi lịch trình." },
        ], lv: 0 },
      { id: 202, word: "destination", phonetic: "/ˌdestɪˈneɪʃən/", pos: "n", meaning: "điểm đến",
        examples: [
          { en: "Hội An is a popular tourist ___.", vi: "Hội An là một điểm đến du lịch nổi tiếng." },
          { en: "We finally reached our ___.", vi: "Chúng tôi cuối cùng đã đến nơi." },
        ], lv: 0 },
      { id: 203, word: "accommodation", phonetic: "/əˌkɒməˈdeɪʃən/", pos: "n", meaning: "chỗ ở, nơi lưu trú",
        examples: [
          { en: "We booked ___ near the beach.", vi: "Chúng tôi đặt chỗ ở gần bãi biển." },
          { en: "The ___ was comfortable and affordable.", vi: "Chỗ ở thoải mái và giá cả phải chăng." },
        ], lv: 1, next_review: Date.now() + 3600000 },
      { id: 204, word: "excursion", phonetic: "/ɪkˈskɜːrʒən/", pos: "n", meaning: "chuyến du ngoạn ngắn",
        examples: [
          { en: "We went on an ___ to the national park.", vi: "Chúng tôi đi du ngoạn đến công viên quốc gia." },
        ], lv: 0 },
      { id: 205, word: "souvenir", phonetic: "/ˌsuːvəˈnɪər/", pos: "n", meaning: "đồ lưu niệm",
        examples: [
          { en: "She bought a ___ for her mother.", vi: "Cô ấy mua một món đồ lưu niệm cho mẹ." },
        ], lv: 0 },
      { id: 206, word: "passport", phonetic: "/ˈpæspɔːrt/", pos: "n", meaning: "hộ chiếu",
        examples: [
          { en: "Don't forget to bring your ___ when travelling.", vi: "Đừng quên mang hộ chiếu khi đi du lịch." },
        ], lv: 2, next_review: Date.now() - 7200000 },
      { id: 207, word: "currency", phonetic: "/ˈkɜːrənsi/", pos: "n", meaning: "tiền tệ, ngoại tệ",
        examples: [
          { en: "You need to exchange ___ at the airport.", vi: "Bạn cần đổi ngoại tệ ở sân bay." },
        ], lv: 0 },
      { id: 208, word: "customs", phonetic: "/ˈkʌstəmz/", pos: "n", meaning: "hải quan",
        examples: [
          { en: "We had to pass through ___ at the airport.", vi: "Chúng tôi phải qua hải quan ở sân bay." },
        ], lv: 0 },
    ],
  },
  {
    id: 3, name: "Công việc", tag: "Work",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&h=420&fit=crop&auto=format",
    color: "#8b5cf6",
    words: [
      { id: 301, word: "deadline", phonetic: "/ˈdedlaɪn/", pos: "n", meaning: "thời hạn chót",
        examples: [
          { en: "We must finish the project before the ___.", vi: "Chúng ta phải hoàn thành dự án trước thời hạn chót." },
        ], lv: 0 },
      { id: 302, word: "negotiate", phonetic: "/nɪˈɡoʊʃieɪt/", pos: "v", meaning: "đàm phán, thương lượng",
        examples: [
          { en: "We need to ___ the contract terms.", vi: "Chúng ta cần đàm phán các điều khoản hợp đồng." },
        ], lv: 0 },
      { id: 303, word: "initiative", phonetic: "/ɪˈnɪʃətɪv/", pos: "n", meaning: "sáng kiến, chủ động",
        examples: [
          { en: "She took the ___ to solve the problem.", vi: "Cô ấy chủ động giải quyết vấn đề." },
        ], lv: 1, next_review: Date.now() + 3600000 },
      { id: 304, word: "delegate", phonetic: "/ˈdelɪɡeɪt/", pos: "v", meaning: "ủy thác, giao việc",
        examples: [
          { en: "A good manager knows how to ___ tasks.", vi: "Người quản lý giỏi biết cách giao việc." },
        ], lv: 0 },
      { id: 305, word: "productivity", phonetic: "/ˌprɒdʌkˈtɪvɪti/", pos: "n", meaning: "năng suất",
        examples: [
          { en: "Remote work can increase ___.", vi: "Làm việc từ xa có thể tăng năng suất." },
        ], lv: 0 },
    ],
  },
  {
    id: 4, name: "Ẩm thực", tag: "Food",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&h=420&fit=crop&auto=format",
    color: "#f59e0b",
    words: [
      { id: 401, word: "cuisine", phonetic: "/kwɪˈziːn/", pos: "n", meaning: "ẩm thực, phong cách nấu ăn",
        examples: [{ en: "Vietnamese ___ is famous worldwide.", vi: "Ẩm thực Việt Nam nổi tiếng trên toàn thế giới." }], lv: 1 },
      { id: 402, word: "ingredient", phonetic: "/ɪnˈɡriːdiənt/", pos: "n", meaning: "nguyên liệu",
        examples: [{ en: "Fresh ___s make the best dishes.", vi: "Nguyên liệu tươi tạo ra những món ăn ngon nhất." }], lv: 1 },
      { id: 403, word: "marinate", phonetic: "/ˈmærɪneɪt/", pos: "v", meaning: "ướp, tẩm ướp",
        examples: [{ en: "You should ___ the meat for two hours.", vi: "Bạn nên ướp thịt trong hai tiếng." }], lv: 1 },
    ],
  },
  {
    id: 5, name: "IELTS", tag: "Academic",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&h=420&fit=crop&auto=format",
    color: "#6366f1",
    words: [
      { id: 501, word: "exacerbate", phonetic: "/ɪɡˈzæsərbeɪt/", pos: "v", meaning: "làm trầm trọng hơn",
        examples: [
          { en: "Pollution will ___ the health crisis.", vi: "Ô nhiễm sẽ làm trầm trọng thêm cuộc khủng hoảng sức khỏe." },
          { en: "Stress can ___ existing problems.", vi: "Căng thẳng có thể làm trầm trọng thêm các vấn đề hiện có." },
        ], lv: 0 },
      { id: 502, word: "proliferate", phonetic: "/prəˈlɪfəreɪt/", pos: "v", meaning: "phát triển nhanh chóng",
        examples: [
          { en: "Social media continues to ___.", vi: "Mạng xã hội tiếp tục phát triển nhanh chóng." },
        ], lv: 0 },
      { id: 503, word: "alleviate", phonetic: "/əˈliːvieɪt/", pos: "v", meaning: "giảm nhẹ, làm dịu",
        examples: [
          { en: "Exercise can ___ stress.", vi: "Tập thể dục có thể giảm bớt căng thẳng." },
        ], lv: 0 },
      { id: 504, word: "encompass", phonetic: "/ɪnˈkʌmpəs/", pos: "v", meaning: "bao gồm, bao quát",
        examples: [
          { en: "The course ___es many topics.", vi: "Khóa học bao gồm nhiều chủ đề." },
        ], lv: 0 },
      { id: 505, word: "mitigate", phonetic: "/ˈmɪtɪɡeɪt/", pos: "v", meaning: "giảm thiểu",
        examples: [
          { en: "We must ___ the effects of climate change.", vi: "Chúng ta phải giảm thiểu tác động của biến đổi khí hậu." },
        ], lv: 0 },
      { id: 506, word: "substantiate", phonetic: "/səbˈstænʃieɪt/", pos: "v", meaning: "chứng minh, xác nhận",
        examples: [
          { en: "You need evidence to ___ your claim.", vi: "Bạn cần bằng chứng để chứng minh lập luận của mình." },
        ], lv: 0 },
    ],
  },
];

const POS_MAP = { n: "n", v: "v", adj: "adj", adv: "adv" };
