const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber, TabStopType, TabStopPosition,
} = require('docx')

const DIAGRAMS = path.join(__dirname, 'diagrams')
const SCREENSHOTS = path.join(__dirname, 'screenshots')
const OUTPUT = path.join(__dirname, '..', 'class-presence-document.docx')

// ── Colors ──
const C = {
  dark: '2C3E50',
  gold: 'D4A853',
  green: '3D8B5E',
  red: 'C0544F',
  blue: '3B82F6',
  headerBg: '2C3E50',
  lightBg: 'F5F2EC',
  tableBorder: 'D1D5DB',
  tableAlt: 'F0EDE6',
  tableHeaderBg: '2C3E50',
}

// ── Helpers ──
const border = { style: BorderStyle.SINGLE, size: 1, color: C.tableBorder }
const borders = { top: border, bottom: border, left: border, right: border }
const noBorder = { style: BorderStyle.NONE, size: 0 }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 }

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: C.tableHeaderBg, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: 'center',
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Arial', size: 21 })],
    })],
  })
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    verticalAlign: 'center',
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text,
        bold: opts.bold || false,
        color: opts.color || '333333',
        font: 'Arial',
        size: opts.size || 21,
      })],
    })],
  })
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 32, color: C.dark })],
  })
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 26, color: C.dark })],
  })
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 23, color: C.dark })],
  })
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({
      text,
      font: 'Arial',
      size: 22,
      color: opts.color || '333333',
      bold: opts.bold || false,
      italics: opts.italic || false,
    })],
  })
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '333333' })],
  })
}

function numberedItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: '333333' })],
  })
}

function imageWithCaption(imgPath, caption, widthInches = 6) {
  const imgBuffer = fs.readFileSync(imgPath)
  const ext = path.extname(imgPath).slice(1)

  // Get image dimensions to calculate aspect ratio
  // We'll use a fixed height ratio based on common diagram sizes
  const heightInches = widthInches * 0.65 // approximate ratio

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({
        type: ext,
        data: imgBuffer,
        transformation: {
          width: Math.round(widthInches * 96),
          height: Math.round(heightInches * 96),
        },
        altText: { title: caption, description: caption, name: caption },
      })],
    }),
  ]

  if (caption) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: caption,
        font: 'Arial',
        size: 18,
        color: '666666',
        italics: true,
      })],
    }))
  }

  return children
}

function emptyPara() {
  return new Paragraph({ spacing: { after: 80 }, children: [] })
}

