'use strict';

function parsePagination(query = {},
    { defaultLimit = 10, maxLimit = 100 } = {}) {
        const page = Math.max(1, parseInt(query.page, 10) || 1);
        const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
        return { page, limit, skip: (page - 1) * limit };
    }

    function paginationMeta(total, page, limit) {
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }

    module.exports = {
        parsePagination,
        paginationMeta
    };