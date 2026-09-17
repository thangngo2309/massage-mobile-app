export const getApiErrorMessage = (error: any, fallback = 'Đã xảy ra lỗi.') => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join('\n');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
