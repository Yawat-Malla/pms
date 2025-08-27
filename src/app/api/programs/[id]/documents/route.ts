import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for document upload
const uploadDocumentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size is required"),
  category: z.enum(["red_book", "executive_approval", "estimation", "monitoring", "contract", "payment", "other"]),
  uploadedById: z.string().optional() // TODO: Get from session when auth is implemented
});

// GET - Fetch documents for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { programId };
    if (category) {
      whereClause.category = category;
    }

    // Fetch documents
    const documents = await prisma.programDocument.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform for frontend
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      formattedFileSize: formatFileSize(doc.fileSize),
      category: doc.category,
      categoryLabel: getCategoryLabel(doc.category),
      uploadedBy: doc.uploadedBy?.name || "System",
      uploadedAt: doc.createdAt.toISOString(),
      downloadUrl: `/api/programs/${programId}/documents/${doc.id}/download`
    }));

    return NextResponse.json({ 
      documents: transformedDocuments,
      programId: programId
    });

  } catch (error) {
    console.error("Error fetching program documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Upload a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = uploadDocumentSchema.parse(body);

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Create document record
    const document = await prisma.programDocument.create({
      data: {
        programId: programId,
        fileName: validatedData.fileName,
        filePath: validatedData.filePath,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
        category: validatedData.category,
        uploadedById: validatedData.uploadedById || "system" // TODO: Get from session
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "document_uploaded",
        description: `Document "${validatedData.fileName}" uploaded for program ${program.name}`,
        entityType: "document",
        entityId: document.id,
        userId: validatedData.uploadedById,
        metadata: {
          programId: programId,
          fileName: validatedData.fileName,
          category: validatedData.category,
          fileSize: validatedData.fileSize
        }
      }
    });

    // Check if this upload triggers any approval workflows
    if (validatedData.category === "red_book" || validatedData.category === "executive_approval") {
      // Create initial approval step
      await prisma.programApproval.create({
        data: {
          programId: programId,
          step: "ward_secretary",
          status: "pending"
        }
      });

      // Create notification for ward secretary
      await prisma.notification.create({
        data: {
          title: "New Document Requires Approval",
          message: `Document "${validatedData.fileName}" has been uploaded for program ${program.name} and requires your approval.`,
          type: "approval",
          priority: "medium",
          entityType: "program",
          entityId: programId
        }
      });
    }

    return NextResponse.json(
      { 
        message: "Document uploaded successfully",
        document: {
          id: document.id,
          fileName: document.fileName,
          filePath: document.filePath,
          fileType: document.fileType,
          fileSize: document.fileSize,
          formattedFileSize: formatFileSize(document.fileSize),
          category: document.category,
          categoryLabel: getCategoryLabel(document.category),
          uploadedBy: document.uploadedBy?.name || "System",
          uploadedAt: document.createdAt.toISOString(),
          downloadUrl: `/api/programs/${programId}/documents/${document.id}/download`
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error uploading document:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbExists();

    const { id: programId } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verify document exists and belongs to the program
    const document = await prisma.programDocument.findFirst({
      where: {
        id: documentId,
        programId: programId
      },
      include: {
        program: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete the document
    await prisma.programDocument.delete({
      where: { id: documentId }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "document_deleted",
        description: `Document "${document.fileName}" deleted from program ${document.program.name}`,
        entityType: "document",
        entityId: documentId,
        metadata: {
          programId: programId,
          fileName: document.fileName,
          category: document.category
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "red_book": return "Red Book";
    case "executive_approval": return "Executive Approval";
    case "estimation": return "Cost Estimation";
    case "monitoring": return "Monitoring Report";
    case "contract": return "Contract Document";
    case "payment": return "Payment Document";
    case "other": return "Other";
    default: return category;
  }
}
