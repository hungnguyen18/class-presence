# Dàn ý Slide — Class Presence: Hệ thống điểm danh tự động sử dụng IoT

## Ngữ cảnh

Đồ án môn Vạn Vật Kế Nối (INOT231780) — Nhóm 10. Hệ thống điểm danh tự động: sinh viên quẹt thẻ RFID tại thiết bị đặt ở phòng học → dữ liệu gửi lên cloud → giảng viên xem trên web. Giảng viên cũng có thể bật/tắt thiết bị từ web.

Nhóm 3 thành viên. Thuyết trình ~20 phút + demo trực tiếp. Khán giả: giảng viên IoT và sinh viên.

Ngôn ngữ slide: **tiếng Việt**. Thuật ngữ kỹ thuật giữ nguyên tiếng Anh khi cần.

Tổng: **20 slides**.

## Phong cách trình bày

Dùng phong cách **Prezi / spatial storytelling**: mỗi phần lớn là một "khung hình tổng quan" (overview), sau đó zoom vào từng chi tiết bên trong. Khi xong chi tiết thì zoom ra lại tổng quan trước khi chuyển sang phần tiếp.

**Quy tắc hình ảnh:**

- KHÔNG dùng flowchart ký hiệu chuẩn (hình thoi, hình oval). Thay vào đó dùng **khối hình chữ nhật bo tròn** (building blocks) xếp theo chuỗi bước, nối nhau bằng mũi tên.
- Mỗi bước là 1 khối có icon + tiêu đề ngắn + 1 dòng mô tả. Tô màu nền khác nhau theo trạng thái.
- Sơ đồ luồng dùng dạng **timeline ngang** (trái → phải) hoặc **bậc thang** (trên → dưới, lệch phải dần).
- Sơ đồ kiến trúc dùng dạng **tầng xếp chồng** (giống tòa nhà).
- Sơ đồ kết nối dùng dạng **hub-spoke** (trung tâm + các nhánh tỏa ra).

---

## PHẦN 1: GIỚI THIỆU

### Slide 1 — Trang bìa

**Class Presence: Hệ thống điểm danh tự động sử dụng IoT**

- Môn: Vạn Vật Kế Nối (INOT231780)
- GVHD: ThS. Đinh Công Đoan
- Nhóm 10:
  - 22810009 Nguyễn Kim Hưng — Giao diện web, Cloud, Thiết kế hệ thống
  - 22810010 Đào Đức Khải — Kết nối serial (Bridge), Kiểm thử, Tài liệu
  - 24810113 Phan Trương Đình Khánh — Thiết kế mạch (Proteus), Firmware, Phần cứng

---

### Slide 2 — Vấn đề thực tế

**Bố cục: 2 cột. Trái = vấn đề (icon ❌ đỏ), Phải = hệ quả (icon ⚠️ vàng).**

Trái — Vấn đề:

- Điểm danh bằng gọi tên: mất ~5 phút mỗi lớp 40 người
- Sinh viên điểm danh hộ bạn vắng
- Giảng viên không biết ai đến trễ, ai vắng cho đến khi kiểm tra lại
- Dữ liệu ghi giấy, khó thống kê cuối kỳ

Phải — Hệ quả:

- Lãng phí thời gian giảng dạy
- Tỷ lệ gian lận cao
- Không có cảnh báo sớm cho sinh viên sắp thiếu điều kiện dự thi

---

### Slide 3 — Giải pháp & So sánh

**Bố cục: 1 câu mô tả giải pháp ở trên + bảng so sánh 4 phương pháp ở dưới. Hàng cuối (RFID) tô màu xanh nhấn mạnh.**

Giải pháp: Sinh viên quẹt thẻ RFID → thiết bị tự ghi nhận → gửi lên cloud → giảng viên xem trên web ngay lập tức.

| Phương pháp         | Chi phí             | Tốc độ         | Chống gian lận       | Xem tức thì |
| ------------------- | ------------------- | -------------- | -------------------- | ----------- |
| Gọi tên             | Thấp                | Chậm (~5 phút) | Kém                  | Không       |
| QR Code             | Thấp                | Nhanh          | Kém (dễ chia sẻ mã)  | Có          |
| Nhận diện khuôn mặt | Cao                 | Nhanh          | Tốt                  | Có          |
| **RFID (đề xuất)**  | **Thấp (~20k/thẻ)** | **<2 giây**    | **Tốt (thẻ vật lý)** | **Có**      |

---

## PHẦN 2: KIẾN TRÚC HỆ THỐNG

### Slide 4 — Kiến trúc tổng thể (Overview)

