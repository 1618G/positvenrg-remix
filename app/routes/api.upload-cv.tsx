import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { verifyUserSession } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import crypto from "crypto";
import logger from "~/lib/logger.server";
import { APP_CONFIG } from "~/lib/config.server";
import { uploadFile, deleteFile } from "~/lib/storage.server";
// Note: pdf-parse and mammoth are imported dynamically in the action function

const MAX_FILE_SIZE = APP_CONFIG.maxFileSize;
const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

// Handle DELETE for CV removal
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const deleteId = url.searchParams.get("delete");
  
  if (!deleteId) {
    return json({ error: "No document ID provided" }, { status: 400 });
  }

  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Invalid session" }, { status: 401 });
  }

  // Delete the document
  try {
    const document = await db.userDocument.findUnique({
      where: { id: deleteId },
    });

    if (!document || document.userId !== session.userId) {
      return json({ error: "Document not found" }, { status: 404 });
    }

    // Delete file from storage (cloud or local)
    try {
      await deleteFile(document.filePath);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error', filePath: document.filePath }, 'Error deleting file');
      // Continue with database deletion even if file deletion fails
    }

    await db.userDocument.delete({
      where: { id: deleteId },
    });

    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message || "Failed to delete CV" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Verify authentication
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader
    ?.split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];
  
  if (!token) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyUserSession(token);
  if (!session) {
    return json({ error: "Invalid session" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }

  // Get Jobe companion
  const jobe = await db.companion.findUnique({ where: { name: "Jobe" } });
  if (!jobe) {
    return json({ error: "Jobe companion not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("cv") as File;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ 
        error: "Invalid file type. Please upload a PDF, DOC, or DOCX file." 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Determine file extension
    const originalName = file.name;
    const fileExt = originalName.split(".").pop()?.toLowerCase();
    const fileType = fileExt === "pdf" ? "pdf" : fileExt === "doc" ? "doc" : "docx";

    // Generate unique filename
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const filename = `${uniqueId}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to cloud storage (or local fallback)
    const uploadResult = await uploadFile(buffer, filename, "cvs", {
      resourceType: "raw",
    });

    // Extract text content
    let extractedText = "";
    let metadata = {};

    try {
      if (fileType === "pdf") {
        // Dynamic import for pdf-parse (CommonJS module, no default export)
        const pdfParseModule = await import("pdf-parse");
        // pdf-parse exports directly, not as default
        const pdfData = await (pdfParseModule.default || pdfParseModule)(buffer);
        extractedText = pdfData.text;
        metadata = {
          pages: pdfData.numpages,
          info: pdfData.info,
        };
      } else if (fileType === "docx") {
        // Dynamic import for mammoth (CommonJS module with default export)
        const mammothModule = await import("mammoth");
        const mammoth = mammothModule.default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        metadata = {
          messages: result.messages,
        };
      } else if (fileType === "doc") {
        // DOC files are harder to parse - for now, store without extraction
        extractedText = "DOC file - text extraction not supported";
        metadata = { note: "DOC format - manual review recommended" };
      }
    } catch (extractError) {
      logger.error({ error: extractError instanceof Error ? extractError.message : 'Unknown error', userId, filename }, 'Error extracting text from CV');
      // Continue even if extraction fails
    }

    // Extract keywords from text (simple extraction)
    const keywords = extractKeywords(extractedText);

    // Store in database
    const document = await db.userDocument.create({
      data: {
        userId: user.id,
        companionId: jobe.id,
        filename,
        originalName,
        fileType,
        fileSize: file.size,
        filePath: uploadResult.path, // Use path from storage service
        metadata: {
          extractedText,
          keywords,
          storageUrl: uploadResult.url, // Store full URL for cloud storage
          ...metadata,
        },
      },
    });

    return json({
      success: true,
      document: {
        id: document.id,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.createdAt,
      },
    });
  } catch (error: any) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', userId }, 'CV upload error');
    return json(
      { error: error.message || "Failed to upload CV" },
      { status: 500 }
    );
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - can be enhanced
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Common resume keywords
  const resumeKeywords = [
    "experience", "skills", "education", "certification", "degree",
    "project", "management", "leadership", "developed", "implemented",
    "achieved", "improved", "collaborated", "managed", "created"
  ];

  const foundKeywords = words.filter(word => 
    resumeKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))
  );

  // Get unique keywords, limited to top 20
  return [...new Set(foundKeywords)].slice(0, 20);
}
