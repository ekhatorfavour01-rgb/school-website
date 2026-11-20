'use strict';

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

function generatePaymentReference(date = new Date()) {
    const day = date.toISOString().slice(0, 10).replace(/-/g, '');
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i += 1) code += ALPHABET[bytes[1] % ALPHABET.length];
    return `PAY-${day}-${code}`;
}

const PAYMENT_REFERENCE_PATTERN = /^PAY-\d{8}-[A-Z2-9]{6}$/;

module.exports = {
    generatePaymentReference,
    PAYMENT_REFERENCE_PATTERN
};