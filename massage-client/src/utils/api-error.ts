import axios from 'axios';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
};

const normalizeMessages = (payload?: ApiErrorPayload): string[] => {
  if (!payload) return [];

  if (Array.isArray(payload.message)) {
    return payload.message.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return [payload.message.trim()];
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return [payload.error.trim()];
  }

  return [];
};

const getFriendlyValidationMessage = (messages: string[]): string | null => {
  if (!messages.length) {
    return null;
  }

  const joined = messages.join(' | ').toLowerCase();

  if (
    joined.includes('serviceid must not be less than 1') ||
    joined.includes('serviceid must be an integer') ||
    joined.includes('serviceid should not be empty')
  ) {
    return 'Dịch vụ không hợp lệ. Vui lòng quay lại chọn dịch vụ rồi thử tìm kỹ thuật viên lại.';
  }

  if (
    joined.includes('property serviceoptionid should not exist') ||
    joined.includes('property date should not exist') ||
    joined.includes('property starttime should not exist')
  ) {
    return 'Thông tin tìm kiếm trên ứng dụng chưa khớp với phiên bản máy chủ hiện tại. Vui lòng tải lại màn hình và thử lại.';
  }

  if (joined.includes('latitude') || joined.includes('longitude')) {
    return 'Vị trí tìm kiếm không hợp lệ. Vui lòng lấy lại vị trí hiện tại hoặc chọn khu vực khác.';
  }

  if (joined.includes('districtcode') || joined.includes('provincecode')) {
    return 'Khu vực tìm kiếm không hợp lệ. Vui lòng kiểm tra lại quận, huyện hoặc dùng vị trí hiện tại.';
  }

  if (joined.includes('sortby')) {
    return 'Kiểu sắp xếp không hợp lệ. Vui lòng chọn lại cách sắp xếp.';
  }

  if (joined.includes('date must be')) {
    return 'Ngày phục vụ không hợp lệ. Vui lòng chọn lại ngày.';
  }

  if (joined.includes('starttime must be')) {
    return 'Giờ phục vụ không hợp lệ. Vui lòng chọn lại giờ.';
  }

  if (joined.includes('service option not found')) {
    return 'Liệu trình đã chọn không còn khả dụng. Vui lòng chọn lại liệu trình.';
  }

  if (joined.includes('service not found')) {
    return 'Dịch vụ đã chọn không còn khả dụng. Vui lòng chọn lại dịch vụ.';
  }

  return null;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.',
): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    const payload = error.response?.data as ApiErrorPayload | undefined;

    const messages = normalizeMessages(payload);

    const friendlyValidationMessage = getFriendlyValidationMessage(messages);

    if (friendlyValidationMessage) {
      return friendlyValidationMessage;
    }

    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
    }

    if (status === 400) {
      /**
       * ValidationPipe thường trả message[]
       * chứa text kỹ thuật tiếng Anh.
       *
       * Không đưa thẳng nội dung này cho user.
       */
      if (Array.isArray(payload?.message)) {
        return 'Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại lựa chọn và thử lại.';
      }

      return messages[0] || 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại và thử lại.';
    }

    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn hoặc thông tin đăng nhập không hợp lệ. Vui lòng đăng nhập lại.';
    }

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }

    if (status === 404) {
      return messages[0] || 'Không tìm thấy dữ liệu yêu cầu. Vui lòng tải lại và thử lại.';
    }

    if (status === 409) {
      return messages[0] || 'Dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.';
    }

    if (status === 422) {
      return messages[0] || 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
    }

    if (status === 429) {
      return 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.';
    }

    if (status && status >= 500) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }

    if (messages.length > 0) {
      return messages[0];
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
