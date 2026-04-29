const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

const endpoint = process.env.BACKBLAZE_ENDPOINT_URL || process.env.B2_ENDPOINT;
const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET_NAME;
const accessKeyId = process.env.BACKBLAZE_ACCESS_KEY || process.env.B2_KEY_ID;
const secretAccessKey = process.env.BACKBLAZE_SECRET_KEY || process.env.B2_APP_KEY;

const assertConfig = () => {
  const missing = [];

  if (!endpoint) missing.push('BACKBLAZE_ENDPOINT_URL');
  if (!bucket) missing.push('BACKBLAZE_BUCKET_NAME');
  if (!accessKeyId) missing.push('BACKBLAZE_ACCESS_KEY');
  if (!secretAccessKey) missing.push('BACKBLAZE_SECRET_KEY');

  if (missing.length > 0) {
    throw new Error(`Backblaze B2 config is missing: ${missing.join(', ')}`);
  }
};

const getRegionFromEndpoint = (value) => {
  if (!value) return 'us-east-1';

  try {
    const hostname = new URL(value).hostname;
    const match = hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/i);
    return match?.[1] || 'us-east-1';
  } catch {
    return 'us-east-1';
  }
};

const s3 = new S3Client({
  endpoint,
  region: process.env.B2_REGION || getRegionFromEndpoint(endpoint),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

const BUCKET = bucket;

const normalizeB2Error = (error) => {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('signature validation failed') || error?.name === 'SignatureDoesNotMatch') {
    const e = new Error('Backblaze auth failed: ACCESS_KEY and SECRET_KEY do not match');
    e.statusCode = 502;
    return e;
  }

  if (message.includes('not entitled')) {
    const e = new Error('Backblaze key has insufficient capabilities for this operation');
    e.statusCode = 502;
    return e;
  }

  if (message.includes('request body was too small')) {
    const e = new Error('Backblaze rejected upload payload; check key permissions and retry');
    e.statusCode = 502;
    return e;
  }

  return error;
};

/**
 * Uploads a file buffer to Backblaze B2.
 * @param {Buffer} buffer  - file contents
 * @param {string} originalName - original file name (used only for extension)
 * @param {string} folder - logical folder prefix, e.g. 'avatars/teachers'
 * @returns {Promise<string>} public URL of the uploaded file
 */
const uploadFile = async (buffer, originalName, folder) => {
  assertConfig();

  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentLength: buffer.length,
        ContentType: getMimeType(ext),
      })
    );
  } catch (error) {
    throw normalizeB2Error(error);
  }

  // B2 public download URL format
  return `${endpoint}/${BUCKET}/${key}`;
};

/**
 * Deletes an object from B2 by its full public URL.
 * Silently ignores missing objects.
 */
const deleteFileByUrl = async (url) => {
  if (!url) return;
  try {
    assertConfig();

    const prefix = `${endpoint}/${BUCKET}/`;
    if (!url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // non-critical — photo may already be gone
  }
};

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const getMimeType = (ext) => MIME_MAP[ext] || 'application/octet-stream';

module.exports = { uploadFile, deleteFileByUrl };
