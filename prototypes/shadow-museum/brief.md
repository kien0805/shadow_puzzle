# Game Brief: Shadow Museum

## In your words
t nghĩ ra 1 idea sẽ có 1 bức tranh tổng thể có nhiều vật thể ví dụ như bảo tàng có 5-6 cái tượng chẳng hạn (có thể thay tượng bằng loại khác cũng được nhưng trong 1 bức tranh không được có vật thể giống nhau). Và mỗi vật thể đỏ sẽ không được hiện hình mà chỉ  hiện màn đen, mỗi vật thể sẽ là 1 level cần vượt qua. User cần phải giải câu đố bằng cách ghép đủ các hình khối vào sao cho hoàn thiện hình thì mới có thể qua level và hoàn thành vật thể đó nghĩ thêm thử từ idea này đi
1. Look: nét vẽ thì là tranh muinh hoạ mượt
2. Pieces: khối thì ban đầu là dễ sau đó dần dần tăng độ khó lên, có thể các khối được cắt thành các kiểu hình thù khác
3. Timer: thêm timer cho từng level nữa user phải giải được trong thời gian yêu cầu không sẽ thua và phải bắt đầu lại từ đầu
4. Restart: ý là thua thì sẽ làm lại vật đang chơi thôi chứ không có cần phải chơi lại từ đầu bảo thàng

**Pitch:** Một bảo tàng đầy bóng đen: ghép các khối mang mảnh hình vào từng bóng trước khi hết giờ để vật thể hiện ra, đủ 6 vật thì bảo tàng mở cửa.

**Genre:** puzzle ghép khối vào bóng (scene × block)

**Controls:** chạm bóng đen để mở; kéo khối từ khay vào bóng, đúng chỗ thì hít vào, sai thì bật về; không xoay khối. Phím: Q/E chọn khối, mũi tên di chuyển, Space đặt, H gợi ý *(guessed)*.

**Question:** Một hành động lặp lại (kéo khối có hình vào bóng) cộng đồng hồ đếm ngược có đủ vui để làm hết 6 vật không?

**Hooks:** mỗi khối mang một mảnh hình của vật thể, đặt đúng là mảnh màu hiện ra trên bóng đen; mỗi vật một level có giờ.

**Intent:** staged failure *(you said: thua thì làm lại vật đang chơi)*

## Look and references
- Look: tranh minh họa mượt vẽ bằng vector: sảnh bảo tàng tường kem, cột vòm, sàn ca-rô; 6 vật khác nhau (tượng bán thân, bình gốm, mũ giáp, sọ khủng long, đàn hạc, tượng mèo Ai Cập) có đổ bóng và highlight; vật chưa giải là bóng đen tuyền; vật xong có đèn rọi ấm. Mọi hình đều được vẽ, không emoji, không hình tròn trơn.
- References: Pixel Builder - Picture Puzzle (kéo vật vào bóng đen trong cảnh lớn), Room Sort (khối điền vào lưới).
- View: 2D · Camera: cố định, màn dọc như điện thoại; zoom từ sảnh vào từng vật.

## First minute
Sảnh bảo tàng với 6 bóng đen trên bệ. Chạm bóng số 1 (tượng bán thân) thì zoom vào, đồng hồ 60 giây chạy. Khay có 3 khối to cắt thẳng, mỗi khối mang một dải hình của bức tượng. Kéo khối có cái đầu lên trên: nó hít vào, mảnh màu hiện ra. Đặt nốt 2 khối, bức tượng tỏa sáng, quay về sảnh: bệ số 1 giờ có tượng màu dưới đèn rọi.

## Challenge
Vật 1–2: 3–4 khối to cắt thẳng, 60 giây, gần như không thua. Vật 3–4: 6–8 khối hình L, T, Z nhiều khối na ná nhau, 75 giây. Vật 5–6: 10–12 khối nhỏ hình lạ cộng 1–2 khối mồi không thuộc vật đó, 90 giây. Còn 10 giây thì đồng hồ đỏ và tích tắc. Gợi ý đặt hộ 1 khối nhưng trừ 5 giây. Hết giờ thì thua: khối về khay, chơi lại vật đó; các vật đã xong giữ nguyên.

## Core loop
- Chạm một bóng đen trong sảnh
- Kéo khối có hình vào đúng chỗ trong bóng trước khi hết giờ
- Lấp kín: vật hiện màu, về sảnh; hết giờ: chơi lại vật đó
- Đủ 6 vật: bảo tàng mở cửa

## Goal & fail state
- Thắng: hoàn thành cả 6 vật. Thua một vật khi hết giờ: chỉ chơi lại vật đó.

## Features
- [ ] Sảnh bảo tàng với 6 vật khác nhau, vật chưa xong là bóng đen
- [ ] Màn ghép: kéo khối mang mảnh hình vào bóng, hít vào nếu đúng, bật về nếu sai
- [ ] Độ khó tăng: cắt thẳng → hình L/T/Z → khối nhỏ hình lạ + khối mồi
- [ ] Đồng hồ đếm ngược mỗi vật, cảnh báo 10 giây cuối
- [ ] Thua khi hết giờ, nút Thử lại chơi lại vật đó
- [ ] Gợi ý (trừ giờ)
- [ ] Vật tỏa sáng khi xong; cả 6 xong thì bảo tàng mở cửa, khách vào

## Keep
-

## Avoid
- Xoay khối
- Thua thì mất cả bảo tàng (chỉ chơi lại vật đang chơi)
- Hai vật giống nhau trong một cảnh

## Out of scope
- Cảnh thứ 2, album sưu tập: grow it
- Quảng cáo, mua bán: add it as a feature
- Build lên điện thoại thật: bản này chạy trên trình duyệt, màn dọc
- Tranh minh họa thật: bản này vẽ bằng code

## Build order
1. Lát cắt: sảnh 6 vật, ghép đủ cả 6 có đồng hồ, thua và chơi lại, màn bảo tàng mở cửa.

---
**Kill condition:** nếu sau vật 3 việc kéo khối vẫn thấy lặp nhàm dù có giờ. *(guessed)*

**Who it's for / what they feel:** người chơi casual trên điện thoại, thích cảm giác "ghép xong là hiện hình", có chút hồi hộp vì giờ. *(guessed)*
