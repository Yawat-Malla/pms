import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
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
});

export async function POST(request: NextRequest) {
  try {
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
    
    // Create program
    const program = await prisma.program.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        fiscalYear: fiscalYear.year, // Store the year string for backward compatibility
        wardId: validatedData.wardId,
        budget: budgetDecimal,
        fundingSource: fundingSource.code, // Store the code for backward compatibility
        programType: programType.code, // Store the code for backward compatibility
        fiscalYearId: validatedData.fiscalYearId, // Store the relation to fiscal year
        fundingSourceId: validatedData.fundingSourceId, // Store the relation to funding source
        programTypeId: validatedData.programTypeId, // Store the relation to program type
        description: validatedData.description,
        startDate,
        endDate,
        tags: validatedData.tags,
        responsibleOfficer: validatedData.responsibleOfficer,
        status: "DRAFT",
        // TODO: Add createdBy when authentication is implemented
        // createdById: userId,
      },
      include: {
        ward: true,
        fiscalYear: true,
        programType: true,
        fundingSource: true,
      }
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
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const programs = await prisma.program.findMany({
      include: {
        ward: true,
        createdBy: true,
        fiscalYear: true,
        programType: true,
        fundingSource: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json({ programs });
    
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}