import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createDocumentSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required")
});

const updateDocumentSchema = z.object({
  id: z.string().min(1, "Document ID is required"),
  name: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional()
});

// GET documents
export async function GET(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    if (programId) {
      whereClause.programId = programId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    // Filter by user's ward if they have one
    if (session.user.wardId && !programId) {
      whereClause.program = {
        wardId: session.user.wardId
      };
    }

    const skip = (page - 1) * limit;

    const [documents, totalCount] = await Promise.all([
      prisma.programDocument.findMany({
        where: whereClause,
        include: {
          program: {
            include: {
              ward: true,
              fiscalYear: true
            }
          },
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
        },
        skip,
        take: limit
      }),
      prisma.programDocument.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Upload a new document
export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDocumentSchema.parse(body);

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
      include: { ward: true }
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to upload documents for this program
    if (program.createdById !== session.user.id && session.user.wardId !== program.wardId) {
      return NextResponse.json(
        { error: "You don't have permission to upload documents for this program" },
        { status: 403 }
      );
    }

    // Create the document record
    const document = await prisma.programDocument.create({
      data: {
        programId: validatedData.programId,
        fileName: validatedData.name,
        filePath: validatedData.fileUrl,
        fileType: validatedData.mimeType || validatedData.type,
        fileSize: validatedData.fileSize,
        category: validatedData.type || 'general',
        uploadedById: session.user.id
      },
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "document_uploaded",
        description: `Document uploaded for program: ${program.name} - ${validatedData.name}`,
        entityType: "document",
        entityId: document.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ document }, { status: 201 });

  } catch (error) {
    console.error("Error creating document:", error);
    
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

// PUT - Update document details or status
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateDocumentSchema.parse(body);

    // Check if document exists
    const existingDocument = await prisma.programDocument.findUnique({
      where: { id: validatedData.id },
      include: {
        program: true
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (existingDocument.uploadedById !== session.user.id) {
      // TODO: Add proper role-based access control for reviewers
    }

    // Update the document
    const updatedDocument = await prisma.programDocument.update({
      where: { id: validatedData.id },
      data: {
        fileName: validatedData.name,
        fileType: validatedData.type,
        category: validatedData.type || 'general'
      },
      include: {
        program: {
          include: {
            ward: true,
            fiscalYear: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "document_updated",
        description: `Document updated: ${updatedDocument.fileName}`,
        entityType: "document",
        entityId: updatedDocument.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      message: "Document updated successfully",
      document: updatedDocument
    });

  } catch (error) {
    console.error("Error updating document:", error);
    
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
export async function DELETE(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if document exists
    const existingDocument = await prisma.programDocument.findUnique({
      where: { id },
      include: {
        program: true
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check permissions - only uploader can delete pending documents
    if (existingDocument.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this document" },
        { status: 403 }
      );
    }

    // Document exists, proceed with deletion

    // Delete the document record
    await prisma.programDocument.delete({
      where: { id }
    });

    // TODO: Delete the actual file from storage
    // This would depend on your file storage solution (AWS S3, local storage, etc.)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "document_deleted",
        description: `Document deleted: ${existingDocument.fileName}`,
        entityType: "document",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Document deleted successfully" });

  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