// ── Build Document ──
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial', color: C.dark },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: C.dark },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 23, bold: true, font: 'Arial', color: C.dark },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }, {
            level: 1, format: LevelFormat.BULLET, text: '\u2013',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers2',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers3',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'demoSteps',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [
      // ══════════════════════════════════════
      // COVER PAGE
      // ══════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          emptyPara(),
          emptyPara(),
          emptyPara(),
          emptyPara(),
          emptyPara(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({
              text: 'ĐỒ ÁN MÔN HỌC',
              font: 'Arial', size: 24, color: C.dark,
              bold: true,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({
              text: 'VẠN VẬT KẾ NỐI (INOT231780)',
              font: 'Arial', size: 22, color: '666666',
            })],
          }),
          emptyPara(),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({
              text: 'CLASS PRESENCE',
              font: 'Arial', size: 52, bold: true, color: C.dark,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({
              text: 'Hệ thống điểm danh tự động sử dụng IoT',
              font: 'Arial', size: 28, color: C.gold,
            })],
          }),
          emptyPara(),
          emptyPara(),
          emptyPara(),
          // Course info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({
              text: 'GVHD: ThS. Đinh Công Đoan',
              font: 'Arial', size: 22, color: '555555',
            })],
          }),
          emptyPara(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({
              text: 'Nhóm 10',
              font: 'Arial', size: 26, bold: true, color: C.dark,
            })],
          }),
          // Members table (centered)
          new Table({
            width: { size: 7200, type: WidthType.DXA },
            columnWidths: [1800, 2400, 3000],
            rows: [
              new TableRow({
                children: [
                  headerCell('MSSV', 1800),
                  headerCell('Họ tên', 2400),
                  headerCell('Phân công', 3000),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('22810009', 1800, { align: AlignmentType.CENTER }),
                  dataCell('Nguyễn Kim Hưng', 2400),
                  dataCell('Giao diện web, Cloud, Thiết kế hệ thống', 3000),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('22810010', 1800, { align: AlignmentType.CENTER, fill: C.tableAlt }),
                  dataCell('Đào Đức Khải', 2400, { fill: C.tableAlt }),
                  dataCell('Thiết bị, Firmware, Phần cứng', 3000, { fill: C.tableAlt }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('24810113', 1800, { align: AlignmentType.CENTER }),
                  dataCell('Phan Trương Đình Khánh', 2400),
                  dataCell('Kết nối serial, Kiểm thử, Tài liệu', 3000),
                ],
              }),
            ],
          }),
        ],
      },

      // ══════════════════════════════════════
      // MAIN CONTENT
      // ══════════════════════════════════════
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'Class Presence — Hệ thống điểm danh tự động sử dụng IoT', font: 'Arial', size: 16, color: '999999' }),
                new TextRun({ text: '\tINOT231780 — Nhóm 10', font: 'Arial', size: 16, color: '999999' }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold, space: 4 } },
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Trang ', font: 'Arial', size: 16, color: '999999' }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '999999' }),
              ],
            })],
          }),
        },
        children: [
          // ─────────────────────────────────
          // 1. GIỚI THIỆU
          // ─────────────────────────────────
          heading1('1. Giới thiệu'),

          heading2('1.1. Vấn đề thực tế'),
          bodyText('Điểm danh truyền thống trong các trường đại học tại Việt Nam đang gặp nhiều hạn chế:'),
          bulletItem('Điểm danh bằng gọi tên: mất khoảng 5 phút mỗi lớp 40 người'),
          bulletItem('Sinh viên điểm danh hộ bạn vắng'),
          bulletItem('Giảng viên không biết ai đến trễ, ai vắng cho đến khi kiểm tra lại'),
          bulletItem('Dữ liệu ghi giấy, khó thống kê cuối kỳ'),
          emptyPara(),
          bodyText('Hệ quả:', { bold: true }),
          bulletItem('Lãng phí thời gian giảng dạy'),
          bulletItem('Tỷ lệ gian lận cao'),
          bulletItem('Không có cảnh báo sớm cho sinh viên sắp thiếu điều kiện dự thi'),

          heading2('1.2. Giải pháp đề xuất'),
          bodyText('Sinh viên quẹt thẻ RFID tại thiết bị đặt ở phòng học → thiết bị tự ghi nhận → gửi dữ liệu lên cloud → giảng viên xem kết quả trên web ngay lập tức.'),
          emptyPara(),
          bodyText('Bảng so sánh các phương pháp điểm danh:', { bold: true }),

          // Comparison table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2200, 1400, 1500, 2000, 1260],
            rows: [
              new TableRow({
                children: [
                  headerCell('Phương pháp', 2200),
                  headerCell('Chi phí', 1400),
                  headerCell('Tốc độ', 1500),
                  headerCell('Chống gian lận', 2000),
                  headerCell('Xem tức thì', 1260),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Gọi tên', 2200),
                  dataCell('Thấp', 1400, { align: AlignmentType.CENTER }),
                  dataCell('Chậm (~5 phút)', 1500, { align: AlignmentType.CENTER }),
                  dataCell('Kém', 2000, { align: AlignmentType.CENTER }),
                  dataCell('Không', 1260, { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('QR Code', 2200, { fill: C.tableAlt }),
                  dataCell('Thấp', 1400, { align: AlignmentType.CENTER, fill: C.tableAlt }),
                  dataCell('Nhanh', 1500, { align: AlignmentType.CENTER, fill: C.tableAlt }),
                  dataCell('Kém (dễ chia sẻ)', 2000, { align: AlignmentType.CENTER, fill: C.tableAlt }),
                  dataCell('Có', 1260, { align: AlignmentType.CENTER, fill: C.tableAlt }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Nhận diện khuôn mặt', 2200),
                  dataCell('Cao', 1400, { align: AlignmentType.CENTER }),
                  dataCell('Nhanh', 1500, { align: AlignmentType.CENTER }),
                  dataCell('Tốt', 2000, { align: AlignmentType.CENTER }),
                  dataCell('Có', 1260, { align: AlignmentType.CENTER }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('RFID (đề xuất)', 2200, { bold: true, fill: '2C5F3E', color: 'FFFFFF' }),
                  dataCell('~20k/thẻ', 1400, { align: AlignmentType.CENTER, bold: true, fill: '2C5F3E', color: 'FFFFFF' }),
                  dataCell('<2 giây', 1500, { align: AlignmentType.CENTER, bold: true, fill: '2C5F3E', color: 'FFFFFF' }),
                  dataCell('Tốt (thẻ vật lý)', 2000, { align: AlignmentType.CENTER, bold: true, fill: '2C5F3E', color: 'FFFFFF' }),
                  dataCell('Có', 1260, { align: AlignmentType.CENTER, bold: true, fill: '2C5F3E', color: 'FFFFFF' }),
                ],
              }),
            ],
          }),

          // ─────────────────────────────────
          // 2. KIẾN TRÚC HỆ THỐNG
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('2. Kiến trúc hệ thống'),

          heading2('2.1. Kiến trúc tổng thể'),
          bodyText('Hệ thống được thiết kế theo mô hình 4 tầng IoT, từ tầng cảm nhận (thiết bị vật lý) đến tầng ứng dụng (web cho giảng viên). Hai luồng dữ liệu chính: dữ liệu điểm danh đi lên và lệnh điều khiển đi xuống.'),
          emptyPara(),

          // Layer table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1500, 2000, 5860],
            rows: [
              new TableRow({
                children: [
                  headerCell('Tầng', 1500),
                  headerCell('Tên', 2000),
                  headerCell('Mô tả', 5860),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Tầng 4', 1500, { align: AlignmentType.CENTER, fill: 'DBEAFE', color: C.blue, bold: true }),
                  dataCell('Ứng dụng', 2000, { fill: 'DBEAFE', bold: true }),
                  dataCell('Web cho giảng viên: biểu đồ, sơ đồ ghế, bật/tắt thiết bị', 5860, { fill: 'DBEAFE' }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Tầng 3', 1500, { align: AlignmentType.CENTER, fill: 'EDE9FE', color: '8B5CF6', bold: true }),
                  dataCell('Xử lý', 2000, { fill: 'EDE9FE', bold: true }),
                  dataCell('Cloud (Supabase): lưu dữ liệu, đăng nhập Google, gửi thông báo tức thì', 5860, { fill: 'EDE9FE' }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Tầng 2', 1500, { align: AlignmentType.CENTER, fill: 'FEF3C7', color: 'B45309', bold: true }),
                  dataCell('Mạng', 2000, { fill: 'FEF3C7', bold: true }),
                  dataCell('Kết nối: dây serial + chương trình trung gian (Python) + internet (HTTPS)', 5860, { fill: 'FEF3C7' }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('Tầng 1', 1500, { align: AlignmentType.CENTER, fill: 'D1FAE5', color: C.green, bold: true }),
                  dataCell('Cảm nhận', 2000, { fill: 'D1FAE5', bold: true }),
                  dataCell('Thiết bị phòng học: Raspberry Pi + đầu đọc RFID + màn hình LCD + đèn + loa + motor cửa', 5860, { fill: 'D1FAE5' }),
                ],
              }),
            ],
          }),

          ...imageWithCaption(path.join(DIAGRAMS, 'architecture.png'), 'Hình 1: Sơ đồ kiến trúc 4 tầng IoT'),

          heading2('2.2. Luồng điểm danh'),
          bodyText('Chuỗi 6 bước từ khi sinh viên quẹt thẻ đến khi web giảng viên cập nhật, toàn bộ quá trình diễn ra dưới 1 giây:'),
          numberedItem('Quẹt thẻ — Sinh viên đưa thẻ RFID vào đầu đọc'),
          numberedItem('Kiểm tra — Thiết bị so sánh mã thẻ, nếu hợp lệ: đèn xanh + loa bíp + cửa mở'),
          numberedItem('Gửi serial — Thiết bị gửi mã thẻ qua dây đến chương trình trung gian'),
          numberedItem('Lên cloud — Chương trình trung gian gửi lên internet, cloud lưu lại'),
          numberedItem('Thông báo — Cloud gửi tín hiệu tức thì đến web giảng viên'),
          numberedItem('Web cập nhật — Bảng thêm dòng, ghế đổi màu, biểu đồ thay đổi'),

          ...imageWithCaption(path.join(DIAGRAMS, 'checkin-flow.png'), 'Hình 2: Luồng điểm danh — thiết bị → cloud → web'),

          heading2('2.3. Luồng điều khiển thiết bị'),
          bodyText('5 bước từ khi giảng viên nhấn "Tắt" trên web đến khi thiết bị ngừng hoạt động:'),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Giảng viên nhấn "Tắt" — Trên web dashboard', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Ghi lệnh — Web lưu lệnh vào cloud, trạng thái "Đang chờ"', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Bridge kiểm tra — Chương trình trung gian kiểm tra mỗi 3 giây, thấy lệnh mới', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Chuyển serial — Gửi lệnh qua dây đến thiết bị', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers2', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Thiết bị tắt — Ngừng quét, tắt đèn, gửi xác nhận ngược lại → web hiện "Đã tắt"', font: 'Arial', size: 22, color: '333333' })],
          }),
          bodyText('Trạng thái lệnh: Đang chờ → Đã gửi → Đã thực thi', { italic: true }),

          ...imageWithCaption(path.join(DIAGRAMS, 'control-flow.png'), 'Hình 3: Luồng điều khiển — web → cloud → bridge → thiết bị'),

          // ─────────────────────────────────
          // 3. THIẾT KẾ PHẦN CỨNG
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('3. Thiết kế phần cứng'),

          heading2('3.1. Sơ đồ mạch Proteus'),
          bodyText('Mạch được thiết kế trên phần mềm Proteus Design Suite, sử dụng Raspberry Pi 3 làm bộ xử lý trung tâm cùng các linh kiện ngoại vi:'),
          emptyPara(),

          // Component table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1500, 3430, 4430],
            rows: [
              new TableRow({
                children: [
                  headerCell('Ký hiệu', 1500),
                  headerCell('Linh kiện', 3430),
                  headerCell('Chức năng', 4430),
                ],
              }),
              ...([
                ['U1', 'Raspberry Pi 3', 'Bộ xử lý chính'],
                ['LCD1', 'Màn hình LCD', 'Hiển thị trạng thái'],
                ['VT1', 'Đầu đọc RFID', 'Đọc thẻ sinh viên'],
                ['BUZ1', 'Loa báo', 'Âm thanh phản hồi'],
                ['LED1', 'Đèn xanh', 'Thẻ hợp lệ'],
                ['LED2', 'Đèn đỏ', 'Thẻ không hợp lệ'],
                ['SCAN', 'Nút bắt đầu quét', 'Kích hoạt chế độ quét'],
                ['COUNT', 'Nút xem số lượng', 'Hiển thị số check-in'],
                ['U2', 'Bộ điều khiển motor', 'Điều khiển cửa tự động'],
              ].map((row, i) => new TableRow({
                children: [
                  dataCell(row[0], 1500, { align: AlignmentType.CENTER, fill: i % 2 ? C.tableAlt : undefined, bold: true }),
                  dataCell(row[1], 3430, { fill: i % 2 ? C.tableAlt : undefined }),
                  dataCell(row[2], 4430, { fill: i % 2 ? C.tableAlt : undefined }),
                ],
              }))),
            ],
          }),

          heading2('3.2. Sơ đồ kết nối linh kiện'),
          bodyText('Sơ đồ dạng hub-spoke: Raspberry Pi ở trung tâm, các linh kiện xếp xung quanh, phân nhóm theo màu — xanh lá cho đầu vào (nút bấm, đầu đọc), xanh dương cho đầu ra (đèn, loa, motor, màn hình).'),

          ...imageWithCaption(path.join(DIAGRAMS, 'connections.png'), 'Hình 4: Sơ đồ kết nối hub-spoke — Raspberry Pi 3'),

          heading3('Nhóm đầu vào'),
          bulletItem('Nút SCAN → GPIO4'),
          bulletItem('Nút COUNT → GPIO17'),
          bulletItem('Đầu đọc RFID → UART'),

          heading3('Nhóm đầu ra'),
          bulletItem('Màn hình LCD → I2C'),
          bulletItem('Đèn xanh → GPIO19'),
          bulletItem('Đèn đỏ → GPIO18'),
          bulletItem('Loa báo → GPIO6'),
          bulletItem('Motor cửa → I2C'),

          heading2('3.3. Hoạt động thiết bị từng bước'),
          bodyText('Thiết bị hoạt động theo trình tự bậc thang, với nhánh rẽ tại bước kiểm tra mã thẻ:'),

          ...imageWithCaption(path.join(DIAGRAMS, 'device-steps.png'), 'Hình 5: Luồng quẹt thẻ — hợp lệ (xanh) vs không hợp lệ (đỏ)'),

          bodyText('Nếu thẻ hợp lệ:', { bold: true }),
          bulletItem('Màn hình hiện "CHECK DONE"'),
          bulletItem('Đèn xanh sáng + loa kêu ngắn'),
          bulletItem('Cửa mở 3 giây'),
          bulletItem('Gửi mã thẻ qua serial lên cloud'),

          bodyText('Nếu thẻ không hợp lệ:', { bold: true }),
          bulletItem('Màn hình hiện "Invalid Card"'),
          bulletItem('Đèn đỏ sáng + loa kêu dài'),
          bulletItem('Không gửi gì lên cloud'),

          emptyPara(),
          bodyText('Nút COUNT: Nhấn bất kỳ lúc nào → màn hình hiện số người đã check-in.', { italic: true }),

          heading2('3.4. Chương trình trung gian (Serial Bridge)'),
          bodyText('Python bridge kết nối thiết bị vật lý với Supabase cloud, thực hiện 4 chức năng chính:'),
          new Paragraph({
            numbering: { reference: 'numbers3', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Nhận check-in từ thiết bị → gửi lên cloud', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers3', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Nhận tín hiệu "còn sống" → báo cloud thiết bị đang hoạt động', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers3', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Kiểm tra cloud mỗi 3 giây → nếu có lệnh mới → chuyển cho thiết bị', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'numbers3', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Mất mạng → lưu tạm vào hàng đợi → có mạng lại thì gửi hết', font: 'Arial', size: 22, color: '333333' })],
          }),

          ...imageWithCaption(path.join(DIAGRAMS, 'bridge.png'), 'Hình 6: Serial Bridge — thiết bị ↔ Python ↔ Supabase'),

          // ─────────────────────────────────
          // 4. CƠ SỞ DỮ LIỆU
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('4. Cơ sở dữ liệu'),

          heading2('4.1. Sơ đồ cơ sở dữ liệu'),
          bodyText('Hệ thống sử dụng 7 bảng trên Supabase (PostgreSQL), tất cả dùng tiền tố cp_, UUID làm khóa chính, và bật Row Level Security (RLS) trên toàn bộ.'),

          ...imageWithCaption(path.join(DIAGRAMS, 'erd.png'), 'Hình 7: ERD — 7 bảng: rooms, classes, students, devices, commands, attendance_logs, attendance_sessions'),

          bodyText('Các nhóm bảng:', { bold: true }),
          bulletItem('Nhóm quản lý: Phòng học → Lớp học → Sinh viên'),
          bulletItem('Nhóm thiết bị: Phòng học → Thiết bị → Lệnh điều khiển'),
          bulletItem('Nhóm điểm danh: Điểm danh (giờ check-in, trạng thái) và Phiên check-in/out (giờ vào, giờ ra)'),

          heading2('4.2. Bảo mật dữ liệu (RLS)'),
          bodyText('Hệ thống phân quyền rõ ràng giữa giảng viên (qua web) và bridge (service_role):'),

          ...imageWithCaption(path.join(DIAGRAMS, 'security.png'), 'Hình 8: RLS policy — giảng viên chỉ SELECT, bridge mới INSERT được điểm danh'),

          bodyText('Giảng viên (qua web):', { bold: true }),
          bulletItem('Xem tất cả dữ liệu (SELECT)'),
          bulletItem('Gửi lệnh cho thiết bị'),
          bulletItem('Không thể sửa/thêm điểm danh'),

          bodyText('Bridge (có khóa bí mật — service_role):', { bold: true }),
          bulletItem('Ghi điểm danh (INSERT)'),
          bulletItem('Cập nhật trạng thái thiết bị'),

          emptyPara(),
          bodyText('Điểm quan trọng: Chỉ bridge (service_role) mới ghi được điểm danh → ngay cả khi lộ mật khẩu web, không ai giả mạo được điểm danh.', { bold: true }),

          // ─────────────────────────────────
          // 5. GIAO DIỆN WEB
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('5. Giao diện web'),
          bodyText('Giao diện web được xây dựng bằng Vue 3 + Vuetify 3 + TypeScript, triển khai trên Supabase. Đăng nhập bằng tài khoản Google (1 click), tất cả trang đều yêu cầu đăng nhập.'),

          heading2('5.1. Trang đăng nhập & Danh sách lớp'),
          ...imageWithCaption(path.join(SCREENSHOTS, 'classes.png'), 'Hình 9: Giao diện danh sách lớp học'),

          bulletItem('Đăng nhập bằng tài khoản Google (1 click)'),
          bulletItem('Hiển thị danh sách lớp: mã lớp, tên môn, phòng, giờ học'),
          bulletItem('Click vào lớp để xem chi tiết điểm danh'),

          heading2('5.2. Dashboard chính'),
          ...imageWithCaption(path.join(SCREENSHOTS, 'dashboard.png'), 'Hình 10: Dashboard — dữ liệu thực từ Supabase'),

          bodyText('Dashboard hiển thị 7 thành phần chính:'),
          bulletItem('Thẻ lớp hiện tại — lớp đang diễn ra hoặc lớp tiếp theo, kèm tổng check-in hôm nay'),
          bulletItem('Thanh lịch học hôm nay — timeline tất cả buổi học trong ngày'),
          bulletItem('4 thẻ thống kê — số buổi học hôm nay, đã điểm danh, tỷ lệ chuyên cần (%), thiết bị online'),
          bulletItem('Biểu đồ đường — xu hướng chuyên cần theo tuần (đúng giờ / trễ / vắng)'),
          bulletItem('Biểu đồ tròn — tỷ lệ phần trăm đúng giờ / trễ / vắng'),
          bulletItem('Biểu đồ cột xếp chồng — so sánh chuyên cần giữa các lớp'),
          bulletItem('Danh sách thiết bị — trạng thái online/offline, phòng, thời gian kết nối cuối'),

          heading2('5.3. Chi tiết điểm danh lớp'),
          ...imageWithCaption(path.join(SCREENSHOTS, 'class-detail.png'), 'Hình 11: Chi tiết lớp — Introduction to IoT (75% attendance)'),

          bulletItem('4 thẻ thống kê — tổng sinh viên, đúng giờ, trễ, vắng'),
          bulletItem('Bảng điểm danh — MSSV, họ tên, giờ đến, ghế, nhãn màu (cập nhật thời gian thực)'),
          bulletItem('Tỷ lệ chuyên cần — phần trăm lớn, trễ tính 0.5 điểm, cảnh báo nếu dưới 80%'),
          bulletItem('Sơ đồ ghế ngồi — lưới 3×5, mỗi ô tô màu (xanh = đúng giờ, cam = trễ, xám = trống)'),

          heading2('5.4. Thời khóa biểu'),
          ...imageWithCaption(path.join(SCREENSHOTS, 'schedule.png'), 'Hình 12: Thời khóa biểu — Week view với 5 môn học'),

          bulletItem('4 thẻ thống kê: hôm nay, tuần này, tổng giờ dạy, số môn'),
          bulletItem('Lưới thời gian 07:00–17:00, Thứ 2–Thứ 7'),
          bulletItem('Chuyển xem Tuần / Ngày (chọn ngày cụ thể ở chế độ Ngày)'),
          bulletItem('Nền vàng đánh dấu ngày và giờ hiện tại'),
          bulletItem('Mỗi ô hiển thị: giờ, tên môn, mã lớp, phòng, sĩ số — tô màu theo môn'),

          heading2('5.5. Quản lý thiết bị'),
          ...imageWithCaption(path.join(SCREENSHOTS, 'devices.png'), 'Hình 13: Quản lý thiết bị — 3 devices, trạng thái offline'),

          bulletItem('Thanh tổng hợp: tổng / online / offline'),
          bulletItem('Lưới thẻ thiết bị: mã thiết bị, ID, phòng, thời gian kết nối, firmware, mô tả'),
          bulletItem('Tìm kiếm / lọc theo mã, phòng, mô tả'),
          bulletItem('Nút bật / tắt → gửi lệnh cho thiết bị (xác nhận trước khi tắt)'),
          bulletItem('Sửa mô tả thiết bị'),
          bulletItem('Trạng thái tự cập nhật thời gian thực — khi thay đổi, thẻ nhấp nháy vàng 2 giây'),

          // ─────────────────────────────────
          // 6. SƠ ĐỒ TUẦN TỰ
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('6. Sơ đồ tuần tự'),
          bodyText('Sơ đồ tuần tự mô tả toàn bộ luồng từ khi sinh viên quẹt thẻ đến khi web giảng viên cập nhật, qua 5 thành phần: Sinh viên → Thiết bị → Trung gian → Cloud → Web GV.'),

          ...imageWithCaption(path.join(DIAGRAMS, 'sequence.png'), 'Hình 14: Sequence diagram — luồng check-in hoàn chỉnh'),

          bodyText('Nhánh phụ: Nếu thẻ không hợp lệ → chỉ đèn đỏ + loa kêu dài, không gửi gì lên cloud.', { italic: true }),
          emptyPara(),
          bodyText('Thời gian xử lý: Dưới 1 giây từ quẹt thẻ → web cập nhật.', { bold: true }),

          // ─────────────────────────────────
          // 7. KẾT LUẬN
          // ─────────────────────────────────
          new Paragraph({ children: [new PageBreak()] }),
          heading1('7. Tổng hợp tính năng & CLO'),

          heading2('7.1. Tính năng đã hoàn thành'),

          // Feature table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4680, 4680],
            rows: [
              new TableRow({
                children: [
                  headerCell('Web (6 tính năng)', 4680),
                  headerCell('Thiết bị (7 tính năng)', 4680),
                ],
              }),
              ...([
                ['Đăng nhập Google', 'Check-in bằng thẻ RFID'],
                ['Dashboard: lớp hiện tại, lịch hôm nay, 4 thẻ thống kê, 3 biểu đồ', 'Đèn xanh/đỏ + loa báo'],
                ['Danh sách lớp + chi tiết điểm danh + sơ đồ ghế ngồi', 'Check-in và check-out (tính giờ tham gia)'],
                ['Thời khóa biểu tuần/ngày', 'Đếm số lượng trên màn hình'],
                ['Bật/tắt thiết bị từ xa', 'Mở cửa tự động'],
                ['Cập nhật dữ liệu thời gian thực (Realtime)', 'Gửi tín hiệu "còn sống" mỗi 30 giây'],
                ['', 'Lưu tạm khi mất mạng, tự gửi lại'],
              ].map((row, i) => new TableRow({
                children: [
                  dataCell(row[0] ? `${Math.min(i + 1, 6)}. ${row[0]}` : '', 4680, { fill: i % 2 ? C.tableAlt : undefined }),
                  dataCell(`${i + 1}. ${row[1]}`, 4680, { fill: i % 2 ? C.tableAlt : undefined }),
                ],
              }))),
            ],
          }),

          heading2('7.2. Đáp ứng CLO'),

          // CLO table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1000, 3180, 5180],
            rows: [
              new TableRow({
                children: [
                  headerCell('CLO', 1000),
                  headerCell('Yêu cầu', 3180),
                  headerCell('Đồ án đáp ứng', 5180),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('CLO1', 1000, { align: AlignmentType.CENTER, bold: true }),
                  dataCell('Kiến trúc, giao thức IoT', 3180),
                  dataCell('4 tầng IoT, serial + internet', 5180),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('CLO3', 1000, { align: AlignmentType.CENTER, bold: true, fill: C.tableAlt }),
                  dataCell('Thiết kế sơ đồ khối', 3180, { fill: C.tableAlt }),
                  dataCell('Kiến trúc, mạch, kết nối, CSDL, tuần tự', 5180, { fill: C.tableAlt }),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('CLO5', 1000, { align: AlignmentType.CENTER, bold: true }),
                  dataCell('Làm việc nhóm, thuyết trình', 3180),
                  dataCell('3 thành viên, demo trực tiếp', 5180),
                ],
              }),
              new TableRow({
                children: [
                  dataCell('CLO6', 1000, { align: AlignmentType.CENTER, bold: true, fill: C.tableAlt }),
                  dataCell('Phần cứng + phần mềm IoT', 3180, { fill: C.tableAlt }),
                  dataCell('Mạch Proteus + web + bridge + cloud', 5180, { fill: C.tableAlt }),
                ],
              }),
            ],
          }),

          // ─────────────────────────────────
          // 8. DEMO
          // ─────────────────────────────────
          emptyPara(),
          heading1('8. Demo trực tiếp'),
          bodyText('Kế hoạch demo (~3 phút) — 6 bước:'),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Mở web → thiết bị "Đã tắt"', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Bật Proteus + bridge → web hiện "Đang hoạt động"', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Quẹt 2 thẻ hợp lệ → web cập nhật', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Quẹt 1 thẻ sai → đèn đỏ, web không thay đổi', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Nhấn "Tắt" trên web → thiết bị ngừng', font: 'Arial', size: 22, color: '333333' })],
          }),
          new Paragraph({
            numbering: { reference: 'demoSteps', level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: 'Web hiện "Đã tắt"', font: 'Arial', size: 22, color: '333333' })],
          }),

          emptyPara(),
          bodyText('Phương án dự phòng: video đã quay sẵn.', { italic: true }),

          heading2('8.1. Câu hỏi thường gặp'),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '"Sao không dùng MQTT?" ', font: 'Arial', size: 22, bold: true, color: C.dark }),
              new TextRun({ text: '→ HTTPS đơn giản hơn cho 1 thiết bị. MQTT phù hợp khi có hàng trăm thiết bị.', font: 'Arial', size: 22, color: '333333' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '"Bảo mật thẻ?" ', font: 'Arial', size: 22, bold: true, color: C.dark }),
              new TextRun({ text: '→ Demo dùng mã đơn giản. Thực tế dùng thẻ MIFARE có mã hóa.', font: 'Arial', size: 22, color: '333333' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '"Mất mạng?" ', font: 'Arial', size: 22, bold: true, color: C.dark }),
              new TextRun({ text: '→ Thiết bị lưu tạm, tự gửi lại khi có mạng.', font: 'Arial', size: 22, color: '333333' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '"Nhiều thiết bị?" ', font: 'Arial', size: 22, bold: true, color: C.dark }),
              new TextRun({ text: '→ Được, mỗi thiết bị có mã riêng.', font: 'Arial', size: 22, color: '333333' }),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(OUTPUT, buffer)
  console.log(`Created: ${OUTPUT}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
