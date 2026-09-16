import axios from 'axios';

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.',
): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data as any;
    const message = payload?.message;

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Kiểm tra Backend, Dev Tunnel và kết nối mạng.';
    }

    if (status === 404) {
      return 'Không tìm thấy API trên máy chủ (404). Xem log [API][ERR] để kiểm tra URL đang gọi.';
    }

    if (status === 401) {
      return 'Thông tin đăng nhập không hợp lệ hoặc phiên đăng nhập đã hết hạn.';
    }

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (status && status >= 500) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
