'use strict';

const multer = require('multer');
const config = require('../Config/env');
const ApiError = require('../Utils/ApiError');
const { detectFileType, mimeFor } = require('../Utils/fileSignature');

/** What each kind of upload may contain. */
const KINDS = {
  image: { types: ['jpeg', 'png', 'webp'], label: 'a JPG, PNG or WebP image' },
  document: { types: ['pdf'], label: 'a PDF file' },
  receipt: { types: ['jpeg', 'png', 'webp', 'pdf'], label: 'a photo (JPG, PNG, WebP) or a PDF' },
};

function translateMulterError(error) {
  if (error instanceof ApiError) return error;
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ApiError.payloadTooLarge(`The file is too large. The limit is ${config.uploads.maxMb} MB.`);
    }
    if (error.code === 'LIMIT_FILE_COUNT') return ApiError.badRequest('You uploaded too many files at once.');
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiError.badRequest(`Unexpected file field "${error.field}".`);
    }
    return ApiError.badRequest(error.message);
  }
  return error;
}

/**
 * Builds the two steps every upload needs:
 *   1. multer reads the file into memory (with a size limit)
 *   2. we check the real file type from its first bytes, not from its name
 */
function build(kind, { field, many = false, max = 10, required = false }) {
  const rules = KINDS[kind];
  const allowedMimes = rules.types.map(mimeFor);

  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.uploads.maxBytes,
      files: many ? max : 1,
      fields: 40,
      fieldSize: 100 * 1024,
    },
    fileFilter(req, file, cb) {
      if (allowedMimes.includes(file.mimetype)) return cb(null, true);
      return cb(ApiError.unsupportedMedia(`Please upload ${rules.label}.`));
    },
  });

  const readFiles = many ? uploader.array(field, max) : uploader.single(field);

  const parse = (req, res, next) => {
    readFiles(req, res, (error) => (error ? next(translateMulterError(error)) : next()));
  };

  const verify = (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);

    if (required && files.length === 0) {
      return next(
        ApiError.unprocessable('A file is required', {
          errors: [{ field, message: `Please upload ${rules.label}.` }],
        })
      );
    }

    for (const file of files) {
      const type = detectFileType(file.buffer);
      if (!type || !rules.types.includes(type)) {
        return next(
          ApiError.unsupportedMedia(`"${file.originalname}" is not ${rules.label}.`, {
            errors: [{ field, message: `Please upload ${rules.label}.` }],
          })
        );
      }
      file.detectedType = type; // trusted type, used later to pick the file extension
    }
    return next();
  };

  return [parse, verify];
}

module.exports = {
  /** One image: uploadImage('coverImage') */
  uploadImage: (field, options = {}) => build('image', { field, ...options }),
  /** Several images: uploadImages('images', { max: 10, required: true }) */
  uploadImages: (field, options = {}) => build('image', { field, many: true, ...options }),
  /** One PDF */
  uploadDocument: (field, options = {}) => build('document', { field, ...options }),
  /** One receipt: a photo or a PDF */
  uploadReceipt: (field, options = {}) => build('receipt', { field, ...options }),
};