const parseLimit = (value, fallback = 50, max = 500) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), max);
};

const parsePagination = (query = {}, defaults = { page: 1, limit: 50 }) => {
    const page = Math.max(parseInt(query.page, 10) || defaults.page, 1);
    const limit = parseLimit(query.limit, defaults.limit);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

module.exports = {
    parseLimit,
    parsePagination,
    buildPaginationMeta,
};
