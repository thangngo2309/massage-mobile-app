import axios from 'axios';

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Có lỗi xảy ra. Vui lòng thử lại.',
): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data as
    | {
        message?: string | string[];
        error?: string;
      }
    | undefined;

  if (Array.isArray(data?.message)) {
    return data.message.join('\n');
  }

  return data?.message || data?.error || error.message || fallback;
};
