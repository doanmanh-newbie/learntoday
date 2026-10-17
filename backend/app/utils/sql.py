# app/utils/sql.py
def escape_like(term: str) -> str:
    """Escape % _ \\ trong từ khóa để ILIKE không coi chúng là ký tự đại diện.

    (Trước đây tìm "100%" hay "a_b" trả kết quả sai/quét toàn bảng. Đây KHÔNG phải SQL injection
    vì giá trị đã được bind tham số, chỉ là hành vi tìm kiếm sai.)
    """
    return term.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')


def like_pattern(term: str) -> str:
    return f'%{escape_like(term)}%'
