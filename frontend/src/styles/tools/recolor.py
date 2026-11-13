"""Cách dùng:  python src/styles/tools/recolor.py src     (chạy từ thư mục gốc dự án)
Nếu lỡ dán code có màu cũ (chàm/tím/cam/xanh lá lạ, nền xanh đen), công cụ này quy về bảng màu hiện tại.
Chuyển bảng màu cũ (nền xanh đen + tím chàm/xanh lá/cam) sang bảng mới: xám + xanh ngọc, phụ đỏ & xanh rêu."""
import colorsys, re, sys, glob

# ── bảng màu mới ──
TEAL = {'200': (153,246,228), '300': (94,234,212), '400': (45,212,191), '500': (20,184,166), '600': (13,148,136), '700': (15,118,110), '800': (17,94,89)}
MOSS = {'300': (188,208,140), '400': (163,189,106), '500': (134,162,77), '600': (107,138,58), '700': (85,111,45), '800': (66,86,36)}
RED  = {'300': (252,165,165), '400': (248,113,113), '500': (239,68,68), '600': (220,38,38), '700': (185,28,28), '900': (127,29,29)}

def rgb2hex(c): return '#%02x%02x%02x' % tuple(int(round(x)) for x in c)
def hex2rgb(h):
    h=h.lstrip('#')
    if len(h)==3: h=''.join(ch*2 for ch in h)
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

def remap_rgb(r,g,b):
    """Trả về (r,g,b) mới theo họ màu + độ sáng. Idempotent: màu đã thuộc bảng mới không bị đổi tiếp."""
    h,l,s = colorsys.rgb_to_hls(r/255,g/255,b/255); h*=360
    sv = colorsys.rgb_to_hsv(r/255,g/255,b/255)[1]
    if sv < 0.10:                                 # trắng/đen/xám trung tính: giữ nguyên
        return (r,g,b)
    if h >= 325 or h < 12:                        # hồng / đỏ: đã nằm trong bảng màu (đỏ)
        return (r,g,b)
    if 195 <= h <= 262 and l < 0.14 and sv >= 0.30:   # nền xanh đen -> xám đậm trung tính hơi lạnh
        rr,gg,bb = colorsys.hls_to_rgb(205/360, min(0.97,l*1.12), 0.09)
        return (rr*255,gg*255,bb*255)
    if 195 <= h <= 262 and sv < 0.60 and l >= 0.14 and s < 0.40:   # chữ xám xanh -> xám trung tính
        rr,gg,bb = colorsys.hls_to_rgb(205/360, l, 0.06)
        return (rr*255,gg*255,bb*255)
    if 205 <= h <= 305 and s >= 0.30:             # chàm / tím / xanh dương -> xanh ngọc
        if l >= 0.78: return TEAL['300']
        if l >= 0.55: return TEAL['500'] if h < 255 else TEAL['400']
        if l >= 0.36: return TEAL['600'] if l >= 0.45 else TEAL['700']
        rr,gg,bb = colorsys.hls_to_rgb(173/360, l, min(s,0.5)); return (rr*255,gg*255,bb*255)
    if 165 <= h <= 182 and s >= 0.25:             # ĐÃ là xanh ngọc: giữ nguyên (chạy lại nhiều lần không đổi)
        return (r,g,b)
    if 183 <= h < 205 and s >= 0.3:               # cyan -> xanh ngọc
        return TEAL['500'] if l >= 0.4 else TEAL['700']
    if 120 <= h < 165 and s >= 0.25:              # xanh lá (emerald) -> xanh rêu
        if l >= 0.80: return MOSS['300']
        if l >= 0.55: return MOSS['400']
        if l >= 0.36: return MOSS['500']
        if l >= 0.28: return MOSS['700']
        rr,gg,bb = colorsys.hls_to_rgb(85/360, l, 0.35); return (rr*255,gg*255,bb*255)
    if 12 <= h < 75 and s >= 0.35:                # cam / hổ phách / vàng -> đỏ
        if l >= 0.82: return RED['300']
        if l >= 0.66: return RED['400']
        if l >= 0.42: return RED['500'] if l >= 0.50 else RED['600']
        if l >= 0.30: return RED['700']
        rr,gg,bb = colorsys.hls_to_rgb(0, l, 0.6); return (rr*255,gg*255,bb*255)
    if h >= 325 or h < 12:                        # hồng / đỏ
        return RED['500'] if l < 0.62 else RED['400']
    return (r,g,b)