**Hình ảnh: 4 khối xếp chồng dọc giống tòa nhà 4 tầng. Tầng dưới cùng lớn nhất, tầng trên nhỏ dần. Mỗi tầng có nền màu khác nhau, icon bên trái, tên tầng + mô tả ngắn bên phải. Hai mũi tên dọc chạy ở bên ngoài tòa nhà: mũi tên xanh hướng lên ghi "Dữ liệu điểm danh", mũi tên đỏ hướng xuống ghi "Lệnh điều khiển".**

Tầng 4 (xanh dương): ỨNG DỤNG — Web cho giảng viên: biểu đồ, sơ đồ ghế, bật/tắt thiết bị
Tầng 3 (tím): XỬ LÝ — Cloud: lưu dữ liệu, đăng nhập Google, gửi thông báo tức thì
Tầng 2 (cam): MẠNG — Kết nối: dây serial + chương trình trung gian + internet
Tầng 1 (xanh lá): CẢM NHẬN — Thiết bị phòng học: Raspberry Pi + đầu đọc thẻ + màn hình + đèn + loa + motor cửa

---

### Slide 5 — Luồng điểm danh (zoom vào chi tiết)

**Hình ảnh: chuỗi 6 khối bo tròn xếp ngang từ trái sang phải, nối bằng mũi tên. Mỗi khối có icon phía trên, tiêu đề in đậm, 1 dòng mô tả phía dưới. Nền các khối chuyển màu gradient từ xanh lá (bên trái, thiết bị) sang xanh dương (bên phải, web).**

Khối 1 (icon thẻ): **Quẹt thẻ** — Sinh viên đưa thẻ RFID vào đầu đọc
→ Khối 2 (icon kiểm tra): **Kiểm tra** — Thiết bị so sánh mã thẻ, nếu hợp lệ: đèn xanh + loa bíp + cửa mở
→ Khối 3 (icon dây kết nối): **Gửi serial** — Thiết bị gửi mã thẻ qua dây đến chương trình trung gian
→ Khối 4 (icon mây): **Lên cloud** — Chương trình trung gian gửi lên internet, cloud lưu lại
→ Khối 5 (icon chuông): **Thông báo** — Cloud gửi tín hiệu tức thì đến web giảng viên
→ Khối 6 (icon màn hình): **Web cập nhật** — Bảng thêm dòng, ghế đổi màu, biểu đồ thay đổi

Ghi chú nhỏ góc dưới: "Dưới 1 giây từ quẹt thẻ → web cập nhật"

---

### Slide 6 — Luồng điều khiển thiết bị (zoom vào chi tiết)

**Hình ảnh: chuỗi 5 khối bo tròn xếp ngang, tương tự slide 5 nhưng mũi tên ngược hướng (phải → trái). Nền gradient từ xanh dương (web) sang đỏ/cam (thiết bị) để phân biệt.**

Khối 1 (icon tay nhấn): **Giảng viên nhấn "Tắt"** — Trên web dashboard
→ Khối 2 (icon lưu): **Ghi lệnh** — Web lưu lệnh vào cloud, trạng thái "Đang chờ"
→ Khối 3 (icon tìm kiếm): **Bridge kiểm tra** — Chương trình trung gian kiểm tra mỗi 3 giây, thấy lệnh mới
→ Khối 4 (icon gửi): **Chuyển serial** — Gửi lệnh qua dây đến thiết bị
→ Khối 5 (icon tắt nguồn): **Thiết bị tắt** — Ngừng quét, tắt đèn, gửi xác nhận ngược lại → web hiện "Đã tắt"

Ghi chú nhỏ: "Trạng thái lệnh: Đang chờ → Đã gửi → Đã thực thi"

---

## PHẦN 3: THIẾT KẾ PHẦN CỨNG

### Slide 7 — Sơ đồ mạch Proteus (Overview)

**Chiếm toàn bộ slide. Screenshot sơ đồ mạch từ Proteus, phóng to vừa đủ. Dùng callout (hộp nhỏ có mũi tên chỉ vào) đánh nhãn từng linh kiện trên hình.**

Các callout:

- U1: Raspberry Pi 3 (bộ xử lý chính)
- LCD1: Màn hình LCD
- VT1: Đầu đọc thẻ RFID
- BUZ1: Loa báo
- LED1: Đèn xanh
- LED2: Đèn đỏ
- SCAN: Nút bắt đầu quét
- COUNT: Nút xem số lượng
- U2: Bộ điều khiển motor cửa

---

### Slide 8 — Sơ đồ kết nối linh kiện (zoom vào)

