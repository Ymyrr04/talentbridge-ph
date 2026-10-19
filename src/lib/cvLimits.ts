export const CV_MAX_BYTES = 5 * 1024 * 1024;

export function assertCvSize(bytes: number) {
  if (bytes > CV_MAX_BYTES) throw new Error("CV must be 5 MB or smaller.");
}