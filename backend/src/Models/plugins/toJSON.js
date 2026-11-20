'use strict';

const { transform } = require("zod");

module.exports = function toJSONPlugin(schema) {

    if (schema.get('toJSON')) return;
    schema.set('toJSON', {
        versionKey: false,
        transform(doc, ret) {
            if (ret._id !== undefined) {
                ret._id = String(ret._id);
                delete ret._id;
            }

            delete ret.__v;
            return ret;

        },
    });
};