**Hình ảnh dạng hub-spoke: Raspberry Pi ở trung tâm (hình tròn lớn), các linh kiện xếp xung quanh (hình tròn nhỏ hơn), nối vào trung tâm bằng đường thẳng. Trên mỗi đường ghi tên chân kết nối. Nhóm linh kiện theo màu: xanh lá = đầu vào (nút bấm, đầu đọc), xanh dương = đầu ra (đèn, loa, motor, màn hình).**

Trung tâm: **Raspberry Pi 3**

Nhóm đầu vào (xanh lá, phía trái):

- Nút SCAN ── GPIO4
- Nút COUNT ── GPIO17
- Đầu đọc RFID ── UART

Nhóm đầu ra (xanh dương, phía phải):

- Màn hình LCD ── I2C
- Đèn xanh ── GPIO19
- Đèn đỏ ── GPIO18
- Loa báo ── GPIO6
- Motor cửa ── I2C

---

### Slide 9 — Hoạt động thiết bị từng bước (zoom vào)

**Hình ảnh dạng bậc thang dọc: các khối xếp từ trên xuống, lệch phải dần tạo hình bậc thang. Mỗi bậc là 1 bước, có số thứ tự + icon + mô tả. Chia 2 nhánh ở bước kiểm tra (rẽ trái = thất bại màu đỏ, rẽ phải = thành công màu xanh).**

Bước 1: 🔘 **Nhấn nút SCAN** — Kích hoạt chế độ quét thẻ
Bước 2: 📺 **Màn hình hiện "SCAN CARD"** — Chờ sinh viên đưa thẻ
Bước 3: 💳 **Đọc mã thẻ** — Đầu đọc nhận mã từ thẻ RFID
Bước 4: 🔍 **Kiểm tra mã thẻ** — So sánh với danh sách 3 thẻ đã đăng ký
↙ Rẽ trái (nền đỏ nhạt): ↘ Rẽ phải (nền xanh nhạt):
❌ Màn hình "invalid card" ✅ Màn hình "CHECK DONE"
🔴 Đèn đỏ sáng 🟢 Đèn xanh sáng
🔊 Loa kêu dài 🔊 Loa kêu ngắn
🚪 Cửa mở 3 giây
📤 Gửi mã thẻ qua serial lên cloud

**Nhánh phụ (hộp nhỏ bên dưới):**
Nút COUNT: Nhấn bất kỳ lúc nào → màn hình hiện số người đã check-in

---

### Slide 10 — Chương trình trung gian (Serial Bridge)

**Hình ảnh: 3 khối hàng ngang, khối giữa (bridge) to hơn và có 4 bullet point bên trong. Khối trái (thiết bị) và khối phải (cloud) nhỏ hơn. Nối bằng mũi tên 2 chiều. Bên dưới khối giữa có 1 hộp nhỏ nối bằng đường đứt nét (hàng đợi offline).**

Khối trái: **Thiết bị tại phòng** (Proteus) — nối qua dây serial (9600 baud)
Khối giữa: **Chương trình trung gian** (Python) — 4 việc:
① Nhận check-in → gửi lên cloud
② Nhận tín hiệu "còn sống" → báo cloud thiết bị đang hoạt động
③ Kiểm tra cloud mỗi 3s → nếu có lệnh mới → chuyển cho thiết bị
④ Mất mạng → lưu tạm → có mạng lại thì gửi hết
Khối phải: **Cloud** (Supabase) — nối qua internet (HTTPS)
Hộp dưới (đường đứt nét): **Hàng đợi khi mất mạng**

---

## PHẦN 4: CƠ SỞ DỮ LIỆU

### Slide 11 — Sơ đồ cơ sở dữ liệu

**Hình ảnh dạng các hộp nối nhau bằng đường có mũi tên. Mỗi hộp = 1 bảng, tô nền màu khác nhau theo nhóm. Ghi tên bảng in đậm + 2–3 thông tin chính. Đường nối ghi quan hệ (1 phòng có nhiều lớp, 1 lớp có nhiều sinh viên...).**

Nhóm xanh lá (quản lý):

- **PHÒNG HỌC** (tên, sức chứa) ──1:N──► **LỚP HỌC** (mã lớp, môn, giờ học) ──1:N──► **SINH VIÊN** (MSSV, họ tên, ghế)

Nhóm xanh dương (thiết bị):

- **PHÒNG HỌC** ──1:1──► **THIẾT BỊ** (mã, online/offline) ──1:N──► **LỆNH ĐIỀU KHIỂN** (bật/tắt, trạng thái)

