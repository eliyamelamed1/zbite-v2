/** Builds pagination metadata from page, limit, and total count. */
export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
}

/** Parses page and limit from query string with defaults. */
export function parsePaginationQuery(query: { page?: string; limit?: string }, defaultLimit = 12) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
