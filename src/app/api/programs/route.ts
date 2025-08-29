import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Validation schema for program creation
const createProgramSchema = z.object({
  code: z.string().min(1, "Program code is required"),
  name: z.string().min(1, "Program name is required"),
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  wardId: z.string().min(1, "Ward is required"),
  budget: z.string().optional(),
  fundingSourceId: z.string().min(1, "Funding source is required"),
  programTypeId: z.string().min(1, "Program type is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  responsibleOfficer: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
  documents: z.array(z.object({
    name: z.string(),
    type: z.string(),
    fileUrl: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
  })).default([]),
});

// Validation schema for program updates
const updateProgramSchema = z.object({
  id: z.string().min(1, "Program ID is required"),
  code: z.string().optional(),
  name: z.string().optional(),
  fiscalYearId: z.string().optional(),
  wardId: z.string().optional(),
  budget: z.string().optional(),
  fundingSourceId: z.string().optional(),
  programTypeId: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  responsibleOfficer: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createProgramSchema.parse(body);
    
    // Check if program code already exists
    const existingProgram = await prisma.program.findUnique({
      where: { code: validatedData.code }
    });
    
    if (existingProgram) {
      return NextResponse.json(
        { error: "Program code already exists" },
        { status: 400 }
      );
    }
    
    // Check if ward exists
    const ward = await prisma.ward.findUnique({
      where: { id: validatedData.wardId }
    });
    
    if (!ward) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 400 }
      );
    }
    
    // Check if fiscal year exists
    const fiscalYear = await prisma.fiscalYear.findUnique({
      where: { id: validatedData.fiscalYearId }
    });
    
    if (!fiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year not found" },
        { status: 400 }
      );
    }
    
    // Check if program type exists
    const programType = await prisma.programType.findUnique({
      where: { id: validatedData.programTypeId }
    });
    
    if (!programType) {
      return NextResponse.json(
        { error: "Program type not found" },
        { status: 400 }
      );
    }
    
    // Check if funding source exists
    const fundingSource = await prisma.fundingSource.findUnique({
      where: { id: validatedData.fundingSourceId }
    });
    
    if (!fundingSource) {
      return NextResponse.json(
        { error: "Funding source not found" },
        { status: 400 }
      );
    }
    
    // Parse budget to decimal if provided
    let budgetDecimal = null;
    if (validatedData.budget) {
      budgetDecimal = parseFloat(validatedData.budget);
      if (isNaN(budgetDecimal)) {
        return NextResponse.json(
          { error: "Invalid budget amount" },
          { status: 400 }
        );
      }
    }
    
    // Parse dates if provided
    let startDate = null;
    let endDate = null;
    
    if (validatedData.startDate) {
      startDate = new Date(validatedData.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date" },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.endDate) {
      endDate = new Date(validatedData.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }
    }
    
    // Create program with documents in a transaction
    const program = await prisma.$transaction(async (tx) => {
      // Create the program
      const newProgram = await tx.program.create({
        data: {
          code: validatedData.code,
          name: validatedData.name,
          fiscalYear: {
            connect: { id: validatedData.fiscalYearId }
          },
          ward: {
            connect: { id: validatedData.wardId }
          },
          budget: budgetDecimal,
          fundingSource: {
            connect: { id: validatedData.fundingSourceId }
          },
          programType: {
            connect: { id: validatedData.programTypeId }
          },
          description: validatedData.description,
          startDate,
          endDate,
          tags: validatedData.tags,
          responsibleOfficer: validatedData.responsibleOfficer,
          status: validatedData.status,
          createdById: session.user.id,
        },
        include: {
          ward: true,
          fiscalYear: true,
          programType: true,
          fundingSource: true,
        }
      });

      // Create documents if provided
      if (validatedData.documents && validatedData.documents.length > 0) {
        await tx.programDocument.createMany({
          data: validatedData.documents.map(doc => ({
            programId: newProgram.id,
            name: doc.name,
            type: doc.type,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            status: "pending",
            uploadedById: session.user.id,
          }))
        });
      }

      // If submitted for approval, create approval record
      if (validatedData.status === "SUBMITTED") {
        await tx.programApproval.create({
          data: {
            programId: newProgram.id,
            step: "planning_officer",
            status: "pending",
            priority: "medium",
            submittedAt: new Date(),
          }
        });
      }

      return newProgram;
    });
    
    return NextResponse.json(
      { 
        message: "Program created successfully", 
        program 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating program:", error);
    
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

export async function GET(request: NextRequest) {
  try {
    // Ensure database exists before querying
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const search = searchParams.get('search');
    const wardId = searchParams.get('wardId');
    const fiscalYearId = searchParams.get('fiscalYearId');
    const status = searchParams.get('status');
    const programTypeId = searchParams.get('programTypeId');
    const fundingSourceId = searchParams.get('fundingSourceId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause for filtering
    const whereClause: Record<string, unknown> = {};

    // Role-based filtering: Only show approved programs to regular users
    // Admins and approvers can see all programs
    const userRole = session.user.role;
    if (userRole !== 'admin' && userRole !== 'approver') {
      // Regular users can only see approved, active, and completed programs
      // Plus their own draft and submitted programs
      whereClause.OR = [
        { status: { in: ['APPROVED', 'ACTIVE', 'COMPLETED'] } },
        { createdById: session.user.id }
      ];
    }

    // Search functionality
    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ward: { code: { contains: search, mode: 'insensitive' } } },
        { ward: { name: { contains: search, mode: 'insensitive' } } }
      ];

      if (whereClause.OR) {
        // Combine role-based filtering with search
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions }
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }

    // Filter by ward
    if (wardId) {
      whereClause.wardId = wardId;
    }

    // Filter by fiscal year
    if (fiscalYearId) {
      whereClause.fiscalYearId = fiscalYearId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by program type
    if (programTypeId) {
      whereClause.programTypeId = programTypeId;
    }

    // Filter by funding source
    if (fundingSourceId) {
      whereClause.fundingSourceId = fundingSourceId;
    }

    // Build order by clause
    const orderByClause: Record<string, unknown> = {};
    if (sortBy === 'name') {
      orderByClause.name = sortOrder;
    } else if (sortBy === 'ward') {
      orderByClause.ward = { code: sortOrder };
    } else if (sortBy === 'budget') {
      orderByClause.budget = sortOrder;
    } else if (sortBy === 'status') {
      orderByClause.status = sortOrder;
    } else {
      orderByClause.createdAt = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch programs with filters and pagination
    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where: whereClause,
        include: {
          ward: true,
          createdBy: true,
          fiscalYear: true,
          programType: true,
          fundingSource: true,
          _count: {
            select: {
              documents: true,
              approvals: true,
              payments: true,
              monitoring: true
            }
          }
        },
        orderBy: orderByClause,
        skip: skip,
        take: limit
      }),
      prisma.program.count({ where: whereClause })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      programs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a program
export async function PUT(request: NextRequest) {
  try {
    await ensureDbExists();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProgramSchema.parse(body);

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: validatedData.id },
      include: { createdBy: true }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this program
    // (either creator or admin - simplified check for now)
    if (existingProgram.createdById !== session.user.id) {
      // TODO: Add proper role-based access control
      // For now, allow all authenticated users to update
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.code) {
      // Check if new code conflicts with existing programs
      const codeConflict = await prisma.program.findFirst({
        where: {
          code: validatedData.code,
          id: { not: validatedData.id }
        }
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: "Program code already exists" },
          { status: 400 }
        );
      }
      updateData.code = validatedData.code;
    }

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.responsibleOfficer !== undefined) updateData.responsibleOfficer = validatedData.responsibleOfficer;
    if (validatedData.tags) updateData.tags = validatedData.tags;
    if (validatedData.status) updateData.status = validatedData.status;

    // Handle budget
    if (validatedData.budget !== undefined) {
      if (validatedData.budget) {
        const budgetDecimal = parseFloat(validatedData.budget);
        if (isNaN(budgetDecimal)) {
          return NextResponse.json(
            { error: "Invalid budget amount" },
            { status: 400 }
          );
        }
        updateData.budget = budgetDecimal;
      } else {
        updateData.budget = null;
      }
    }

    // Handle dates
    if (validatedData.startDate !== undefined) {
      if (validatedData.startDate) {
        const startDate = new Date(validatedData.startDate);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid start date" },
            { status: 400 }
          );
        }
        updateData.startDate = startDate;
      } else {
        updateData.startDate = null;
      }
    }

    if (validatedData.endDate !== undefined) {
      if (validatedData.endDate) {
        const endDate = new Date(validatedData.endDate);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid end date" },
            { status: 400 }
          );
        }
        updateData.endDate = endDate;
      } else {
        updateData.endDate = null;
      }
    }

    // Handle foreign key relationships
    if (validatedData.fiscalYearId) {
      const fiscalYear = await prisma.fiscalYear.findUnique({
        where: { id: validatedData.fiscalYearId }
      });
      if (!fiscalYear) {
        return NextResponse.json(
          { error: "Fiscal year not found" },
          { status: 400 }
        );
      }
      updateData.fiscalYearId = validatedData.fiscalYearId;
    }

    if (validatedData.wardId) {
      const ward = await prisma.ward.findUnique({
        where: { id: validatedData.wardId }
      });
      if (!ward) {
        return NextResponse.json(
          { error: "Ward not found" },
          { status: 400 }
        );
      }
      updateData.wardId = validatedData.wardId;
    }

    if (validatedData.programTypeId) {
      const programType = await prisma.programType.findUnique({
        where: { id: validatedData.programTypeId }
      });
      if (!programType) {
        return NextResponse.json(
          { error: "Program type not found" },
          { status: 400 }
        );
      }
      updateData.programTypeId = validatedData.programTypeId;
    }

    if (validatedData.fundingSourceId) {
      const fundingSource = await prisma.fundingSource.findUnique({
        where: { id: validatedData.fundingSourceId }
      });
      if (!fundingSource) {
        return NextResponse.json(
          { error: "Funding source not found" },
          { status: 400 }
        );
      }
      updateData.fundingSourceId = validatedData.fundingSourceId;
    }

    // Update the program
    const updatedProgram = await prisma.program.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        ward: true,
        fiscalYear: true,
        programType: true,
        fundingSource: true,
        createdBy: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "program_updated",
        description: `Program updated: ${updatedProgram.name} (${updatedProgram.code})`,
        entityType: "program",
        entityId: updatedProgram.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      message: "Program updated successfully",
      program: updatedProgram
    });

  } catch (error) {
    console.error("Error updating program:", error);

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

// DELETE - Delete a program
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
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id },
      include: {
        createdBy: true,
        documents: true,
        approvals: true,
        payments: true,
        monitoring: true
      }
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this program
    if (existingProgram.createdById !== session.user.id) {
      // TODO: Add proper role-based access control
      // For now, allow all authenticated users to delete
    }

    // Check if program has associated data that prevents deletion
    const hasAssociatedData =
      existingProgram.documents.length > 0 ||
      existingProgram.approvals.length > 0 ||
      existingProgram.payments.length > 0 ||
      existingProgram.monitoring.length > 0;

    if (hasAssociatedData) {
      return NextResponse.json(
        { error: "Cannot delete program with associated documents, approvals, payments, or monitoring records" },
        { status: 400 }
      );
    }

    // Only allow deletion of DRAFT programs
    if (existingProgram.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft programs can be deleted" },
        { status: 400 }
      );
    }

    // Delete the program
    await prisma.program.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "program_deleted",
        description: `Program deleted: ${existingProgram.name} (${existingProgram.code})`,
        entityType: "program",
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: "Program deleted successfully" });

  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}