Nhóm cam (điểm danh):

- **ĐIỂM DANH** (giờ check-in, đúng giờ/trễ/vắng) ← liên kết từ SINH VIÊN + LỚP + THIẾT BỊ
- **PHIÊN CHECK IN/OUT** (giờ vào, giờ ra) ← liên kết từ SINH VIÊN + LỚP + THIẾT BỊ

Tổng 7 bảng.

---

### Slide 12 — Bảo mật dữ liệu

**Hình ảnh: 2 nhân vật (icon người) ở bên trái, 1 hộp "Cơ sở dữ liệu" có icon ổ khóa ở bên phải. Mỗi nhân vật có mũi tên vào CSDL, ghi rõ được phép làm gì. Dùng màu xanh cho "được phép" và đỏ cho "không được phép".**

Nhân vật 1 — **Giảng viên** (qua web):

- ✅ Xem tất cả dữ liệu
- ✅ Gửi lệnh cho thiết bị
- ❌ Không thể sửa điểm danh

Nhân vật 2 — **Chương trình trung gian** (bridge, có khóa bí mật):

- ✅ Ghi điểm danh
- ✅ Cập nhật trạng thái thiết bị

**Điểm quan trọng (hộp nhấn mạnh ở dưới):**
Chỉ bridge mới ghi được điểm danh → ngay cả khi lộ mật khẩu web, không ai giả mạo được điểm danh.

---

## PHẦN 5: GIAO DIỆN WEB

### Slide 13 — Trang đăng nhập

**Screenshot trang login. Callout ghi chú ngắn.**

- Đăng nhập bằng tài khoản Google (1 click)
- Tất cả trang khác đều yêu cầu đăng nhập

---

### Slide 14 — Dashboard chính

**Screenshot dashboard. Dùng callout đánh số từng vùng trên hình.**

① Thẻ lớp hiện tại — hiển thị lớp đang diễn ra hoặc lớp tiếp theo, kèm tổng check-in hôm nay
② Thanh lịch học hôm nay — timeline hiển thị tất cả buổi học trong ngày
③ 4 thẻ thống kê — số buổi học hôm nay, đã điểm danh, tỷ lệ chuyên cần (%), thiết bị online
④ Biểu đồ đường — xu hướng chuyên cần theo tuần (đúng giờ / trễ / vắng)
⑤ Biểu đồ tròn — tỷ lệ phần trăm đúng giờ / trễ / vắng
⑥ Biểu đồ cột xếp chồng — so sánh chuyên cần giữa các lớp
⑦ Danh sách thiết bị — trạng thái online/offline, phòng, thời gian kết nối cuối

---

### Slide 15 — Chi tiết điểm danh lớp

**Screenshot trang class detail. Callout đánh số.**

① 4 thẻ thống kê — tổng SV, đúng giờ, trễ, vắng
② Bảng điểm danh — MSSV, họ tên, giờ đến, ghế, nhãn màu (cập nhật thời gian thực)
③ Tỷ lệ chuyên cần — phần trăm lớn, trễ tính 0.5 điểm, cảnh báo nếu dưới 80%
④ Sơ đồ ghế ngồi — lưới 3×5, mỗi ô tô màu (xanh = đúng giờ, cam = trễ, xám = trống)

---

### Slide 16 — Thời khóa biểu

**Screenshot trang schedule. Callout ghi chú.**

- 4 thẻ thống kê: hôm nay, tuần này, tổng giờ dạy, số môn
- Lưới thời gian 07:00–17:00, Thứ 2–Thứ 7
- Chuyển xem Tuần / Ngày (chọn ngày cụ thể ở chế độ Ngày)
- Nền vàng đánh dấu ngày và giờ hiện tại
- Mỗi ô hiển thị: giờ, tên môn, mã lớp, phòng, sĩ số — tô màu theo môn

---

### Slide 17 — Quản lý thiết bị

**Screenshot trang device. Callout ghi chú.**

- Thanh tổng hợp: tổng / online / offline
- Lưới thẻ thiết bị: mã thiết bị, ID, phòng, thời gian kết nối, firmware, mô tả
- Tìm kiếm / lọc theo mã, phòng, mô tả
- Nút bật / tắt → gửi lệnh cho thiết bị (xác nhận trước khi tắt)
- Sửa mô tả thiết bị
- Trạng thái tự cập nhật thời gian thực — khi thay đổi, thẻ nhấp nháy vàng 2 giây

---

## PHẦN 6: SƠ ĐỒ TUẦN TỰ

### Slide 18 — Từ quẹt thẻ đến web cập nhật

