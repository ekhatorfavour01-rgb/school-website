'use strict';

const LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 100
};

function currentLevel() {
    const name = (process.env.LOG_LEVEL || '').toLowerCase();

    if (LEVELS[name]) return LEVELS[name];
    return process.env.NODE_ENV === 'test' ? LEVELS.silent : LEVELS.info;
}

function write(level, message, meta) {
    if (LEVELS[level] < currentLevel()) return;

    const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;

    const stream = level === 'error' || level === 'warn' ? console.error : console.log;

    if (meta === undefined) stream(line);
    else stream(line, meta);
}

module.exports = {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta)
};