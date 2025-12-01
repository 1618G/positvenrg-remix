import { getEnv } from "./env.server";
import logger from "./logger.server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export type StorageProvider = "local" | "cloudinary" | "s3";

export interface UploadResult {
  url: string;
  publicId?: string; // For Cloudinary
  key?: string; // For S3
  path: string; // Relative path for database storage
}

export interface StorageConfig {
  provider: StorageProvider;
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  local?: {
    basePath: string;
  };
}

/**
 * Get storage configuration from environment variables
 */
function getStorageConfig(): StorageConfig {
  const provider = (getEnv("STORAGE_PROVIDER", "local") as StorageProvider) || "local";

  const config: StorageConfig = { provider };

  if (provider === "cloudinary") {
    config.cloudinary = {
      cloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
      apiKey: getEnv("CLOUDINARY_API_KEY", ""),
      apiSecret: getEnv("CLOUDINARY_API_SECRET", ""),
      folder: getEnv("CLOUDINARY_FOLDER", "positvenrg"),
    };

    // Initialize Cloudinary
    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
      });
    }
  } else if (provider === "s3") {
    config.s3 = {
      bucket: getEnv("S3_BUCKET", ""),
      region: getEnv("S3_REGION", "us-east-1"),
      accessKeyId: getEnv("S3_ACCESS_KEY_ID", ""),
      secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", ""),
    };
  } else {
    // Local storage
    config.local = {
      basePath: getEnv("STORAGE_LOCAL_PATH", "public/uploads"),
    };
  }

  return config;
}

/**
 * Upload a file buffer to storage
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string = "uploads",
  options?: {
    resourceType?: "image" | "raw" | "video" | "auto";
    publicId?: string;
  }
): Promise<UploadResult> {
  const config = getStorageConfig();
  const { resourceType = "raw", publicId } = options || {};

  try {
    switch (config.provider) {
      case "cloudinary":
        return await uploadToCloudinary(buffer, filename, folder, { resourceType, publicId });
      
      case "s3":
        return await uploadToS3(buffer, filename, folder, config.s3!);
      
      case "local":
      default:
        return await uploadToLocal(buffer, filename, folder, config.local!);
    }
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", filename, provider: config.provider },
      "File upload failed"
    );
    throw error;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(pathOrPublicId: string): Promise<boolean> {
  const config = getStorageConfig();

  try {
    switch (config.provider) {
      case "cloudinary":
        return await deleteFromCloudinary(pathOrPublicId);
      
      case "s3":
        return await deleteFromS3(pathOrPublicId, config.s3!);
      
      case "local":
      default:
        return await deleteFromLocal(pathOrPublicId);
    }
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error", path: pathOrPublicId, provider: config.provider },
      "File deletion failed"
    );
    return false;
  }
}

/**
 * Get public URL for a file
 */
export function getFileUrl(pathOrPublicId: string): string {
  const config = getStorageConfig();
  const baseUrl = getEnv("BASE_URL", "http://localhost:8780");

  switch (config.provider) {
    case "cloudinary":
      // Cloudinary public ID is the path
      return cloudinary.url(pathOrPublicId, { secure: true });
    
    case "s3":
      // S3 URL format: https://bucket.s3.region.amazonaws.com/key
      const { bucket, region } = config.s3!;
      return `https://${bucket}.s3.${region}.amazonaws.com/${pathOrPublicId}`;
    
    case "local":
    default:
      // Local file URL
      return `${baseUrl}/${pathOrPublicId}`;
  }
}

// Cloudinary implementation
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string,
  options: { resourceType: string; publicId?: string }
): Promise<UploadResult> {
  const config = getStorageConfig();
  const cloudinaryFolder = config.cloudinary?.folder || "positvenrg";
  const fullPath = `${cloudinaryFolder}/${folder}/${filename}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType as "raw" | "image" | "video" | "auto",
        public_id: options.publicId || fullPath.replace(/\.[^/.]+$/, ""), // Remove extension for public_id
        folder: `${cloudinaryFolder}/${folder}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Upload failed - no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          path: result.public_id,
        });
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error", publicId }, "Cloudinary delete failed");
    return false;
  }
}

// S3 implementation (placeholder - requires @aws-sdk/client-s3)
async function uploadToS3(
  buffer: Buffer,
  filename: string,
  folder: string,
  s3Config: NonNullable<StorageConfig["s3"]>
): Promise<UploadResult> {
  // S3 implementation would go here
  // For now, throw error to indicate S3 is not yet implemented
  throw new Error("S3 storage not yet implemented. Please use 'local' or 'cloudinary' provider.");
}

async function deleteFromS3(key: string, s3Config: NonNullable<StorageConfig["s3"]>): Promise<boolean> {
  // S3 delete implementation would go here
  throw new Error("S3 storage not yet implemented.");
}

// Local filesystem implementation
async function uploadToLocal(
  buffer: Buffer,
  filename: string,
  folder: string,
  localConfig: NonNullable<StorageConfig["local"]>
): Promise<UploadResult> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  const uploadDir = path.join(process.cwd(), localConfig.basePath, folder);
  const filePath = path.join(uploadDir, filename);

  // Ensure upload directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Save file
  await fs.writeFile(filePath, buffer);

  // Return relative path for database storage
  const relativePath = `${localConfig.basePath}/${folder}/${filename}`.replace(/^public\//, "");
  
  return {
    url: `/${relativePath}`,
    path: relativePath,
  };
}

async function deleteFromLocal(filePath: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    
    // If path is relative, make it absolute
    const absolutePath = filePath.startsWith("/")
      ? path.join(process.cwd(), "public", filePath)
      : path.join(process.cwd(), "public", filePath);
    
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    // File might not exist - that's okay
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
    logger.error({ error: error instanceof Error ? error.message : "Unknown error", filePath }, "Local file delete failed");
    return false;
  }
}

