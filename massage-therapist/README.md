# Massage In Room - Therapist

Expo/React Native app dành cho kỹ thuật viên, dùng chung Backend của massage-platform.

## Luồng chính

- Đăng ký/đăng nhập với role `therapist`
- Hồ sơ KTV và trạng thái xác minh
- Bật/tắt nhận booking (chỉ bật được khi verified)
- Dịch vụ KTV: xem, đổi giá, active/inactive
- Lịch làm việc nhiều ca/ngày
- Ngày nghỉ / ngoại lệ lịch
- Booking của KTV và cập nhật trạng thái theo flow Backend

## Chạy local

```bash
cp .env.example .env
npm install
npm run typecheck
npx expo start -c
```

Native:

```bash
npx expo run:android
npx expo run:ios
```

> App không cài React Native Firebase ở baseline này để tránh kéo cấu hình Firebase/iOS vào khi notification chưa triển khai.
