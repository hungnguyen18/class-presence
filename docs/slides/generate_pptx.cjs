const pptxgen = require('pptxgenjs')
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const sharp = require('sharp')
const path = require('path')

// ── Colors ──
const C = {
  dark: '2C3E50',
  gold: 'D4A853',
  green: '3D8B5E',
  red: 'C0544F',
  blue: '3B82F6',
  bg: 'F5F2EC',
  bgLight: 'F8F6F2',
  white: 'FFFFFF',
  textDark: '2C3E50',
  textMuted: '6B7280',
  tableBorder: 'D1D5DB',
  tableHeader: '2C3E50',
  tableAlt: 'F0EDE6',
}

// ── Paths ──
const DIAGRAMS = path.join(__dirname, 'diagrams')
const SCREENSHOTS = path.join(__dirname, 'screenshots')
const OUTPUT = path.join(__dirname, '..', 'slide-outline.pptx')

// ── Icon rendering ──
function renderIconSvg(IconComponent, color = '#000000', size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  )
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size)
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()
  return 'image/png;base64,' + pngBuffer.toString('base64')
}

// ── Helper: shadow factory ──
const makeShadow = () => ({
  type: 'outer', color: '000000', blur: 4, offset: 2, angle: 135, opacity: 0.1,
})

// ── Helper: add slide header bar ──
function addHeader(slide, pres, num, title) {
  // Dark header bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.7,
    fill: { color: C.dark },
  })
  // Gold accent line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.7, w: 10, h: 0.04,
    fill: { color: C.gold },
  })
  // Slide number
  slide.addText(String(num).padStart(2, '0'), {
    x: 0.3, y: 0.05, w: 0.6, h: 0.6,
    fontSize: 14, fontFace: 'Arial', color: C.gold, bold: true,
    valign: 'middle', margin: 0,
  })
  // Title text
  slide.addText(title, {
    x: 0.9, y: 0.05, w: 8.5, h: 0.6,
    fontSize: 18, fontFace: 'Arial', color: C.white, bold: true,
    valign: 'middle', margin: 0,
  })
}

// ── Helper: add section divider ──
function addSectionSlide(slide, pres, partNum, partTitle) {
  slide.background = { color: C.dark }
  slide.addText(`PHẦN ${partNum}`, {
    x: 1, y: 1.5, w: 8, h: 0.6,
    fontSize: 14, fontFace: 'Arial', color: C.gold, bold: true,
    charSpacing: 6, margin: 0,
  })
  slide.addText(partTitle, {
    x: 1, y: 2.2, w: 8, h: 1.2,
    fontSize: 36, fontFace: 'Arial', color: C.white, bold: true,
    margin: 0,
  })
  // Gold accent line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1, y: 3.6, w: 2, h: 0.04,
    fill: { color: C.gold },
  })
}

// ── Helper: content card ──
function addCard(slide, pres, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.white },
    shadow: makeShadow(),
    line: opts.border ? { color: opts.border, width: 1 } : undefined,
  })
}

// ── Helper: icon + text row ──
function addIconTextRow(slide, pres, x, y, w, iconText, title, desc, color) {
  // Icon circle
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: 0.45, h: 0.45,
    fill: { color },
  })
  slide.addText(iconText, {
    x, y, w: 0.45, h: 0.45,
    fontSize: 14, color: C.white, align: 'center', valign: 'middle',
    fontFace: 'Arial', margin: 0,
  })
  // Title
  slide.addText(title, {
    x: x + 0.6, y, w: w - 0.6, h: 0.25,
    fontSize: 13, fontFace: 'Arial', color: C.textDark, bold: true, margin: 0,
  })
  // Description
  slide.addText(desc, {
    x: x + 0.6, y: y + 0.25, w: w - 0.6, h: 0.3,
    fontSize: 10, fontFace: 'Arial', color: C.textMuted, margin: 0,
  })
}

// ── Helper: full-width image with caption ──
function addFullImage(slide, pres, imgPath, caption, num, title) {
  addHeader(slide, pres, num, title)
  slide.addImage({
    path: imgPath,
    x: 0.5, y: 0.95, w: 9, h: 4.0,
    sizing: { type: 'contain', w: 9, h: 4.0 },
  })
  if (caption) {
    slide.addText(caption, {
      x: 0.5, y: 5.05, w: 9, h: 0.4,
      fontSize: 10, fontFace: 'Arial', color: C.textMuted,
      italic: true, align: 'center', margin: 0,
    })
  }
}

