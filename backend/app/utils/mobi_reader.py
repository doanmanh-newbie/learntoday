# app/utils/mobi_reader.py - đọc phần chữ của file .mobi / .prc (chỉ dùng thư viện chuẩn)
"""
Giải mã file MOBI (sách điện tử Kindle đời cũ, nén PalmDOC) thành chuỗi HTML.

Hỗ trợ: không nén (1) và PalmDOC (2) - đúng định dạng của `eng-viet-dict.mobi`.
Không hỗ trợ: nén HUFF/CDIC (17480) và file bị mã hóa DRM. Gặp các loại này sẽ báo lỗi rõ ràng;
cách xử lý: dùng Calibre đổi sang MOBI/HTML không nén rồi chạy lại.
"""
import struct


class MobiError(Exception):
    pass


def _strip_trailing(data, flags):
    """Cắt các "trailing entry" cuối mỗi record chữ (độ dài mã hóa varint ngược) và byte thừa của ký tự đa byte."""
    end = len(data)
    for bit in range(15, 0, -1):
        if flags & (1 << bit):
            pos, val, shift = end - 1, 0, 0
            while pos >= 0:
                byte = data[pos]
                val |= (byte & 0x7F) << shift
                shift += 7
                pos -= 1
                if byte & 0x80:
                    break
            end -= val
    if flags & 1 and end > 0:
        end -= (data[end - 1] & 3) + 1
    return data[:max(end, 0)]


def palmdoc_decompress(data):
    """Giải nén PalmDOC (LZ77 đơn giản)."""
    out = bytearray()
    i, n = 0, len(data)
    while i < n:
        c = data[i]
        i += 1
        if c == 0 or 9 <= c <= 0x7F:
            out.append(c)
        elif 1 <= c <= 8:
            out += data[i:i + c]
            i += c
        elif c >= 0xC0:
            out.append(0x20)
            out.append(c ^ 0x80)
        else:                                   # 0x80-0xBF: tham chiếu lùi (khoảng cách, độ dài)
            if i >= n:
                break
            c = (c << 8) | data[i]
            i += 1
            dist, length = (c >> 3) & 0x7FF, (c & 7) + 3
            if dist == 0 or dist > len(out):
                raise MobiError('Dữ liệu nén PalmDOC bị hỏng (tham chiếu lùi không hợp lệ).')
            for _ in range(length):
                out.append(out[-dist])
    return bytes(out)


def mobi_to_html(source):
    """source: đường dẫn file hoặc bytes. Trả về chuỗi văn bản (HTML) của sách."""
    if isinstance(source, (bytes, bytearray)):
        data = bytes(source)
    else:
        with open(source, 'rb') as f:
            data = f.read()
    if len(data) < 100 or data[60:68] not in (b'BOOKMOBI', b'TEXtREAd'):
        raise MobiError('Không phải file MOBI/PRC hợp lệ.')

    nrec = struct.unpack('>H', data[76:78])[0]
    offsets = [struct.unpack('>I', data[78 + 8 * i:82 + 8 * i])[0] for i in range(nrec)] + [len(data)]
    record = lambda i: data[offsets[i]:offsets[i + 1]]

    r0 = record(0)
    compression, _, _text_len, text_records, _rec_size, encryption = struct.unpack('>HHIHHH', r0[:14])
    if encryption:
        raise MobiError('File bị mã hóa (DRM), không đọc được.')
    if compression not in (1, 2):
        raise MobiError(f'Kiểu nén {compression} chưa được hỗ trợ (chỉ hỗ trợ không nén và PalmDOC). '
                        'Hãy dùng Calibre đổi file sang MOBI không nén rồi thử lại.')

    flags, codepage = 0, 65001
    if r0[16:20] == b'MOBI':
        header_len = struct.unpack('>I', r0[20:24])[0]
        codepage = struct.unpack('>I', r0[28:32])[0]
        if header_len >= 0xE4 and len(r0) >= 0xF4:
            flags = struct.unpack('>H', r0[0xF2:0xF4])[0]

    chunks = []
    for i in range(1, text_records + 1):
        raw = _strip_trailing(record(i), flags)
        chunks.append(palmdoc_decompress(raw) if compression == 2 else raw)
    body = b''.join(chunks)
    return body.decode('cp1252' if codepage == 1252 else 'utf-8', errors='replace')
