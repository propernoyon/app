import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_UPLOAD_BYTES,
  formatByteLimit,
  isAcceptedImageType,
} from "@/lib/images/limits";

describe("upload limits", () => {
  it("accepts the image types sharp can decode", () => {
    expect(isAcceptedImageType("image/jpeg")).toBe(true);
    expect(isAcceptedImageType("image/png")).toBe(true);
    expect(isAcceptedImageType("image/webp")).toBe(true);
    expect(isAcceptedImageType("image/avif")).toBe(true);
  });

  it("rejects anything else, including a renamed executable", () => {
    expect(isAcceptedImageType("application/octet-stream")).toBe(false);
    expect(isAcceptedImageType("text/html")).toBe(false);
    expect(isAcceptedImageType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageType("")).toBe(false);
  });

  it("describes the limit in whole or one-decimal MB", () => {
    expect(formatByteLimit(DEFAULT_MAX_UPLOAD_BYTES)).toBe("5 MB");
    expect(formatByteLimit(1_572_864)).toBe("1.5 MB");
  });
});