# ── hex đặc thù (văn cảnh quen thuộc trong dự án) ──
HEX = {
 '#07091a':'#0f1214','#0d0f24':'#161a1d','#0d1030':'#161a1d','#0e1130':'#161a1d','#0d1129':'#161a1d','#111827':'#1d2226','#1a1d2e':'#1d2226',
 '#f8faff':'#f4f6f7','#e8eaf6':'#e9edef','#e2e8f0':'#dde2e5','#cbd5e1':'#c3cbd0',
 '#8190b3':'#a2acb3','#8892b0':'#a2acb3','#94a3b8':'#a2acb3','#a3aed0':'#a8b1b8','#64748b':'#848f97','#475569':'#6b747c','#3d4a66':'#4a545b','#334155':'#3d474e','#5a6a8a':'#848f97',
 '#c7d2fe':'#99f6e4','#a5b4fc':'#5eead4','#818cf8':'#2dd4bf','#6366f1':'#14b8a6','#8b5cf6':'#2dd4bf','#4f46e5':'#0f766e','#7c3aed':'#0d9488','#a78bfa':'#5eead4','#c4b5fd':'#99f6e4',
 '#10b981':'#86a24d','#34d399':'#a3bd6a','#6ee7b7':'#bcd08c','#059669':'#556f2d','#047857':'#425624',
 '#fbbf24':'#f87171','#f59e0b':'#ef4444','#d97706':'#dc2626','#fde68a':'#fecaca','#fcd34d':'#fca5a5','#fb923c':'#f87171','#f97316':'#ef4444','#facc15':'#f87171','#451a03':'#450a0a','#92400e':'#7f1d1d','#78350f':'#7f1d1d',
 '#06b6d4':'#14b8a6','#f43f5e':'#ef4444','#fb7185':'#f87171',
}

# ── gradient toàn phần (nền nút có chữ trắng) ──
def grad(angle, a, b): return f'linear-gradient({angle}deg,@@{a[1:]}@@,@@{b[1:]}@@)'
GRAD_RULES = [
 (r'linear-gradient\(\s*(\d+)deg\s*,\s*#(?:6366f1|8b5cf6|4f46e5|7c3aed|818cf8)\s*(?:0%)?\s*,\s*#(?:6366f1|8b5cf6|4f46e5|7c3aed|818cf8)\s*(?:100%)?\s*\)', lambda m: grad(m.group(1),'#0f766e','#0e8077')),
 (r'linear-gradient\(\s*(\d+)deg\s*,\s*#(?:10b981|34d399)\s*,\s*#(?:059669|047857)\s*\)', lambda m: grad(m.group(1),'#6b8a3a','#556f2d')),
 (r'linear-gradient\(\s*(\d+)deg\s*,\s*#(?:f59e0b|fbbf24|f97316|fb923c)\s*,\s*#(?:d97706|f97316|ea580c|fb923c)\s*\)', lambda m: grad(m.group(1),'#dc2626','#b91c1c')),
 (r'linear-gradient\(\s*(\d+)deg\s*,\s*#(?:6366f1|8b5cf6)\s*,\s*#(?:10b981|34d399)\s*\)', lambda m: grad(m.group(1),'#14b8a6','#a3bd6a')),
]
SOLID_RULES = [  # nền đặc có chữ trắng
 (r'(background(?:Color)?\s*:\s*["\'])#6366f1(["\'])', r'\1@@0f766e@@\2'),
 (r'(background(?:Color)?\s*:\s*["\'])#8b5cf6(["\'])', r'\1@@0f766e@@\2'),
 (r'(background(?:Color)?\s*:\s*["\'])#10b981(["\'])', r'\1@@556f2d@@\2'),
]

HEX_RE = re.compile(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b')
RGBA_RE = re.compile(r'rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)')

def map_hex(m):
    h=m.group(0).lower()
    if len(h)==4: h='#'+''.join(c*2 for c in h[1:])
    if h in HEX: return HEX[h]
    return rgb2hex(remap_rgb(*hex2rgb(h)))

def map_rgba(m):
    r,g,b=int(m.group(1)),int(m.group(2)),int(m.group(3)); a=m.group(4)
    nr,ng,nb=[int(round(x)) for x in remap_rgb(r,g,b)]
    return f'rgba({nr},{ng},{nb},{a})' if a is not None else f'rgb({nr},{ng},{nb})'

def recolor(text):
    for pat,fn in GRAD_RULES: text=re.sub(pat,fn,text)
    for pat,rep in SOLID_RULES: text=re.sub(pat,rep,text)
    text=RGBA_RE.sub(map_rgba,text)
    text=HEX_RE.sub(map_hex,text)
    return re.sub(r'@@([0-9a-f]{6})@@', r'#\1', text)

if __name__=='__main__':
    skip=('/tests/','styles/theme.css','styles/tools/','components/ui/')
    n=0
    for f in sorted(glob.glob(sys.argv[1]+'/**/*',recursive=True)):
        if not f.endswith(('.jsx','.js','.css')) or any(k in f for k in skip): continue
        s=open(f,encoding='utf-8',errors='replace').read()
        t=recolor(s.replace('\r\n','\n'))
        if t!=s.replace('\r\n','\n'):
            open(f,'w',encoding='utf-8').write(t); n+=1
    print("đã đổi màu trong",n,"file")