**Hình ảnh dạng 5 cột đứng (mỗi cột = 1 thành phần), các khối building block xếp từ trên xuống theo thứ tự thời gian, nối ngang bằng mũi tên giữa các cột. Mỗi khối có nền màu nhạt + 1 dòng mô tả hành động. Không dùng ký hiệu sequence diagram chuẩn — chỉ dùng khối hình chữ nhật bo tròn + mũi tên.**

5 cột: **Sinh viên** | **Thiết bị** | **Trung gian** | **Cloud** | **Web GV**

Hàng 1: [SV: Quẹt thẻ] ──mũi tên──► [Thiết bị]
Hàng 2: [Thiết bị: Kiểm tra mã thẻ]
Hàng 3: [Thiết bị: Đèn xanh + loa bíp + cửa mở]
Hàng 4: [Thiết bị] ──"gửi mã thẻ"──► [Trung gian]
Hàng 5: [Trung gian] ──"gửi lên internet"──► [Cloud]
Hàng 6: [Cloud] ──"thông báo tức thì"──► [Web GV]
Hàng 7: [Web GV: Bảng + ghế + biểu đồ cập nhật]

Nhánh phụ (hộp đỏ nhạt): Nếu thẻ không hợp lệ → chỉ đèn đỏ + loa kêu dài, không gửi gì lên cloud.

Ghi chú: "Dưới 1 giây từ quẹt thẻ → web cập nhật"

---

## PHẦN 7: KẾT LUẬN

### Slide 19 — Tổng hợp tính năng & CLO

**Bố cục: phần trên chia 2 cột tính năng, phần dưới là bảng CLO.**

**Web (6 tính năng) | Thiết bị (7 tính năng)**

Web:

1. Đăng nhập Google
2. Dashboard: lớp hiện tại, lịch hôm nay, 4 thẻ thống kê, 3 biểu đồ, trạng thái thiết bị
3. Danh sách lớp + chi tiết điểm danh + sơ đồ ghế ngồi
4. Thời khóa biểu tuần/ngày
5. Bật/tắt thiết bị từ xa
6. Cập nhật dữ liệu thời gian thực (Realtime)

Thiết bị:

1. Check-in bằng thẻ RFID
2. Đèn xanh/đỏ + loa báo
3. Check-in và check-out (tính giờ tham gia)
4. Đếm số lượng trên màn hình
5. Mở cửa tự động
6. Gửi tín hiệu "còn sống" mỗi 30 giây
7. Lưu tạm khi mất mạng, tự gửi lại

**Bảng CLO:**

| CLO  | Yêu cầu                     | Đồ án đáp ứng                           |
| ---- | --------------------------- | --------------------------------------- |
| CLO1 | Kiến trúc, giao thức IoT    | 4 tầng IoT, serial + internet           |
| CLO3 | Thiết kế sơ đồ khối         | Kiến trúc, mạch, kết nối, CSDL, tuần tự |
| CLO5 | Làm việc nhóm, thuyết trình | 3 thành viên, demo trực tiếp            |
| CLO6 | Phần cứng + phần mềm IoT    | Mạch Proteus + web + bridge + cloud     |

---

### Slide 20 — Demo trực tiếp & Hỏi đáp

**Nửa trên: kế hoạch demo dạng timeline ngang 6 bước, mỗi bước là 1 khối nhỏ có icon. Nửa dưới: 4 câu hỏi thường gặp dạng accordion (câu hỏi in đậm + câu trả lời nhỏ hơn).**

**Demo (~3 phút) — 6 bước timeline ngang:**
① Mở web → thiết bị "Đã tắt"
② Bật Proteus + bridge → web hiện "Đang hoạt động"
③ Quẹt 2 thẻ hợp lệ → web cập nhật
④ Quẹt 1 thẻ sai → đèn đỏ, web không thay đổi
⑤ Nhấn "Tắt" trên web → thiết bị ngừng
⑥ Web hiện "Đã tắt"

Phương án dự phòng: video đã quay sẵn.

**Hỏi đáp:**

- **"Sao không dùng MQTT?"** → HTTPS đơn giản hơn cho 1 thiết bị. MQTT phù hợp khi có hàng trăm thiết bị.
- **"Bảo mật thẻ?"** → Demo dùng mã đơn giản. Thực tế dùng thẻ MIFARE có mã hóa.
- **"Mất mạng?"** → Thiết bị lưu tạm, tự gửi lại khi có mạng.
- **"Nhiều thiết bị?"** → Được, mỗi thiết bị có mã riêng.
