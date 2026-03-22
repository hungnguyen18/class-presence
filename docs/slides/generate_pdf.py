"""Generate slide-outline.pdf from slide-outline.md content with images."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Paths ──────────────────────────────────────────────────────────────────
BASE = '/Users/hungnguyen/Workspace/me/class-presence/docs/slides'
OUTPUT = '/Users/hungnguyen/Workspace/me/class-presence/docs/slide-outline.pdf'
SS = f'{BASE}/screenshots'
DG = f'{BASE}/diagrams'

# ── Register fonts ──────────────────────────────────────────────────────────
FONT_DIR = '/Library/Fonts'
pdfmetrics.registerFont(TTFont('ArialUnicode', f'{FONT_DIR}/Arial Unicode.ttf'))
FONT = 'ArialUnicode'

ARIAL_DIR = '/System/Library/Fonts/Supplemental'
pdfmetrics.registerFont(TTFont('Arial', f'{ARIAL_DIR}/Arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', f'{ARIAL_DIR}/Arial Bold.ttf'))
pdfmetrics.registerFont(TTFont('ArialItalic', f'{ARIAL_DIR}/Arial Italic.ttf'))

# ── Color palette (matches app) ─────────────────────────────────────────────
C_DARK   = colors.HexColor('#2C3E50')
C_GOLD   = colors.HexColor('#D4A853')
C_MUTED  = colors.HexColor('#6B7C8D')
C_BORDER = colors.HexColor('#E0DCD4')
C_BG     = colors.HexColor('#F5F2EC')
C_GREEN  = colors.HexColor('#3D8B5E')
C_RED    = colors.HexColor('#C0544F')
C_BLUE   = colors.HexColor('#3B82F6')
C_LIGHT  = colors.HexColor('#F8F6F2')

W, H = A4  # 595 x 842 pts

# ── Styles ──────────────────────────────────────────────────────────────────
def make_styles():
    s = getSampleStyleSheet()

    def ps(name, **kw):
        kw.setdefault('fontName', FONT)
        return ParagraphStyle(name, **kw)

    return {
        'doc_title': ps('doc_title',
            fontSize=22, textColor=C_DARK, spaceAfter=4,
            fontName='ArialBold', leading=28),
        'doc_sub': ps('doc_sub',
            fontSize=11, textColor=C_MUTED, spaceAfter=16, leading=16),
        'part_header': ps('part_header',
            fontSize=13, textColor=C_GOLD, spaceAfter=6,
            fontName='ArialBold', leading=18, spaceBefore=8),
        'slide_title': ps('slide_title',
            fontSize=15, textColor=C_DARK, spaceAfter=6,
            fontName='ArialBold', leading=20, spaceBefore=4),
        'note': ps('note',
            fontSize=9, textColor=C_MUTED, spaceAfter=6,
            fontName='ArialItalic', leading=13),
        'body': ps('body',
            fontSize=10, textColor=C_DARK, spaceAfter=4,
            fontName=FONT, leading=15),
        'bullet': ps('bullet',
            fontSize=10, textColor=C_DARK, leftIndent=16, spaceAfter=3,
            fontName=FONT, leading=15, bulletIndent=6),
        'numbered': ps('numbered',
            fontSize=10, textColor=C_DARK, leftIndent=20, spaceAfter=3,
            fontName=FONT, leading=15),
        'label': ps('label',
            fontSize=9, textColor=C_MUTED, spaceAfter=4,
            fontName='ArialBold', leading=13),
        'caption': ps('caption',
            fontSize=9, textColor=C_MUTED, spaceAfter=8,
            fontName='ArialItalic', leading=13, alignment=1),
    }

ST = make_styles()

# ── Helpers ──────────────────────────────────────────────────────────────────
CONTENT_W = W - 3*cm  # usable width

def img(path, max_w=None, max_h=None, caption=None):
    """Return Image + optional caption, scaled to fit."""
    if not os.path.exists(path):
        return []
    max_w = max_w or CONTENT_W
    max_h = max_h or 14*cm
    im = Image(path)
    aspect = im.imageWidth / im.imageHeight
    w = min(max_w, im.imageWidth)
    h = w / aspect
    if h > max_h:
        h = max_h
        w = h * aspect
    im.drawWidth = w
    im.drawHeight = h
    result = [im]
    if caption:
        result.append(Paragraph(caption, ST['caption']))
    return result

def bullet(text):
    return Paragraph(f'• {text}', ST['bullet'])

def num(n, text):
    return Paragraph(f'{n}. {text}', ST['numbered'])

def body(text):
    return Paragraph(text, ST['body'])

def note(text):
    return Paragraph(text, ST['note'])

def sp(h=6):
    return Spacer(1, h)

def hr():
    return HRFlowable(width='100%', thickness=1, color=C_BORDER, spaceAfter=8, spaceBefore=4)

def slide_header(number, title):
    """Slide number badge + title."""
    data = [[
        Paragraph(f'<font color="#D4A853"><b>Slide {number}</b></font>', ParagraphStyle(
            'badge', fontName='ArialBold', fontSize=10, textColor=C_GOLD)),
        Paragraph(title, ParagraphStyle(
            'sh', fontName='ArialBold', fontSize=14, textColor=C_DARK, leading=18)),
    ]]
    t = Table(data, colWidths=[2.2*cm, CONTENT_W - 2.2*cm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,-1), 0),
        ('BACKGROUND', (0,0), (-1,-1), C_LIGHT),
        ('ROUNDEDCORNERS', [4,4,4,4]),
        ('BOX', (0,0), (-1,-1), 0.5, C_BORDER),
    ]))
    return t

def section_header(text):
    """Part/section divider."""
    return Paragraph(f'— {text} —', ParagraphStyle(
        'sh2', fontName='ArialBold', fontSize=12, textColor=C_GOLD,
        alignment=1, spaceBefore=12, spaceAfter=8))

def table_simple(rows, col_widths=None, header_row=True):
    """Simple table with header styling."""
    if not col_widths:
        n = len(rows[0])
        col_widths = [CONTENT_W / n] * n

    cell_style = ParagraphStyle('tc', fontName=FONT, fontSize=9,
                                 textColor=C_DARK, leading=13)
    hdr_style = ParagraphStyle('th', fontName='ArialBold', fontSize=9,
                                textColor=colors.white, leading=13)

    data = []
    for ri, row in enumerate(rows):
        style = hdr_style if (ri == 0 and header_row) else cell_style
        data.append([Paragraph(str(c), style) for c in row])

    t = Table(data, colWidths=col_widths)
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_DARK if header_row else C_LIGHT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]
    if header_row:
        # Highlight last row (RFID)
        cmds.append(('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#DBEAFE')))
    t.setStyle(TableStyle(cmds))
    return t

# ── Build story ──────────────────────────────────────────────────────────────
def build_story():
    story = []

    # ── Cover page ──────────────────────────────────────────────────────────
    story += [
        sp(2*cm),
        Paragraph('Class Presence', ParagraphStyle('cov1', fontName='ArialBold',
            fontSize=32, textColor=C_DARK, leading=40, alignment=1)),
        Paragraph('Hệ thống điểm danh tự động sử dụng IoT', ParagraphStyle('cov2',
            fontName=FONT, fontSize=16, textColor=C_MUTED, leading=24, alignment=1,
            spaceAfter=8)),
        HRFlowable(width='60%', thickness=2, color=C_GOLD, spaceAfter=16,
                   hAlign='CENTER'),
        Paragraph('Dàn ý slide — Tài liệu tham khảo cho AI agent tạo Prezi',
            ParagraphStyle('cov3', fontName='ArialItalic', fontSize=11,
                textColor=C_MUTED, alignment=1, spaceAfter=32)),
        sp(cm),
        Paragraph('<b>Môn:</b> Vạn Vật Kết Nối (INOT231780)', ST['body']),
        Paragraph('<b>GVHD:</b> ThS. Đinh Công Đoan', ST['body']),
        Paragraph('<b>Nhóm 10:</b>', ST['body']),
        bullet('22810009 Nguyễn Kim Hưng — Giao diện web, Cloud, Thiết kế hệ thống'),
        bullet('22810010 Đào Đức Khải — Thiết bị, Firmware, Phần cứng'),
        bullet('24810113 Phan Trương Đình Khánh — Kết nối serial, Kiểm thử, Tài liệu'),
        sp(cm),
        Paragraph('<b>Tổng: 20 slides</b> | Thuyết trình ~20 phút + demo trực tiếp',
            ParagraphStyle('cov4', fontName=FONT, fontSize=10, textColor=C_MUTED)),
        PageBreak(),
    ]

    # ── Phong cách trình bày ─────────────────────────────────────────────────
    story += [
        section_header('PHONG CÁCH TRÌNH BÀY'),
        body('<b>Prezi / spatial storytelling:</b> Mỗi phần lớn là một khung hình tổng quan (overview), sau đó zoom vào từng chi tiết bên trong.'),
        sp(6),
        body('<b>Quy tắc hình ảnh:</b>'),
        bullet('KHÔNG dùng flowchart ký hiệu chuẩn (hình thoi, hình oval). Dùng khối hình chữ nhật bo tròn (building blocks).'),
        bullet('Mỗi bước là 1 khối: icon + tiêu đề ngắn + 1 dòng mô tả. Tô màu nền khác nhau theo trạng thái.'),
        bullet('Sơ đồ luồng: timeline ngang (trái → phải) hoặc bậc thang (trên → dưới).'),
        bullet('Sơ đồ kiến trúc: tầng xếp chồng (giống tòa nhà).'),
        bullet('Sơ đồ kết nối: hub-spoke (trung tâm + các nhánh tỏa ra).'),
        PageBreak(),
    ]

    # ── PHẦN 1: GIỚI THIỆU ───────────────────────────────────────────────────
    story.append(section_header('PHẦN 1: GIỚI THIỆU'))

    # Slide 2
    story += [
        slide_header(2, 'Vấn đề thực tế'), sp(8),
        body('<b>Bố cục: 2 cột — Trái = vấn đề, Phải = hệ quả</b>'),
        sp(6),
        body('Vấn đề:'),
        bullet('Điểm danh bằng gọi tên: mất ~5 phút mỗi lớp 40 người'),
        bullet('Sinh viên điểm danh hộ bạn vắng'),
        bullet('Giảng viên không biết ai đến trễ, ai vắng cho đến khi kiểm tra lại'),
        bullet('Dữ liệu ghi giấy, khó thống kê cuối kỳ'),
        sp(6),
        body('Hệ quả:'),
        bullet('Lãng phí thời gian giảng dạy'),
        bullet('Tỷ lệ gian lận cao'),
        bullet('Không có cảnh báo sớm cho sinh viên sắp thiếu điều kiện dự thi'),
        sp(12),
    ]

    # Slide 3
    story += [
        slide_header(3, 'Giải pháp & So sánh'), sp(8),
        body('<b>Giải pháp:</b> Sinh viên quẹt thẻ RFID → thiết bị tự ghi nhận → gửi lên cloud → giảng viên xem trên web ngay lập tức.'),
        sp(10),
        table_simple(
            [
                ['Phương pháp', 'Chi phí', 'Tốc độ', 'Chống gian lận', 'Xem tức thì'],
                ['Gọi tên', 'Thấp', 'Chậm (~5 phút)', 'Kém', 'Không'],
                ['QR Code', 'Thấp', 'Nhanh', 'Kém (dễ chia sẻ)', 'Có'],
                ['Nhận diện khuôn mặt', 'Cao', 'Nhanh', 'Tốt', 'Có'],
                ['RFID (đề xuất)', 'Thấp (~20k/thẻ)', '<2 giây', 'Tốt (thẻ vật lý)', 'Có'],
            ],
            col_widths=[3.5*cm, 2.5*cm, 2.8*cm, 4*cm, 2.6*cm]
        ),
        PageBreak(),
    ]

    # ── PHẦN 2: KIẾN TRÚC ───────────────────────────────────────────────────
    story.append(section_header('PHẦN 2: KIẾN TRÚC HỆ THỐNG'))

    # Slide 4
    story += [
        slide_header(4, 'Kiến trúc tổng thể (Overview)'), sp(8),
        body('4 tầng IoT: tầng dưới cùng = cảm nhận, lên đến tầng ứng dụng web. Hai luồng dữ liệu: điểm danh đi lên, lệnh điều khiển đi xuống.'),
        sp(6),
    ] + img(f'{DG}/architecture.png', caption='Sơ đồ kiến trúc 4 tầng IoT') + [sp(12)]

    # Slide 5
    story += [
        slide_header(5, 'Luồng điểm danh'), sp(8),
        body('Chuỗi 6 bước từ quẹt thẻ đến web cập nhật — dưới 1 giây.'),
        sp(6),
    ] + img(f'{DG}/checkin-flow.png', caption='Luồng điểm danh: thiết bị → cloud → web') + [
        note('Ghi chú: "Dưới 1 giây từ quẹt thẻ → web cập nhật"'),
        sp(12),
    ]

    # Slide 6
    story += [
        slide_header(6, 'Luồng điều khiển thiết bị'), sp(8),
        body('5 bước từ nhấn "Tắt" trên web đến thiết bị ngừng hoạt động.'),
        sp(6),
    ] + img(f'{DG}/control-flow.png', caption='Luồng điều khiển: web → cloud → bridge → thiết bị') + [
        note('Trạng thái lệnh: Đang chờ → Đã gửi → Đã thực thi'),
        PageBreak(),
    ]

    # ── PHẦN 3: PHẦN CỨNG ───────────────────────────────────────────────────
    story.append(section_header('PHẦN 3: THIẾT KẾ PHẦN CỨNG'))

    # Slide 7
    story += [
        slide_header(7, 'Sơ đồ mạch Proteus'), sp(8),
        body('Screenshot sơ đồ mạch từ Proteus với callout đánh nhãn từng linh kiện.'),
        sp(6),
        body('<b>Các linh kiện:</b>'),
        table_simple(
            [
                ['Ký hiệu', 'Linh kiện'],
                ['U1', 'Raspberry Pi 3 — bộ xử lý chính'],
                ['LCD1', 'Màn hình LCD'],
                ['VT1', 'Đầu đọc thẻ RFID'],
                ['BUZ1', 'Loa báo'],
                ['LED1', 'Đèn xanh'],
                ['LED2', 'Đèn đỏ'],
                ['SCAN', 'Nút bắt đầu quét'],
                ['COUNT', 'Nút xem số lượng'],
                ['U2', 'Bộ điều khiển motor cửa'],
            ],
            col_widths=[3*cm, CONTENT_W - 3*cm]
        ),
        sp(12),
    ]

    # Slide 8
    story += [
        slide_header(8, 'Sơ đồ kết nối linh kiện'), sp(8),
        body('Hub-spoke: Raspberry Pi ở trung tâm, linh kiện xung quanh. Xanh lá = đầu vào, xanh dương = đầu ra.'),
        sp(6),
    ] + img(f'{DG}/connections.png', caption='Sơ đồ kết nối hub-spoke — Raspberry Pi 3') + [sp(12)]

    # Slide 9
    story += [
        slide_header(9, 'Hoạt động thiết bị từng bước'), sp(8),
        body('Dạng bậc thang dọc, chia 2 nhánh ở bước kiểm tra thẻ.'),
        sp(6),
    ] + img(f'{DG}/device-steps.png', caption='Luồng quẹt thẻ: hợp lệ (xanh) vs không hợp lệ (đỏ)') + [sp(12)]

    # Slide 10
    story += [
        slide_header(10, 'Chương trình trung gian (Serial Bridge)'), sp(8),
        body('3 khối: Thiết bị ↔ Bridge (Python) ↔ Cloud. Bridge thực hiện 4 việc:'),
        num(1, 'Nhận check-in → gửi lên cloud'),
        num(2, 'Nhận tín hiệu "còn sống" → báo cloud thiết bị đang hoạt động'),
        num(3, 'Kiểm tra cloud mỗi 3s → nếu có lệnh mới → chuyển cho thiết bị'),
        num(4, 'Mất mạng → lưu tạm → có mạng lại thì gửi hết'),
        sp(6),
    ] + img(f'{DG}/bridge.png', caption='Serial Bridge: thiết bị ↔ Python ↔ Supabase') + [PageBreak()]

    # ── PHẦN 4: CƠ SỞ DỮ LIỆU ───────────────────────────────────────────────
    story.append(section_header('PHẦN 4: CƠ SỞ DỮ LIỆU'))

    # Slide 11
    story += [
        slide_header(11, 'Sơ đồ cơ sở dữ liệu'), sp(8),
        body('7 bảng với tiền tố cp_. RLS bật trên tất cả. UUIDs là primary key.'),
        sp(6),
    ] + img(f'{DG}/erd.png', max_h=18*cm, caption='ERD — 7 bảng: rooms, classes, students, devices, commands, attendance_logs, attendance_sessions') + [sp(8)]

    # Slide 12
    story += [
        slide_header(12, 'Bảo mật dữ liệu (RLS)'), sp(8),
    ] + img(f'{DG}/security.png', caption='RLS policy: giảng viên chỉ SELECT, bridge mới INSERT được điểm danh') + [
        body('<b>Điểm quan trọng:</b> Chỉ bridge (service_role) mới ghi được điểm danh → ngay cả khi lộ mật khẩu web, không ai giả mạo được điểm danh.'),
        PageBreak(),
    ]

    # ── PHẦN 5: GIAO DIỆN WEB ────────────────────────────────────────────────
    story.append(section_header('PHẦN 5: GIAO DIỆN WEB'))

    # Slide 13
    story += [
        slide_header(13, 'Trang đăng nhập'), sp(8),
        bullet('Đăng nhập bằng tài khoản Google (1 click)'),
        bullet('Tất cả trang khác đều yêu cầu đăng nhập'),
        sp(6),
    ] + img(f'{SS}/classes.png', caption='Giao diện web — Classes page (authenticated)') + [sp(12)]

    # Slide 14
    story += [
        slide_header(14, 'Dashboard chính'), sp(8),
        body('Callout đánh số từng vùng:'),
        num(1, 'Thẻ lớp hiện tại — lớp đang diễn ra hoặc lớp tiếp theo, kèm tổng check-in hôm nay'),
        num(2, 'Thanh lịch học hôm nay — timeline tất cả buổi học trong ngày'),
        num(3, '4 thẻ thống kê — số buổi học hôm nay, đã điểm danh, tỷ lệ chuyên cần (%), thiết bị online'),
        num(4, 'Biểu đồ đường — xu hướng chuyên cần theo tuần (đúng giờ / trễ / vắng)'),
        num(5, 'Biểu đồ tròn — tỷ lệ phần trăm đúng giờ / trễ / vắng'),
        num(6, 'Biểu đồ cột xếp chồng — so sánh chuyên cần giữa các lớp'),
        num(7, 'Danh sách thiết bị — trạng thái online/offline, phòng, thời gian kết nối cuối'),
        sp(6),
    ] + img(f'{SS}/dashboard.png', caption='Screenshot Dashboard — dữ liệu thực từ Supabase') + [PageBreak()]

    # Slide 15
    story += [
        slide_header(15, 'Chi tiết điểm danh lớp'), sp(8),
        num(1, '4 thẻ thống kê — tổng SV, đúng giờ, trễ, vắng'),
        num(2, 'Bảng điểm danh — MSSV, họ tên, giờ đến, ghế, nhãn màu (cập nhật thời gian thực)'),
        num(3, 'Tỷ lệ chuyên cần — phần trăm lớn, trễ tính 0.5 điểm, cảnh báo nếu dưới 80%'),
        num(4, 'Sơ đồ ghế ngồi — lưới 3x5, mỗi ô tô màu (xanh = đúng giờ, cam = trễ, xám = trống)'),
        sp(6),
    ] + img(f'{SS}/class-detail.png', caption='Screenshot Class Detail — Introduction to IoT (75% attendance)') + [sp(12)]

    # Slide 16
    story += [
        slide_header(16, 'Thời khóa biểu'), sp(8),
        bullet('4 thẻ thống kê: hôm nay, tuần này, tổng giờ dạy, số môn'),
        bullet('Lưới thời gian 07:00–17:00, Thứ 2–Thứ 7'),
        bullet('Chuyển xem Tuần / Ngày (chọn ngày cụ thể ở chế độ Ngày)'),
        bullet('Nền vàng đánh dấu ngày và giờ hiện tại'),
        bullet('Mỗi ô hiển thị: giờ, tên môn, mã lớp, phòng, sĩ số — tô màu theo môn'),
        sp(6),
    ] + img(f'{SS}/schedule.png', caption='Screenshot Schedule — Week view với 5 môn học') + [sp(12)]

    # Slide 17
    story += [
        slide_header(17, 'Quản lý thiết bị'), sp(8),
        bullet('Thanh tổng hợp: tổng / online / offline'),
        bullet('Lưới thẻ thiết bị: mã thiết bị, ID, phòng, thời gian kết nối, firmware, mô tả'),
        bullet('Tìm kiếm / lọc theo mã, phòng, mô tả'),
        bullet('Nút bật / tắt → gửi lệnh cho thiết bị (xác nhận trước khi tắt)'),
        bullet('Sửa mô tả thiết bị'),
        bullet('Trạng thái tự cập nhật thời gian thực — khi thay đổi, thẻ nhấp nháy vàng 2 giây'),
        sp(6),
    ] + img(f'{SS}/devices.png', caption='Screenshot Devices — 3 devices, tất cả offline') + [PageBreak()]

    # ── PHẦN 6: SƠ ĐỒ TUẦN TỰ ───────────────────────────────────────────────
    story.append(section_header('PHẦN 6: SƠ ĐỒ TUẦN TỰ'))

    # Slide 18
    story += [
        slide_header(18, 'Từ quẹt thẻ đến web cập nhật'), sp(8),
        body('5 cột: Sinh viên | Thiết bị | Trung gian | Cloud | Web GV'),
        sp(6),
    ] + img(f'{DG}/sequence.png', caption='Sequence diagram — luồng check-in hoàn chỉnh') + [
        note('"Dưới 1 giây từ quẹt thẻ → web cập nhật"'),
        body('Nhánh phụ: Nếu thẻ không hợp lệ → chỉ đèn đỏ + loa kêu dài, không gửi gì lên cloud.'),
        PageBreak(),
    ]

    # ── PHẦN 7: KẾT LUẬN ─────────────────────────────────────────────────────
    story.append(section_header('PHẦN 7: KẾT LUẬN'))

    # Slide 19
    story += [
        slide_header(19, 'Tổng hợp tính năng & CLO'), sp(8),
    ]

    # Two-column features table
    web_features = [
        '1. Đăng nhập Google',
        '2. Dashboard: lớp hiện tại, lịch hôm nay, 4 thẻ thống kê, 3 biểu đồ',
        '3. Danh sách lớp + chi tiết điểm danh + sơ đồ ghế ngồi',
        '4. Thời khóa biểu tuần/ngày',
        '5. Bật/tắt thiết bị từ xa',
        '6. Cập nhật dữ liệu thời gian thực (Realtime)',
    ]
    device_features = [
        '1. Check-in bằng thẻ RFID',
        '2. Đèn xanh/đỏ + loa báo',
        '3. Check-in và check-out (tính giờ tham gia)',
        '4. Đếm số lượng trên màn hình',
        '5. Mở cửa tự động',
        '6. Gửi tín hiệu "còn sống" mỗi 30 giây',
        '7. Lưu tạm khi mất mạng, tự gửi lại',
    ]

    max_rows = max(len(web_features), len(device_features))
    feat_data = [['Web (6 tính năng)', 'Thiết bị (7 tính năng)']]
    for i in range(max_rows):
        wf = web_features[i] if i < len(web_features) else ''
        df = device_features[i] if i < len(device_features) else ''
        feat_data.append([wf, df])

    cell_s = ParagraphStyle('ftc', fontName=FONT, fontSize=9, textColor=C_DARK, leading=14)
    hdr_s = ParagraphStyle('fth', fontName='ArialBold', fontSize=10, textColor=colors.white, leading=14)

    feat_table_data = []
    for ri, row in enumerate(feat_data):
        s = hdr_s if ri == 0 else cell_s
        feat_table_data.append([Paragraph(c, s) for c in row])

    feat_t = Table(feat_table_data, colWidths=[CONTENT_W/2, CONTENT_W/2])
    feat_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_DARK),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))

    story += [feat_t, sp(14)]

    # CLO table
    story.append(body('<b>Bảng CLO:</b>'))
    story.append(sp(6))
    story.append(table_simple(
        [
            ['CLO', 'Yêu cầu', 'Đồ án đáp ứng'],
            ['CLO1', 'Kiến trúc, giao thức IoT', '4 tầng IoT, serial + internet'],
            ['CLO3', 'Thiết kế sơ đồ khối', 'Kiến trúc, mạch, kết nối, CSDL, tuần tự'],
            ['CLO5', 'Làm việc nhóm, thuyết trình', '3 thành viên, demo trực tiếp'],
            ['CLO6', 'Phần cứng + phần mềm IoT', 'Mạch Proteus + web + bridge + cloud'],
        ],
        col_widths=[1.8*cm, 5*cm, CONTENT_W - 6.8*cm]
    ))
    story.append(sp(12))

    # Slide 20
    story += [
        slide_header(20, 'Demo trực tiếp & Hỏi đáp'), sp(8),
        body('<b>Demo (~3 phút) — 6 bước:</b>'),
        num(1, 'Mở web → thiết bị "Đã tắt"'),
        num(2, 'Bật Proteus + bridge → web hiện "Đang hoạt động"'),
        num(3, 'Quẹt 2 thẻ hợp lệ → web cập nhật'),
        num(4, 'Quẹt 1 thẻ sai → đèn đỏ, web không thay đổi'),
        num(5, 'Nhấn "Tắt" trên web → thiết bị ngừng'),
        num(6, 'Web hiện "Đã tắt"'),
        sp(6),
        note('Phương án dự phòng: video đã quay sẵn.'),
        sp(10),
        body('<b>Hỏi đáp:</b>'),
        bullet('"Sao không dùng MQTT?" → HTTPS đơn giản hơn cho 1 thiết bị. MQTT phù hợp khi có hàng trăm thiết bị.'),
        bullet('"Bảo mật thẻ?" → Demo dùng mã đơn giản. Thực tế dùng thẻ MIFARE có mã hóa.'),
        bullet('"Mất mạng?" → Thiết bị lưu tạm, tự gửi lại khi có mạng.'),
        bullet('"Nhiều thiết bị?" → Được, mỗi thiết bị có mã riêng.'),
    ]

    return story


# ── Page template ─────────────────────────────────────────────────────────────
def on_page(canvas, doc):
    """Header + footer on every page."""
    canvas.saveState()
    # Header bar
    canvas.setFillColor(C_DARK)
    canvas.rect(0, H - 1.2*cm, W, 1.2*cm, fill=1, stroke=0)
    canvas.setFont('ArialBold', 9)
    canvas.setFillColor(colors.white)
    canvas.drawString(1.5*cm, H - 0.8*cm, 'Class Presence — Hệ thống điểm danh tự động sử dụng IoT')
    canvas.setFont(FONT, 9)
    canvas.drawRightString(W - 1.5*cm, H - 0.8*cm, 'INOT231780 — Nhóm 10')
    # Gold accent line
    canvas.setStrokeColor(C_GOLD)
    canvas.setLineWidth(2)
    canvas.line(0, H - 1.2*cm, W, H - 1.2*cm)
    # Footer
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(1.5*cm, 1.2*cm, W - 1.5*cm, 1.2*cm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(C_MUTED)
    canvas.drawString(1.5*cm, 0.7*cm, 'Tài liệu tham khảo cho AI agent tạo Prezi slides')
    canvas.drawRightString(W - 1.5*cm, 0.7*cm, f'Trang {doc.page}')
    canvas.restoreState()


def main():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=1.5*cm,
        rightMargin=1.5*cm,
        topMargin=1.8*cm,
        bottomMargin=1.8*cm,
        title='Class Presence — Slide Outline',
        author='Nhóm 10 — INOT231780',
        subject='Dàn ý slide đồ án điểm danh IoT',
    )
    story = build_story()
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'PDF saved: {OUTPUT}')


if __name__ == '__main__':
    main()