// ── Helper: screenshot slide with callouts ──
function addScreenshotSlide(slide, pres, imgPath, callouts, num, title) {
  addHeader(slide, pres, num, title)
  // Screenshot
  slide.addImage({
    path: imgPath,
    x: 0.3, y: 0.95, w: 6.2, h: 4.2,
    sizing: { type: 'contain', w: 6.2, h: 4.2 },
  })
  // Callouts panel on right
  addCard(slide, pres, 6.7, 0.95, 3, 4.2, { fill: C.white })
  const textRows = callouts.map((c, i) => ({
    text: c,
    options: {
      bullet: true, breakLine: i < callouts.length - 1,
      fontSize: 9.5, fontFace: 'Arial', color: C.textDark,
      paraSpaceAfter: 6,
    },
  }))
  slide.addText(textRows, {
    x: 6.9, y: 1.1, w: 2.6, h: 3.9,
    valign: 'top', margin: 0,
  })
}

// ── Main ──
async function main() {
  const pres = new pptxgen()
  pres.layout = 'LAYOUT_16x9'
  pres.author = 'Nhóm 10'
  pres.title = 'Class Presence: Hệ thống điểm danh tự động sử dụng IoT'

  // Load icons
  const {
    MdWarning, MdError, MdCreditCard, MdVerifiedUser, MdCable, MdCloud,
    MdNotifications, MdMonitor, MdTouchApp, MdSave, MdSearch, MdSend,
    MdPowerSettingsNew, MdSchool, MdDevices, MdSecurity, MdCheckCircle,
    MdAccessTime, MdPeople, MdDashboard,
  } = require('react-icons/md')

  // ════════════════════════════════════════════
  // SLIDE 1 — Title
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.dark }

    // Gold accent line at top
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.04,
      fill: { color: C.gold },
    })

    // Main title
    slide.addText('Class Presence', {
      x: 1, y: 1.0, w: 8, h: 0.9,
      fontSize: 40, fontFace: 'Arial', color: C.white, bold: true,
      margin: 0,
    })
    slide.addText('Hệ thống điểm danh tự động sử dụng IoT', {
      x: 1, y: 1.85, w: 8, h: 0.5,
      fontSize: 18, fontFace: 'Arial', color: C.gold,
      margin: 0,
    })

    // Divider
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1, y: 2.6, w: 2, h: 0.03,
      fill: { color: C.gold },
    })

    // Course info
    slide.addText('Môn: Vạn Vật Kế Nối (INOT231780)', {
      x: 1, y: 2.9, w: 8, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: 'B0B8C4', margin: 0,
    })
    slide.addText('GVHD: ThS. Đinh Công Đoan', {
      x: 1, y: 3.2, w: 8, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: 'B0B8C4', margin: 0,
    })

    // Team members
    const members = [
      '22810009  Nguyễn Kim Hưng — Giao diện web, Cloud, Thiết kế hệ thống',
      '22810010  Đào Đức Khải — Thiết bị, Firmware, Phần cứng',
      '24810113  Phan Trương Đình Khánh — Kết nối serial, Kiểm thử, Tài liệu',
    ]
    slide.addText('Nhóm 10', {
      x: 1, y: 3.75, w: 8, h: 0.35,
      fontSize: 13, fontFace: 'Arial', color: C.gold, bold: true, margin: 0,
    })
    slide.addText(
      members.map((m, i) => ({
        text: m,
        options: { breakLine: i < members.length - 1, fontSize: 11, color: 'D0D4DA' },
      })),
      { x: 1, y: 4.1, w: 8, h: 1.2, fontFace: 'Arial', margin: 0 }
    )

    // Gold accent line at bottom
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.585, w: 10, h: 0.04,
      fill: { color: C.gold },
    })
  }

  // ════════════════════════════════════════════
  // SLIDE 2 — Vấn đề thực tế
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 2, 'Vấn đề thực tế')

    // Left column — Problems
    addCard(slide, pres, 0.4, 1.0, 4.3, 4.2)
    slide.addShape(pres.shapes.OVAL, {
      x: 0.7, y: 1.2, w: 0.5, h: 0.5,
      fill: { color: C.red },
    })
    slide.addText('!', {
      x: 0.7, y: 1.2, w: 0.5, h: 0.5,
      fontSize: 20, color: C.white, align: 'center', valign: 'middle',
      fontFace: 'Arial', bold: true, margin: 0,
    })
    slide.addText('VẤN ĐỀ', {
      x: 1.4, y: 1.25, w: 3, h: 0.4,
      fontSize: 16, fontFace: 'Arial', color: C.red, bold: true, margin: 0,
    })

    const problems = [
      'Điểm danh bằng gọi tên: mất ~5 phút mỗi lớp 40 người',
      'Sinh viên điểm danh hộ bạn vắng',
      'Giảng viên không biết ai đến trễ cho đến khi kiểm tra lại',
      'Dữ liệu ghi giấy, khó thống kê cuối kỳ',
    ]
    slide.addText(
      problems.map((p, i) => ({
        text: p,
        options: {
          bullet: true, breakLine: i < problems.length - 1,
          fontSize: 12, color: C.textDark, paraSpaceAfter: 8,
        },
      })),
      { x: 0.8, y: 1.9, w: 3.6, h: 3.0, fontFace: 'Arial', valign: 'top', margin: 0 }
    )

    // Right column — Consequences
    addCard(slide, pres, 5.3, 1.0, 4.3, 4.2)
    slide.addShape(pres.shapes.OVAL, {
      x: 5.6, y: 1.2, w: 0.5, h: 0.5,
      fill: { color: 'E8A838' },
    })
    slide.addText('⚠', {
      x: 5.6, y: 1.2, w: 0.5, h: 0.5,
      fontSize: 18, color: C.white, align: 'center', valign: 'middle',
      fontFace: 'Arial', margin: 0,
    })
    slide.addText('HỆ QUẢ', {
      x: 6.3, y: 1.25, w: 3, h: 0.4,
      fontSize: 16, fontFace: 'Arial', color: 'E8A838', bold: true, margin: 0,
    })

    const consequences = [
      'Lãng phí thời gian giảng dạy',
      'Tỷ lệ gian lận cao',
      'Không có cảnh báo sớm cho sinh viên sắp thiếu điều kiện dự thi',
    ]
    slide.addText(
      consequences.map((c, i) => ({
        text: c,
        options: {
          bullet: true, breakLine: i < consequences.length - 1,
          fontSize: 12, color: C.textDark, paraSpaceAfter: 8,
        },
      })),
      { x: 5.7, y: 1.9, w: 3.6, h: 3.0, fontFace: 'Arial', valign: 'top', margin: 0 }
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 3 — Giải pháp & So sánh
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 3, 'Giải pháp & So sánh')

    // Solution statement
    addCard(slide, pres, 0.5, 0.95, 9, 0.7, { fill: C.white })
    slide.addText(
      'Sinh viên quẹt thẻ RFID → thiết bị tự ghi nhận → gửi lên cloud → giảng viên xem trên web ngay lập tức.',
      {
        x: 0.7, y: 1.0, w: 8.6, h: 0.55,
        fontSize: 12, fontFace: 'Arial', color: C.textDark, italic: true,
        valign: 'middle', margin: 0,
      }
    )

    // Comparison table
    const headerRow = [
      { text: 'Phương pháp', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Chi phí', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Tốc độ', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Chống gian lận', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Xem tức thì', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
    ]

    const makeRow = (cells, opts = {}) =>
      cells.map(c => ({
        text: c,
        options: {
          fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle',
          fill: opts.fill ? { color: opts.fill } : undefined,
          color: opts.color || C.textDark,
          bold: opts.bold || false,
        },
      }))

    const tableData = [
      headerRow,
      makeRow(['Gọi tên', 'Thấp', 'Chậm (~5 phút)', 'Kém', 'Không'], { fill: C.white }),
      makeRow(['QR Code', 'Thấp', 'Nhanh', 'Kém (dễ chia sẻ)', 'Có'], { fill: C.tableAlt }),
      makeRow(['Nhận diện khuôn mặt', 'Cao', 'Nhanh', 'Tốt', 'Có'], { fill: C.white }),
      makeRow(['RFID (đề xuất)', '~20k/thẻ', '<2 giây', 'Tốt (thẻ vật lý)', 'Có'], {
        fill: '2C5F3E', color: C.white, bold: true,
      }),
    ]

    slide.addTable(tableData, {
      x: 0.5, y: 1.9, w: 9,
      colW: [2.2, 1.4, 1.6, 2.0, 1.3],
      rowH: [0.45, 0.45, 0.45, 0.45, 0.5],
      border: { pt: 0.5, color: C.tableBorder },
    })
  }

  // ════════════════════════════════════════════
  // SLIDE 4 — Kiến trúc tổng thể
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 4, 'Kiến trúc tổng thể')

    // Bullets on left
    const layers = [
      { label: 'Tầng 4: ỨNG DỤNG', desc: 'Web cho giảng viên: biểu đồ, sơ đồ ghế, bật/tắt thiết bị', color: C.blue },
      { label: 'Tầng 3: XỬ LÝ', desc: 'Cloud: lưu dữ liệu, đăng nhập Google, thông báo tức thì', color: '8B5CF6' },
      { label: 'Tầng 2: MẠNG', desc: 'Kết nối: dây serial + chương trình trung gian + internet', color: 'E8A838' },
      { label: 'Tầng 1: CẢM NHẬN', desc: 'Thiết bị: Raspberry Pi + đầu đọc + màn hình + đèn + loa', color: C.green },
    ]

    for (let i = 0; i < layers.length; i += 1) {
      const yPos = 1.0 + i * 1.05
      addCard(slide, pres, 0.4, yPos, 4.2, 0.85)
      // Color accent bar on left
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.4, y: yPos, w: 0.08, h: 0.85,
        fill: { color: layers[i].color },
      })
      slide.addText(layers[i].label, {
        x: 0.7, y: yPos + 0.08, w: 3.7, h: 0.3,
        fontSize: 12, fontFace: 'Arial', color: layers[i].color, bold: true, margin: 0,
      })
      slide.addText(layers[i].desc, {
        x: 0.7, y: yPos + 0.4, w: 3.7, h: 0.35,
        fontSize: 10, fontFace: 'Arial', color: C.textMuted, margin: 0,
      })
    }

    // Architecture diagram on right
    slide.addImage({
      path: path.join(DIAGRAMS, 'architecture.png'),
      x: 4.9, y: 0.95, w: 4.8, h: 4.3,
      sizing: { type: 'contain', w: 4.8, h: 4.3 },
    })
  }

  // ════════════════════════════════════════════
  // SLIDE 5 — Luồng điểm danh
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'checkin-flow.png'),
      'Dưới 1 giây từ quẹt thẻ → web cập nhật',
      5, 'Luồng điểm danh'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 6 — Luồng điều khiển
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'control-flow.png'),
      'Trạng thái lệnh: Đang chờ → Đã gửi → Đã thực thi',
      6, 'Luồng điều khiển thiết bị'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 7 — Sơ đồ mạch Proteus
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 7, 'Sơ đồ mạch Proteus')

    // Component table
    const compHeader = [
      { text: 'Ký hiệu', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Linh kiện', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
      { text: 'Chức năng', options: { fill: { color: C.dark }, color: C.white, bold: true, fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle' } },
    ]

    const components = [
      ['U1', 'Raspberry Pi 3', 'Bộ xử lý chính'],
      ['LCD1', 'Màn hình LCD', 'Hiển thị trạng thái'],
      ['VT1', 'Đầu đọc RFID', 'Đọc thẻ sinh viên'],
      ['BUZ1', 'Loa báo', 'Âm thanh phản hồi'],
      ['LED1', 'Đèn xanh', 'Thẻ hợp lệ'],
      ['LED2', 'Đèn đỏ', 'Thẻ không hợp lệ'],
      ['SCAN', 'Nút bắt đầu quét', 'Kích hoạt chế độ quét'],
      ['COUNT', 'Nút xem số lượng', 'Hiển thị số check-in'],
      ['U2', 'Bộ điều khiển motor', 'Điều khiển cửa tự động'],
    ]

    const compRows = components.map((row, i) =>
      row.map(cell => ({
        text: cell,
        options: {
          fontSize: 11, fontFace: 'Arial', align: 'center', valign: 'middle',
          fill: { color: i % 2 === 0 ? C.white : C.tableAlt },
          color: C.textDark,
        },
      }))
    )

    slide.addTable([compHeader, ...compRows], {
      x: 1.0, y: 1.1, w: 8,
      colW: [1.5, 2.5, 4.0],
      rowH: Array(10).fill(0.42),
      border: { pt: 0.5, color: C.tableBorder },
    })
  }

  // ════════════════════════════════════════════
  // SLIDE 8 — Kết nối linh kiện
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'connections.png'),
      'Hub-spoke: Raspberry Pi ở trung tâm, linh kiện xếp xung quanh',
      8, 'Sơ đồ kết nối linh kiện'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 9 — Hoạt động thiết bị
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'device-steps.png'),
      null,
      9, 'Hoạt động thiết bị từng bước'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 10 — Bridge trung gian
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 10, 'Chương trình trung gian (Serial Bridge)')

    // Image on left
    slide.addImage({
      path: path.join(DIAGRAMS, 'bridge.png'),
      x: 0.3, y: 0.95, w: 5.5, h: 3.2,
      sizing: { type: 'contain', w: 5.5, h: 3.2 },
    })

    // Key points on right
    addCard(slide, pres, 6.1, 0.95, 3.6, 4.3)
    slide.addText('Chức năng chính', {
      x: 6.3, y: 1.1, w: 3.2, h: 0.35,
      fontSize: 14, fontFace: 'Arial', color: C.dark, bold: true, margin: 0,
    })

    const bridgePoints = [
      'Nhận check-in → gửi lên cloud',
      'Nhận tín hiệu "còn sống" → báo cloud thiết bị đang hoạt động',
      'Kiểm tra cloud mỗi 3s → nếu có lệnh mới → chuyển cho thiết bị',
      'Mất mạng → lưu tạm → có mạng lại thì gửi hết',
    ]
    slide.addText(
      bridgePoints.map((p, i) => ({
        text: `${i + 1}. ${p}`,
        options: {
          breakLine: i < bridgePoints.length - 1,
          fontSize: 10.5, color: C.textDark, paraSpaceAfter: 8,
        },
      })),
      { x: 6.3, y: 1.55, w: 3.2, h: 3.4, fontFace: 'Arial', valign: 'top', margin: 0 }
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 11 — Sơ đồ CSDL
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'erd.png'),
      'Tổng 7 bảng — tất cả dùng tiền tố cp_, UUID làm khóa chính',
      11, 'Sơ đồ cơ sở dữ liệu'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 12 — Bảo mật (RLS)
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 12, 'Bảo mật dữ liệu')

    // Image on left
    slide.addImage({
      path: path.join(DIAGRAMS, 'security.png'),
      x: 0.3, y: 0.95, w: 5.5, h: 3.2,
      sizing: { type: 'contain', w: 5.5, h: 3.2 },
    })

    // Bullets on right
    addCard(slide, pres, 6.1, 0.95, 3.6, 4.3)

    slide.addText('Giảng viên (qua web)', {
      x: 6.3, y: 1.1, w: 3.2, h: 0.3,
      fontSize: 12, fontFace: 'Arial', color: C.blue, bold: true, margin: 0,
    })
    const teacherPerms = [
      { text: '✓ Xem tất cả dữ liệu', color: C.green },
      { text: '✓ Gửi lệnh cho thiết bị', color: C.green },
      { text: '✗ Không thể sửa điểm danh', color: C.red },
    ]
    slide.addText(
      teacherPerms.map((p, i) => ({
        text: p.text,
        options: {
          breakLine: i < teacherPerms.length - 1,
          fontSize: 10.5, color: p.color, paraSpaceAfter: 4,
        },
      })),
      { x: 6.3, y: 1.45, w: 3.2, h: 1.2, fontFace: 'Arial', margin: 0 }
    )

    slide.addText('Bridge (có khóa bí mật)', {
      x: 6.3, y: 2.7, w: 3.2, h: 0.3,
      fontSize: 12, fontFace: 'Arial', color: 'E8A838', bold: true, margin: 0,
    })
    const bridgePerms = [
      { text: '✓ Ghi điểm danh', color: C.green },
      { text: '✓ Cập nhật trạng thái thiết bị', color: C.green },
    ]
    slide.addText(
      bridgePerms.map((p, i) => ({
        text: p.text,
        options: {
          breakLine: i < bridgePerms.length - 1,
          fontSize: 10.5, color: p.color, paraSpaceAfter: 4,
        },
      })),
      { x: 6.3, y: 3.05, w: 3.2, h: 0.8, fontFace: 'Arial', margin: 0 }
    )

    // Key point box at bottom
    addCard(slide, pres, 0.5, 4.45, 9, 0.8, { fill: 'FEF3C7' })
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.45, w: 0.08, h: 0.8,
      fill: { color: 'E8A838' },
    })
    slide.addText(
      'Chỉ bridge mới ghi được điểm danh → ngay cả khi lộ mật khẩu web, không ai giả mạo được điểm danh.',
      {
        x: 0.8, y: 4.5, w: 8.5, h: 0.65,
        fontSize: 11, fontFace: 'Arial', color: C.textDark, bold: true,
        valign: 'middle', margin: 0,
      }
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 13 — Đăng nhập (screenshot)
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addScreenshotSlide(slide, pres,
      path.join(SCREENSHOTS, 'classes.png'),
      [
        'Đăng nhập bằng tài khoản Google (1 click)',
        'Tất cả trang khác đều yêu cầu đăng nhập',
        'Giao diện danh sách lớp học',
        'Hiển thị mã lớp, môn, phòng, số sinh viên',
      ],
      13, 'Trang đăng nhập & Danh sách lớp'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 14 — Dashboard
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addScreenshotSlide(slide, pres,
      path.join(SCREENSHOTS, 'dashboard.png'),
      [
        'Thẻ lớp hiện tại — lớp đang diễn ra hoặc tiếp theo',
        'Thanh lịch học hôm nay — timeline các buổi học',
        '4 thẻ thống kê — buổi học, điểm danh, chuyên cần, thiết bị',
        'Biểu đồ đường — xu hướng chuyên cần theo tuần',
        'Biểu đồ tròn — tỷ lệ đúng giờ / trễ / vắng',
        'Biểu đồ cột — so sánh chuyên cần giữa các lớp',
        'Danh sách thiết bị — trạng thái online/offline',
      ],
      14, 'Dashboard chính'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 15 — Chi tiết lớp
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addScreenshotSlide(slide, pres,
      path.join(SCREENSHOTS, 'class-detail.png'),
      [
        '4 thẻ thống kê — tổng SV, đúng giờ, trễ, vắng',
        'Bảng điểm danh — MSSV, họ tên, giờ đến, ghế, nhãn màu (realtime)',
        'Tỷ lệ chuyên cần — cảnh báo nếu dưới 80%',
        'Sơ đồ ghế ngồi — lưới 3×5, tô màu theo trạng thái',
      ],
      15, 'Chi tiết điểm danh lớp'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 16 — Thời khóa biểu
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addScreenshotSlide(slide, pres,
      path.join(SCREENSHOTS, 'schedule.png'),
      [
        '4 thẻ thống kê: hôm nay, tuần này, tổng giờ, số môn',
        'Lưới thời gian 07:00–17:00, Thứ 2–Thứ 7',
        'Chuyển xem Tuần / Ngày',
        'Nền vàng đánh dấu ngày và giờ hiện tại',
        'Mỗi ô: giờ, tên môn, mã lớp, phòng, sĩ số — tô màu theo môn',
      ],
      16, 'Thời khóa biểu'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 17 — Quản lý thiết bị
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addScreenshotSlide(slide, pres,
      path.join(SCREENSHOTS, 'devices.png'),
      [
        'Thanh tổng hợp: tổng / online / offline',
        'Lưới thẻ thiết bị: mã, ID, phòng, firmware',
        'Tìm kiếm / lọc theo mã, phòng, mô tả',
        'Nút bật / tắt → gửi lệnh cho thiết bị',
        'Sửa mô tả thiết bị',
        'Trạng thái tự cập nhật realtime — thẻ nhấp nháy vàng 2s',
      ],
      17, 'Quản lý thiết bị'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 18 — Sơ đồ tuần tự
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addFullImage(slide, pres,
      path.join(DIAGRAMS, 'sequence.png'),
      'Dưới 1 giây từ quẹt thẻ → web cập nhật',
      18, 'Sơ đồ tuần tự: Quẹt thẻ đến Web cập nhật'
    )
  }

  // ════════════════════════════════════════════
  // SLIDE 19 — Tổng hợp & CLO
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.bgLight }
    addHeader(slide, pres, 19, 'Tổng hợp tính năng & CLO')

    // Web features — left column
    addCard(slide, pres, 0.4, 0.95, 4.3, 2.4)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: 0.95, w: 4.3, h: 0.35,
      fill: { color: C.blue },
    })
    slide.addText('WEB (6 tính năng)', {
      x: 0.6, y: 0.95, w: 3.9, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: C.white, bold: true,
      valign: 'middle', margin: 0,
    })
    const webFeatures = [
      'Đăng nhập Google',
      'Dashboard: lớp hiện tại, lịch hôm nay, 4 thẻ thống kê, 3 biểu đồ',
      'Danh sách lớp + chi tiết điểm danh + sơ đồ ghế ngồi',
      'Thời khóa biểu tuần/ngày',
      'Bật/tắt thiết bị từ xa',
      'Cập nhật dữ liệu thời gian thực (Realtime)',
    ]
    slide.addText(
      webFeatures.map((f, i) => ({
        text: `${i + 1}. ${f}`,
        options: {
          breakLine: i < webFeatures.length - 1,
          fontSize: 9.5, color: C.textDark, paraSpaceAfter: 3,
        },
      })),
      { x: 0.6, y: 1.4, w: 3.9, h: 1.85, fontFace: 'Arial', valign: 'top', margin: 0 }
    )

    // Device features — right column
    addCard(slide, pres, 5.3, 0.95, 4.3, 2.4)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.3, y: 0.95, w: 4.3, h: 0.35,
      fill: { color: C.green },
    })
    slide.addText('THIẾT BỊ (7 tính năng)', {
      x: 5.5, y: 0.95, w: 3.9, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: C.white, bold: true,
      valign: 'middle', margin: 0,
    })
    const deviceFeatures = [
      'Check-in bằng thẻ RFID',
      'Đèn xanh/đỏ + loa báo',
      'Check-in và check-out (tính giờ tham gia)',
      'Đếm số lượng trên màn hình',
      'Mở cửa tự động',
      'Gửi tín hiệu "còn sống" mỗi 30 giây',
      'Lưu tạm khi mất mạng, tự gửi lại',
    ]
    slide.addText(
      deviceFeatures.map((f, i) => ({
        text: `${i + 1}. ${f}`,
        options: {
          breakLine: i < deviceFeatures.length - 1,
          fontSize: 9.5, color: C.textDark, paraSpaceAfter: 3,
        },
      })),
      { x: 5.5, y: 1.4, w: 3.9, h: 1.85, fontFace: 'Arial', valign: 'top', margin: 0 }
    )

    // CLO table
    const cloHeader = ['CLO', 'Yêu cầu', 'Đồ án đáp ứng'].map(h => ({
      text: h,
      options: {
        fill: { color: C.dark }, color: C.white, bold: true,
        fontSize: 10, fontFace: 'Arial', align: 'center', valign: 'middle',
      },
    }))

    const cloData = [
      ['CLO1', 'Kiến trúc, giao thức IoT', '4 tầng IoT, serial + internet'],
      ['CLO3', 'Thiết kế sơ đồ khối', 'Kiến trúc, mạch, kết nối, CSDL, tuần tự'],
      ['CLO5', 'Làm việc nhóm, thuyết trình', '3 thành viên, demo trực tiếp'],
      ['CLO6', 'Phần cứng + phần mềm IoT', 'Mạch Proteus + web + bridge + cloud'],
    ]
    const cloRows = cloData.map((row, i) =>
      row.map(cell => ({
        text: cell,
        options: {
          fontSize: 10, fontFace: 'Arial', align: 'center', valign: 'middle',
          fill: { color: i % 2 === 0 ? C.white : C.tableAlt },
          color: C.textDark,
        },
      }))
    )

    slide.addTable([cloHeader, ...cloRows], {
      x: 0.5, y: 3.6, w: 9,
      colW: [1.0, 3.0, 5.0],
      rowH: Array(5).fill(0.36),
      border: { pt: 0.5, color: C.tableBorder },
    })
  }

  // ════════════════════════════════════════════
  // SLIDE 20 — Demo & Hỏi đáp
  // ════════════════════════════════════════════
  {
    const slide = pres.addSlide()
    slide.background = { color: C.dark }

    // Gold accent at top
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.04,
      fill: { color: C.gold },
    })

    slide.addText('Demo trực tiếp & Hỏi đáp', {
      x: 0.5, y: 0.2, w: 9, h: 0.6,
      fontSize: 28, fontFace: 'Arial', color: C.white, bold: true, margin: 0,
    })

    // Demo steps — horizontal timeline
    slide.addText('DEMO (~3 PHÚT)', {
      x: 0.5, y: 0.9, w: 9, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: C.gold, bold: true,
      charSpacing: 3, margin: 0,
    })

    const demoSteps = [
      'Mở web →\nthiết bị "Đã tắt"',
      'Bật Proteus +\nbridge → "Online"',
      'Quẹt 2 thẻ →\nweb cập nhật',
      'Quẹt thẻ sai →\nđèn đỏ',
      'Nhấn "Tắt" →\nthiết bị ngừng',
      'Web hiện\n"Đã tắt"',
    ]
    const stepW = 1.35
    const stepGap = 0.15
    const startX = 0.5
    for (let i = 0; i < demoSteps.length; i += 1) {
      const x = startX + i * (stepW + stepGap)
      // Step card
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.35, w: stepW, h: 1.1,
        fill: { color: '3A5068' },
      })
      // Step number
      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.02, y: 1.3, w: 0.3, h: 0.3,
        fill: { color: C.gold },
      })
      slide.addText(String(i + 1), {
        x: x + 0.02, y: 1.3, w: 0.3, h: 0.3,
        fontSize: 11, fontFace: 'Arial', color: C.dark, bold: true,
        align: 'center', valign: 'middle', margin: 0,
      })
      // Step text
      slide.addText(demoSteps[i], {
        x: x + 0.08, y: 1.65, w: stepW - 0.16, h: 0.7,
        fontSize: 9, fontFace: 'Arial', color: 'D0D4DA',
        valign: 'top', margin: 0,
      })
    }

    // Backup plan
    slide.addText('Phương án dự phòng: video đã quay sẵn', {
      x: 0.5, y: 2.6, w: 9, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: C.textMuted, italic: true, margin: 0,
    })

    // FAQ section
    slide.addText('HỎI ĐÁP', {
      x: 0.5, y: 3.05, w: 9, h: 0.35,
      fontSize: 12, fontFace: 'Arial', color: C.gold, bold: true,
      charSpacing: 3, margin: 0,
    })

    const faqs = [
      { q: '"Sao không dùng MQTT?"', a: 'HTTPS đơn giản hơn cho 1 thiết bị. MQTT phù hợp khi có hàng trăm thiết bị.' },
      { q: '"Bảo mật thẻ?"', a: 'Demo dùng mã đơn giản. Thực tế dùng thẻ MIFARE có mã hóa.' },
      { q: '"Mất mạng?"', a: 'Thiết bị lưu tạm, tự gửi lại khi có mạng.' },
      { q: '"Nhiều thiết bị?"', a: 'Được, mỗi thiết bị có mã riêng.' },
    ]

    for (let i = 0; i < faqs.length; i += 1) {
      const y = 3.5 + i * 0.5
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 9, h: 0.42,
        fill: { color: '3A5068' },
      })
      slide.addText([
        { text: faqs[i].q, options: { bold: true, color: C.gold, fontSize: 10 } },
        { text: `  →  ${faqs[i].a}`, options: { color: 'D0D4DA', fontSize: 10 } },
      ], {
        x: 0.7, y, w: 8.6, h: 0.42,
        fontFace: 'Arial', valign: 'middle', margin: 0,
      })
    }

    // Bottom accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 5.585, w: 10, h: 0.04,
      fill: { color: C.gold },
    })
  }

  // ── Save ──
  await pres.writeFile({ fileName: OUTPUT })
  console.log(`Created: ${OUTPUT}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
