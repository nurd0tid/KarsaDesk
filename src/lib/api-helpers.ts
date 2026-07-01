import type { NocoDBListResponse } from '@/types';

export const EMPTY_LIST_RESPONSE = <T>(): NocoDBListResponse<T> => ({
  list: [],
  pageInfo: {
    totalRows: 0,
    page: 1,
    pageSize: 25,
    isFirstPage: true,
    isLastPage: true,
  },
});

export function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const status = (error as Error & { status?: number }).status;
    return (
      error.message.includes('404') ||
      error.message.includes('not found') ||
      error.message.includes('Table') ||
      error.message.includes('table') ||
      status === 404
    );
  }
  return false;
}
