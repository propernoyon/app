/**
 * Upload limits shared by the browser and the server.
 *
 * Client-safe on purpose: the admin UI validates for instant feedback, while the
 * server enforces the same rules authoritatively (see `lib/images/process.ts`).
 * The configured limit is passed down from the server so both agree.
 */

export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** MIME types accepted by the uploader. The real check is a magic-byte sniff server-side. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function formatByteLimit(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}
