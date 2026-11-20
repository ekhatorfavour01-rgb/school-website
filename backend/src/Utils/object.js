'use strict';

const isPlainObject = (value) => 
    value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

function compact(object) {
    const result = {};
    Object.entries(object || {}).forEach(([key, value]) => {
        if (value !== undefined) result[key] = value;
    });
    return result;
}

function flatten(object, prefix = '') {
    const result = {};
    Object.entries(object || {}).forEach(([key, value]) => {
        if (value === undefined) return;
        const path = prefix ? `${prefix}.${key}` : key;

        if (isPlainObject(value)) Object.assign(result, flatten(value, path));
        else result[path] = value;
    });
    return result;
}

function pick(object, keys) {
    const result = {};
    keys.forEach((key) => {
        if (object && object[key] !== undefined) result[key] = object[key];
    });

    return result;
}

module.exports = { compact, flatten, pick, isPlainObject };