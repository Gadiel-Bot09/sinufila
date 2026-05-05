import { NextResponse } from 'next/server';
import { getMinioClient, MINIO_BUCKET } from '@/lib/minio';

export async function GET() {
  const results: Record<string, any> = {
    env: {
      endpoint:   process.env.MINIO_ENDPOINT,
      port:       process.env.MINIO_PORT,
      useSSL:     process.env.MINIO_USE_SSL,
      bucket:     process.env.MINIO_BUCKET,
      publicBase: process.env.MINIO_PUBLIC_BASE_URL,
      hasKey:     !!process.env.MINIO_ACCESS_KEY,
    },
  };

  try {
    const client = getMinioClient();
    results.clientCreated = true;

    // Test: bucket exists
    const exists = await client.bucketExists(MINIO_BUCKET);
    results.bucketExists = exists;

    // Test: upload tiny text file
    const testKey  = `_test/ping-${Date.now()}.txt`;
    const testData = Buffer.from('sinufila-ping');
    await client.putObject(MINIO_BUCKET, testKey, testData, testData.length, { 'Content-Type': 'text/plain' });
    results.uploadTest = 'OK';
    results.testKey    = testKey;

    // Test: remove it
    await client.removeObject(MINIO_BUCKET, testKey);
    results.cleanupTest = 'OK';

  } catch (err: any) {
    results.error        = err?.message || String(err);
    results.errorCode    = err?.code;
    results.errorStack   = err?.stack?.split('\n').slice(0, 5).join('\n');
  }

  return NextResponse.json(results, { status: 200 });
}
