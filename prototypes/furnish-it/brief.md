# Game Brief: Furnish It

## In your words
code thửu game idea 2 đi ra html
1. Look: kiểu cozy pastel
2. Feel: chơi thư giãn
3. Rules: luật đơn giản hơn tí chỉ là ghép ảnh vào chỗ trống thôi
4. Challenge: ok nghe độ khó cx ổn

**Pitch:** Kéo các món nội thất hình khối vào sàn căn phòng trống cho vừa khít từng ô, và nhìn căn phòng dần thành tổ ấm.

**Genre:** puzzle xếp khối (packing puzzle), cozy *(inferred (strong))*

**Controls:** kéo thả khối từ khay vào lưới; chạm vào khối trong khay để xoay 90° (từ phòng 3) *(guessed)*; mỗi màn có nút làm lại.

**Question:** Lấp kín căn phòng bằng nội thất, rồi được thưởng một cảnh cozy, có đủ thư giãn và đủ "đã" để chơi hết 6 phòng không?

**Hooks:** mỗi khối là một món đồ thật (giường 2×3, sofa hình L, kệ sách 1×3, bàn 2×2, chậu cây 1×1…); lấp kín phòng thì phòng "sống dậy".

**Intent:** soft or no failure *(you said: thư giãn)*

## Look and references
- Look: phong cách cozy pastel flat-lay. Nhìn từ trên xuống. Sàn gỗ màu kem nhạt, tường hồng đất và xanh mint. Nội thất vẽ bằng shape có bo góc, có chi tiết: gối trên giường, gân trên lá cây, gáy sách trên kệ. Bóng đổ mềm. Chi tiết đặc trưng: giải xong thì đèn bật vàng ấm, có con mèo nằm cuộn tròn và vài hạt bụi nắng bay. Mọi hình đều được vẽ, không dùng emoji, không dùng hình tròn trơn.
- References: A Little to the Left (lấy palette pastel và cảm giác xếp đồ thư giãn), Room Sort (lấy kiểu khối điền vào lưới mặt bằng).
- View: 2D · Camera: top-down cố định, màn dọc như điện thoại.

## First minute
Phòng 1 có lưới 4×4, vài ô trống, khay chỉ có 3 món. Một bàn tay gợi ý kéo chiếc giường vào. Khi khối vừa chỗ, nó "bụp" vào lưới kèm tiếng nhẹ. Khi kéo qua lưới, ô xanh là đặt được, ô đỏ là trùng. Người chơi đặt nốt 2 món, phòng kín ô thì đèn bật ấm, mèo xuất hiện, hiện 3 ngôi sao trang trí. Bấm "Phòng tiếp" để sang màn sau.

## Challenge
Màn 1–2 là dạy chơi. Từ màn 3 bắt đầu được xoay khối. Màn 4–6 có các ô bị chặn (cột, lò sưởi cố định), lưới to hơn và nhiều món hơn, phải thử vài cách mới ra. Không có thua: đặt sai thì kéo khối trả về khay, hoặc bấm làm lại.

## Core loop
- Nhìn chỗ trống, chọn một món trong khay
- Kéo vào lưới. Vừa thì khối đặt xuống, không vừa thì bật về khay
- Phòng kín ô thì xem cảnh cozy, rồi sang phòng mới
- Xong 6 phòng thì xem toàn cảnh căn nhà đã trang trí

## Goal & fail state
- Thắng: lấp kín mọi ô trống của cả 6 phòng. Không có trạng thái thua.

## Features
- [ ] 6 phòng (phòng ngủ, phòng khách, bếp, phòng tắm, phòng làm việc, ban công), mỗi phòng một bộ nội thất riêng
- [ ] Kéo thả có xem trước ô xanh/đỏ, khối hít vào lưới
- [ ] Xoay khối (từ phòng 3)
- [ ] Ô chặn cố định (từ phòng 4)
- [ ] Màn "lên đèn" khi giải xong: đèn ấm, mèo, bụi nắng
- [ ] Nút làm lại và nút gợi ý (đặt hộ 1 món đúng chỗ)
- [ ] Màn kết: toàn cảnh căn nhà

## Keep
-

## Avoid
- Luật ràng buộc phức tạp (cửa, giường sát tường, TV đối diện sofa…): chỉ ghép khối vào chỗ trống
- Áp lực thời gian, giới hạn số bước

## Out of scope
- Bộ sinh màn tự động, decor tùy chỉnh, IAP/quảng cáo, âm thanh thật (chỉ bíp nhẹ bằng code)
- Build lên điện thoại thật: bản này chạy trên trình duyệt, màn dọc

## Build order
1. Lát cắt: 6 phòng chơi trọn vẹn từ phòng 1 đến màn kết, có kéo thả, xoay, làm lại và cảnh thưởng.

---
**Kill condition:** nếu đến phòng 4 vẫn thấy xếp khối nhàm, cảnh thưởng không đủ kéo người chơi đi tiếp. *(guessed)*

**Who it's for / what they feel:** người chơi casual trên điện thoại, muốn 10 phút thư giãn kiểu "dọn đồ cho gọn". *(guessed)*
