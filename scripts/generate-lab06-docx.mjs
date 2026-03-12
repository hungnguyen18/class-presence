import fs from 'fs'
import path from 'path'
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

const OUTPUT_NAME = 'lab06-rfid.docx'
const outputPath = path.join(process.cwd(), OUTPUT_NAME)

const bulletConfig = {
  reference: 'bullets',
  levels: [
    {
      level: 0,
      format: LevelFormat.BULLET,
      text: '•',
      alignment: AlignmentType.LEFT,
      style: {
        paragraph: {
          indent: { left: 720, hanging: 360 },
        },
      },
    },
  ],
}

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 }

const doc = new Document({
  numbering: { config: [bulletConfig] },
  styles: {
    default: {
      document: {
        run: {
          font: 'Arial',
          size: 24,
        },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: buildContent(),
    },
  ],
})

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] })
}

function para(text, opts = {}) {
  const { run = {}, ...paragraph } = opts

  return new Paragraph({
    children: [new TextRun({ text, ...run })],
    ...paragraph,
  })
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun(text)],
  })
}

function buildContent() {
  const tableBorders = { top: border, bottom: border, left: border, right: border }
  const tableWidth = 9360
  const colWidths = [2800, 6560]

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Báo cáo Lab 06 – Hệ thống điểm danh RFID (Proteus + Raspberry Pi 3)',
          bold: true,
          size: 32,
        }),
      ],
    }),
    para(
      'Tài liệu này tóm tắt logic mô phỏng đã trích xuất từ project Proteus (RPI3_1.XML) và cung cấp hướng dẫn thao tác. Các file .DSN/.CDB của Proteus là nhị phân, chưa thể đọc trong môi trường hiện tại. PDF “BÀI 7_HeThongRFID.pdf” chưa trích xuất được, cần bổ sung thủ công nếu có nội dung.',
    ),

    heading('1. Mục tiêu học tập'),
    bullet('Hiểu quy trình điểm danh bằng mã thẻ (RFID code) và phản hồi giao diện LCD.'),
    bullet('Thực hành nhập mã, kiểm tra hợp lệ, ghi nhận lượt điểm danh, hiển thị tổng.'),
    bullet(
      'Làm quen với thiết bị ảo trên Proteus: Raspberry Pi 3, LCD I2C, nút bấm, terminal.',
    ),

    heading('2. Thành phần hệ thống'),
    bullet('CPU: Raspberry Pi 3 (Visual Designer cho Raspberry Pi).'),
    bullet('LCD I2C (LCD1) hiển thị thông báo.'),
    bullet('BTN1 (GPIO4) và BTN2 (GPIO17) cho thao tác xem tổng/vô hiệu hóa thẻ.'),
    bullet('Terminal VT1 (BUS SERVER) để nhập mã thẻ giả lập RFID.'),
    bullet(
      'Các file liên quan: FIRMWARE/RPI3_1.XML (flowchart), FIRMWARE.XML (khai báo), ROOT.DSN/ROOT.CDB (sơ đồ mạch nhị phân).',
    ),

    heading('3. Biến và mã thẻ hợp lệ'),
    tableTwoCols(tableWidth, colWidths, tableBorders, [
      ['tag_1', '999888777666'],
      ['tag_2', '333444555666'],
      ['tag_3', '301068686868'],
      ['count', 'Số lượt điểm danh hợp lệ đã ghi nhận.'],
      ['lcd_data / input', 'Chuỗi nhập từ VT1, dùng để so sánh với mã thẻ.'],
    ]),

    heading('4. Luồng hoạt động chính'),
    bullet('LCD khởi tạo: “Vui long nhap ma so the”.'),
    bullet('Nhập mã thẻ qua VT1 → gán vào lcd_data.'),
    bullet(
      'So sánh lcd_data với 3 mã hợp lệ; nếu trùng: hiển thị “Attendence taken” và tăng count; nếu sai: “Thay doi the”.',
    ),
    bullet('BTN1: hiển thị “Total count is” và giá trị count.'),
    bullet('BTN2: hiển thị “Invalidate card” (mô phỏng thao tác vô hiệu hóa thẻ).'),

    heading('5. Giải thích flow chart chi tiết'),
    para(
      'Flow chart trong hình được chia thành hai phần lớn: khối SETUP để khởi tạo dữ liệu ban đầu và khối LOOP để hệ thống chạy lặp liên tục. Ý nghĩa từng nhánh như sau:',
    ),
    bullet(
      'Khối SETUP: hệ thống gán trước ba mã thẻ hợp lệ vào các biến tag_1, tag_2, tag_3. Sau đó LCD1 hiển thị thông báo “VUI LONG NHAP MA SO THE” để báo rằng hệ thống sẵn sàng nhận thẻ.',
    ),
    bullet(
      'Điểm bắt đầu LOOP: sau khi setup xong, chương trình đi vào vòng lặp chính để kiểm tra trạng thái các nút và dữ liệu nhập vào trong suốt quá trình mô phỏng.',
    ),
    bullet(
      'Nhánh BTN1(): flow chart kiểm tra nút BTN1 trước. Nếu BTN1 được nhấn, LCD được xóa, in dòng “Total Count is”, chờ 1000 ms, xóa tiếp rồi in ra biến count. Mục đích của nhánh này là cho người dùng xem tổng số lượt điểm danh đã được ghi nhận.',
    ),
    bullet(
      'Nhánh BTN2(): nếu BTN1 không được nhấn thì hệ thống chuyển sang kiểm tra BTN2. Khi BTN2 được nhấn, LCD được xóa rồi hiển thị thông báo liên quan tới thao tác đổi hoặc vô hiệu hóa thẻ. Trong sơ đồ ảnh bạn gửi có xuất hiện cả cụm “Thay doi The” và “invalid card”, nghĩa là nhánh này dùng để báo thẻ không hợp lệ hoặc yêu cầu thay thẻ.',
    ),
    bullet(
      'Khối VT1 input: sau khi hiển thị thông báo ở nhánh xử lý thẻ, terminal VT1 nhận dữ liệu người dùng nhập vào. Tùy chọn Echo = TRUE nghĩa là ký tự nhập sẽ được phản hồi lại trên terminal. Dữ liệu nhập được lưu vào biến lcd_data.',
    ),
    bullet(
      'Khối điều kiện so sánh: hình thoi ở giữa kiểm tra ba điều kiện lcd_data == tag_1, lcd_data == tag_2 hoặc lcd_data == tag_3. Đây là bước xác thực mã thẻ có thuộc danh sách hợp lệ hay không.',
    ),
    bullet(
      'Nhánh YES của điều kiện: nếu mã nhập trùng với một trong ba mã hợp lệ, LCD1 được xóa, sau đó hiển thị thông báo “Da Diem Danh xong” (trong XML gốc là “Attendence taken”). Ngay sau đó biến count được cập nhật theo công thức count := count + 1. Đây là bước ghi nhận điểm danh thành công.',
    ),
    bullet(
      'Nhánh NO của điều kiện: nếu mã thẻ không trùng bất kỳ tag nào, chương trình không tăng count. Thay vào đó hệ thống quay về nhánh hiển thị thông báo đổi thẻ/invalid card để báo rằng mã vừa nhập không hợp lệ.',
    ),
    bullet(
      'Kết thúc một chu kỳ: sau khi xử lý xong một lần nhập hoặc một thao tác nút bấm, chương trình quay lại LOOP để tiếp tục chờ sự kiện tiếp theo. Vì vậy đây là mô hình điều khiển theo kiểu polling đơn giản nhưng dễ hiểu cho bài lab nhập môn.',
    ),
    para(
      'Nói ngắn gọn: flow chart mô tả một bộ điểm danh rất cơ bản — khởi tạo danh sách thẻ, nhận mã từ terminal, so khớp với danh sách hợp lệ, báo kết quả trên LCD và tăng bộ đếm khi điểm danh thành công.',
    ),

    heading('6. Hướng dẫn thao tác mô phỏng'),
    bullet('Bước 1: Chạy mô phỏng Proteus, quan sát LCD hiển thị yêu cầu nhập mã.'),
    bullet('Bước 2: Nhập một trong ba mã hợp lệ qua VT1 để ghi nhận điểm danh.'),
    bullet('Bước 3: Nhấn BTN1 để xem tổng lượt điểm danh (count).'),
    bullet('Bước 4: Nhấn BTN2 để kiểm tra thông báo “Invalidate card”.'),

    heading('7. Hạn chế & phần cần bổ sung'),
    bullet(
      'Không đọc được PDF “BÀI 7_HeThongRFID.pdf” trong môi trường hiện tại; cần thêm nội dung lý thuyết/yêu cầu báo cáo nếu có.',
    ),
    bullet(
      'ROOT.DSN/ROOT.CDB chỉ mở được bằng Proteus GUI; chưa có sơ đồ hình ảnh để chèn vào báo cáo.',
    ),

    heading('8. Ghi chú file dự án'),
    bullet('PROJECT.XML: metadata dự án Proteus.'),
    bullet(
      'FIRMWARE/RPI3_1.XML: flowchart chính – đã được tóm tắt ở phần luồng hoạt động.',
    ),
    bullet(
      'showlog.py, transport.js, Debug.pyz: file đi kèm dự án, không ảnh hưởng luồng logic chính.',
    ),

    para(`Tệp được sinh tự động bằng docx (npm docx) tại: ${OUTPUT_NAME}`, {
      spacing: { before: 240 },
    }),
  ]
}

function tableTwoCols(width, colWidths, borders, rows) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.DXA },
              margins: cellMargins,
              borders,
              shading: { fill: 'D5E8F0', type: ShadingType.CLEAR },
              children: [para(k, { spacing: { after: 80 }, bold: true })],
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.DXA },
              margins: cellMargins,
              borders,
              shading: { type: ShadingType.CLEAR },
              children: [para(v, { spacing: { after: 80 } })],
            }),
          ],
        }),
    ),
  })
}

const buffer = await Packer.toBuffer(doc)
fs.writeFileSync(outputPath, buffer)
console.log(`Generated ${outputPath}`)
