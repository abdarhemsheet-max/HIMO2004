import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'ca-east-006',
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.B2_BUCKET_NAME!;

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ key: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
  return { key: fileName };
}

export async function downloadFile(
  key: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const body = await res.Body?.transformToByteArray();
    if (!body) return null;
    return {
      buffer: Buffer.from(body),
      mimeType: res.ContentType || 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {}
}
