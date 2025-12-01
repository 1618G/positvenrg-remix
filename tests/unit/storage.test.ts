import { describe, it, expect, beforeEach, vi } from "vitest";
import { uploadFile, deleteFile, getFileUrl } from "~/lib/storage.server";
import * as fs from "fs/promises";
import * as path from "path";

// Mock dependencies
vi.mock("fs/promises");
vi.mock("path");
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
    url: vi.fn(() => "https://cloudinary.com/image.jpg"),
  },
}));

vi.mock("~/lib/env.server", () => ({
  getEnv: vi.fn((key: string, defaultValue?: string) => {
    if (key === "STORAGE_PROVIDER") return "local";
    if (key === "STORAGE_LOCAL_PATH") return "public/uploads";
    if (key === "BASE_URL") return "http://localhost:8780";
    return defaultValue || "";
  }),
}));

vi.mock("~/lib/logger.server", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Storage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadFile (local)", () => {
    it("should upload file to local storage", async () => {
      const buffer = Buffer.from("test file content");
      const filename = "test-file.pdf";
      const folder = "cvs";

      vi.mocked(path.join).mockReturnValue("public/uploads/cvs/test-file.pdf");
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await uploadFile(buffer, filename, folder);

      expect(result.path).toContain("uploads/cvs/test-file.pdf");
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe("deleteFile (local)", () => {
    it("should delete file from local storage", async () => {
      const filePath = "uploads/cvs/test-file.pdf";

      vi.mocked(path.join).mockReturnValue("public/uploads/cvs/test-file.pdf");
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const result = await deleteFile(filePath);

      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalled();
    });

    it("should handle file not found gracefully", async () => {
      const filePath = "uploads/cvs/non-existent.pdf";
      const error = new Error("ENOENT");
      (error as NodeJS.ErrnoException).code = "ENOENT";

      vi.mocked(path.join).mockReturnValue("public/uploads/cvs/non-existent.pdf");
      vi.mocked(fs.unlink).mockRejectedValue(error);

      const result = await deleteFile(filePath);

      expect(result).toBe(true); // Should return true even if file doesn't exist
    });
  });

  describe("getFileUrl", () => {
    it("should return local file URL", () => {
      const filePath = "uploads/cvs/test-file.pdf";
      const url = getFileUrl(filePath);

      expect(url).toContain("http://localhost:8780");
      expect(url).toContain(filePath);
    });
  });
});


