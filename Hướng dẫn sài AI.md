b1: phân rã nghiệp vụ từ file (thông tin cuộc thi của cô) -> gọi đây là file nghiệp vụ gốc 

b2. nhờ cursor quét toàn bộ src code và viết report về toàn bộ nghiệp vụ hệ thống hiện tại

b3: nhờ chat so sánh 2 file xem bị lệch những phần nào

b4: phần lệch + feedback của cô đưa vào chat để đọc -> để chat hiểu toàn bộ hệ thống của mình

# //TAO ĐÃ LÀM RA CÁC FILE NGHIỆP VỤ GỐC + NGHIỆP VỤ HIỆN TẠI + PHẦN LỆCH + FEED BACK THÀNH FILE RỒI GIỜ CHỈ CẦN LÀM TỪ BƯỚC 5 LÀ BÓC PHẦN CHỨC NĂNG BỊ LỖI RA MÀ SỬA THOI!!!!!! 

b5: bóc 1 phần lệch hoặc chức năng feedback ra sửa

\+ nhập prompt: Giả sử bạn là Senior dev 5 năm kinh nghiệm . Dưới góc độ là tôi mún phát triển/sửa (chức năng abc) Hãy đề xuất cách sửa/cách phát triển để tôi prompt cho Cursor làm việc





b6: Sau khi thực hiện xong b5, hãy viết ra 1 doc các API đã thêm , hoặc sửa (Chứa cả request body và response )

th1: src BE chạy ngon -> sẽ có doc API -> nhờ chat viết prompt để fetch API:

Viết prompt đề fetch cái đám api này :



Dán doc vô đây



Vào source FE



CHÚ Ý KO NÊN ĐỂ CURSOR ĐỌC 1 LƯỢT 2 FILE BE VÀ FE



th2: cursor báo lỗi nên push code trước khi kêu AI sửa để phòng trường hợp AI ngu dẫn đến lỗi hàng loạt

===============================



TRƯỜNG HỢP SỬA NGUYÊN 1 LUỒNG



b1: vẫn gửi report cho chat và prompt tôi muốn sửa flow: ( vd tạo cuộc thi) với 

Report :

\+ Các layer kiến trúc trong source code

Khoa đã trả lời chính mình

\+ Các class hiện có

\+ Các tên API

\+ các module

b2: Cần lấy flow gốc nhờ chat viết ra: flow hiện tại để tạo ( vd tạo cuộc thi) Dùng API gì ? Request body và response như thế nào

b3: nhờ chat fix flow với prompt: 

Senior Dev 5 năm

Vui lòng thiết kế lại flow này theo hướng sau :



Ghi cái hướng vào đây



=> từ đó , viêys prompt ra lệnh cho cursor thực thi



=> Nếu chưa có đủ thông tin , vui lòng list ra ít nhất 1 câu hỏi, để tôi gửi thông rin cho bạn



================================

KHI BE VIẾT API TRÊN CURSOR NHỚ BẬT PLAN rồi mới bật agent









================================

FE khi FETCH API THÌ NÊN CÀI MCP DEVTOOLS

CÀI BẰNG CÁCH SEARCH YOUTUBE Youtube : cách connect devtools với cursor

ĐỂ KHI FETCH API CÓ LỖI THÌ ĐỂ CURSOR TỰ ĐỘNG TÌM LỖI DỰA VÀO LOG

=====================================

\- BE SAU KHI LÀM XONG VIỆC THÌ PULL CODE LÊN THÌ PHẢI KÈM THEO 1 FILE DOC/REPORT VỀ API MỚI

\- FE LẤY CODE ĐỂ CHẠY FETCH API, KHI MÀ CÓ LỖI HOẶC THIẾU 1 VÀI FIELD THÌ LIÊN HỆ BE ĐỂ BỔ SUNG HOẶC VÁ LỖI

\- NÊN BẮT CẶP 1 FE VỚI 1 BE ĐỂ KHI CÓ LỖI NHƯ FE LẤY API XONG MÀ TRUYỀN THIẾU FILE THÌ ĐỂ BE BIẾT ĐƯỜNG BỔ XUNG THÊM FIEL HOẶC VÁ LỖI

\- KO NÊN ĐỤNG CHẠM CÁC CHỨC NĂNG GẦN NHAU, DỄ CONFLIC 



























