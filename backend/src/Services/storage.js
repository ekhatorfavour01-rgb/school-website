'use strict';

/**
 * File storage in one place. The rest of the app never cares WHERE a file lives.
 *
 *   saveFile(file, { folder })   -> asset   (upload a file, get back its address)
 *   deleteAsset(asset)                      (remove the file again)
 *
 * Two drivers, chosen with STORAGE_DRIVER in .env:
 *   local       saves into the uploads/ folder (good for development)
 *   cloudinary  saves to Cloudinary (good for production, files survive redeploys)
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../Config/env');
const logger = require('../Utils/logger');
const { extensionFor } = require('../Utils/fileSignature');

let cloudinaryClient = null;

function getCloudinary() {
  if (!cloudinaryClient) {
    // eslint-disable-next-line global-require
    cloudinaryClient = require('cloudinary').v2;
    cloudinaryClient.config({
      cloud_name: config.storage.cloudinary.cloudName,
      api_key: config.storage.cloudinary.apiKey,
      api_secret: config.storage.cloudinary.apiSecret,
      secure: true,
    });
  }
  return cloudinaryClient;
}

const randomName = () => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

/** Keeps the original file name for display only. It is never used as a path. */
function cleanOriginalName(name) {
  return String(name || '')
    .replace(/[\\/]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .slice(0, 120);
}

function safeFolder(folder) {
  const cleaned = String(folder || 'misc').replace(/[^a-z0-9/_-]/gi, '').replace(/\.\.+/g, '');
  return cleaned || 'misc';
}

async function saveLocal(file, folder) {
  const folderPath = path.join(config.storage.localDir, folder);
  await fs.promises.mkdir(folderPath, { recursive: true });
  const fileName = `${randomName()}.${extensionFor(file.detectedType)}`;
  await fs.promises.writeFile(path.join(folderPath, fileName), file.buffer);
  const publicId = `${folder}/${fileName}`;
  return {
    provider: 'local',
    url: `${config.publicUrl}/uploads/${publicId}`,
    publicId,
    resourceType: file.detectedType === 'pdf' ? 'raw' : 'image',
  };
}

function saveCloudinary(file, folder) {
  const cloudinary = getCloudinary();
  const isPdf = file.detectedType === 'pdf';
  const options = {
    folder: `${config.storage.cloudinary.folder}/${folder}`,
    resource_type: isPdf ? 'raw' : 'image',
    overwrite: false,
  };
  // Raw files keep their name as-is, so give PDFs a ".pdf" ending.
  if (isPdf) options.public_id = `${randomName()}.pdf`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve({
        provider: 'cloudinary',
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: isPdf ? 'raw' : 'image',
      });
    });
    stream.end(file.buffer);
  });
}

/**
 * @param {{buffer: Buffer, detectedType: string, originalname?: string, size?: number}} file a multer file
 * @param {{folder?: string}} [options]
 */
async function saveFile(file, { folder = 'misc' } = {}) {
  if (!file || !Buffer.isBuffer(file.buffer)) throw new Error('saveFile needs an uploaded file');
  const target = safeFolder(folder);
  const stored =
    config.storage.driver === 'cloudinary' ? await saveCloudinary(file, target) : await saveLocal(file, target);
  return {
    ...stored,
    size: file.size || file.buffer.length,
    format: file.detectedType,
    originalName: cleanOriginalName(file.originalname),
  };
}

/** Saves several files. If one fails, the ones already saved are removed again. */
async function saveFiles(files, options) {
  const saved = [];
  try {
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      saved.push(await saveFile(file, options));
    }
    return saved;
  } catch (error) {
    await deleteAssets(saved);
    throw error;
  }
}

/** Never throws: a file that cannot be deleted must not break the request. */
async function deleteAsset(asset) {
  if (!asset || !asset.publicId) return;
  try {
    if (asset.provider === 'cloudinary') {
      await getCloudinary().uploader.destroy(asset.publicId, {
        resource_type: asset.resourceType || 'image',
        invalidate: true,
      });
      return;
    }
    const root = path.resolve(config.storage.localDir);
    const target = path.resolve(root, asset.publicId);
    if (!target.startsWith(root + path.sep)) {
      logger.warn(`Refused to delete a file outside the uploads folder: ${asset.publicId}`);
      return;
    }
    await fs.promises.unlink(target);
  } catch (error) {
    if (error.code !== 'ENOENT') logger.warn(`Could not delete file ${asset.publicId}: ${error.message}`);
  }
}

async function deleteAssets(assets) {
  await Promise.all((assets || []).map((asset) => deleteAsset(asset)));
}

module.exports = { saveFile, saveFiles, deleteAsset, deleteAssets };