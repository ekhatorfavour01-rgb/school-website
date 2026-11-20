'use strict';

function ok(res, data = null, { status = 200, message, meta } = {}) {
    const body = { success: true };
    if (message) body.message = message;
    body.data = data;
    if (meta) body.meta = meta;
    return res.status(status).json(body);
}

function created(res, data = null, message) {
    return ok(res, data, { status: 201, message });
}

module.exports = { ok, created };