# app/utils/srs.py
"""
SRS (Spaced Repetition System) - STT 8: hằng số + luật chuyển cấp. Thuần Python, dễ kiểm thử.
Dùng chung cho nhánh "learn" (STT 6) và "review" (STT 5).

Lịch ôn đã được điều chỉnh so với bản đầu (xem docs/SRS.md):
  * Trước đây LV3 (24 giờ) và LV4 (1 ngày) TRÙNG NHAU nên một cấp vô nghĩa.
  * Trước đây tối đa 5 ngày: từ "Không quên" vẫn bị ôn lại mỗi 5 ngày mãi mãi nên số từ phải ôn mỗi ngày tăng tuyến tính
    theo số từ đã học (500 từ ~ 100 từ/ngày). Khoảng cách giờ dãn dần tới 21 ngày.
Muốn đổi lịch: sửa SRS_INTERVALS ở đây VÀ SRS_SECONDS/SRS_INTERVAL_LABEL trong frontend/src/constants/srs.js
(tests/test_srs.py kiểm tra hai bên luôn khớp nhau).
"""
from datetime import datetime, timedelta

MAX_LEVEL = 6

SRS_INTERVALS = {
    1: timedelta(minutes=20),   # Mới học
    2: timedelta(hours=10),     # Biết
    3: timedelta(days=1),       # Gần thuộc
    4: timedelta(days=3),       # Đã thuộc
    5: timedelta(days=7),       # Nhớ dai
    6: timedelta(days=21),      # Không quên
}

SKIP_DELAY = timedelta(hours=12)       # "Bỏ qua" = tạm hoãn: giữ nguyên cấp nhưng KHÔNG xuất hiện lại ngay ở lượt ôn kế tiếp
LAPSE_DIALOG_WRONG = 4                 # sai từ ngần này lần trở lên: hỏi người dùng muốn làm gì với từ
VALID_CHOICES = ('quay_ve_lv1', 'lui_1_lv', 'bo_qua')


def get_next_review(level, now=None):
    """Thời điểm ôn tập tiếp theo dựa theo Level SRS."""
    interval = SRS_INTERVALS.get(level, SRS_INTERVALS[1])
    return (now or datetime.utcnow()) + interval


def decide_review(level_before, wrong_count, choice=None):
    """Luật khi hoàn thành 1 lượt ôn tập của một từ. Trả (kết_quả, cấp_mới, khoảng_cách_tới_lần_ôn_sau).

    Kết quả: 'hoan_thanh' | 'giu_level' | 'quay_ve_lv1' | 'lui_1_lv' | 'bo_qua'

    * Người dùng CHỌN rõ ràng (choice hợp lệ) thì luôn được tôn trọng, bất kể số lần sai
      (trước đây "Bỏ qua" khi sai < 4 lần bị bỏ qua choice và từ lại LÊN CẤP).
    * Không sai lần nào         -> lên 1 cấp.
    * Sai 1..3 lần              -> GIỮ NGUYÊN cấp, hẹn lại theo khoảng của cấp đó (trước đây vẫn lên cấp, nên từ nhớ chưa chắc
                                   vẫn bị đẩy ra xa).
    * Sai >= 4 lần, chưa chọn   -> lùi 1 cấp (trước đây server trả lỗi 400, tiến độ bị mất).
    """
    if choice is not None and choice not in VALID_CHOICES:
        raise ValueError(f'choice không hợp lệ: {choice!r}')

    if choice == 'quay_ve_lv1':
        return 'quay_ve_lv1', 1, SRS_INTERVALS[1]
    if choice == 'lui_1_lv':
        level = max(level_before - 1, 1)
        return 'lui_1_lv', level, SRS_INTERVALS[level]
    if choice == 'bo_qua':
        return 'bo_qua', level_before, SKIP_DELAY

    if wrong_count == 0:
        level = min(level_before + 1, MAX_LEVEL)
        return 'hoan_thanh', level, SRS_INTERVALS[level]
    if wrong_count < LAPSE_DIALOG_WRONG:
        return 'giu_level', level_before, SRS_INTERVALS[level_before]
    level = max(level_before - 1, 1)
    return 'lui_1_lv', level, SRS_INTERVALS[level]
