// S3_ENDPOINT         :: internal endpoint (e.g. http://minio:9000). Path-style URLs auto-enabled.
// S3_PUBLIC_URL       :: browser-reachable base URL when the endpoint is internal (e.g. behind a reverse proxy).
// S3_FORCE_PATH_STYLE :: set 'true' to force path-style URLs regardless of endpoint presence.

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	S3ServiceException
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'stream';
import type { StorageAdapter } from './adapter.js';
import { env } from '$env/dynamic/private';

function makeClient(endpoint: string | undefined): S3Client {
	return new S3Client({
		region: env.S3_REGION ?? 'eu-west-1',
		endpoint: endpoint || undefined,
		forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true' || !!endpoint,
		credentials: {
			accessKeyId: env.S3_ACCESS_KEY ?? '',
			secretAccessKey: env.S3_SECRET_KEY ?? ''
		}
	});
}

export class S3StorageAdapter implements StorageAdapter {
	private client: S3Client;
	private presignClient: S3Client;
	private bucket: string;

	constructor() {
		this.client = makeClient(env.S3_ENDPOINT);
		this.presignClient = makeClient(env.S3_PUBLIC_URL ?? env.S3_ENDPOINT);
		this.bucket = env.S3_BUCKET ?? 'motomate';
	}

	async put(key: string, body: Buffer | Uint8Array, mime: string): Promise<void> {
		const data = Buffer.isBuffer(body) ? body : Buffer.from(body);
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: data,
				ContentType: mime,
				ContentLength: data.byteLength
			})
		);
	}

	async getStream(key: string): Promise<NodeJS.ReadableStream> {
		const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
		if (!res.Body) throw new Error(`S3 object has no body: ${key}`);
		return res.Body as unknown as Readable;
	}

	async getBuffer(key: string): Promise<Buffer> {
		const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
		if (!res.Body) throw new Error(`S3 object has no body: ${key}`);
		const bytes = await res.Body.transformToByteArray();
		return Buffer.from(bytes);
	}

	async delete(key: string): Promise<void> {
		try {
			await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
		} catch (e) {
			if (e instanceof S3ServiceException && e.$metadata?.httpStatusCode === 404) return;
			throw e;
		}
	}

	async presignedUrl(key: string, expiresInSeconds: number): Promise<string> {
		return getSignedUrl(
			this.presignClient,
			new GetObjectCommand({ Bucket: this.bucket, Key: key }),
			{ expiresIn: expiresInSeconds }
		);
	}
}
