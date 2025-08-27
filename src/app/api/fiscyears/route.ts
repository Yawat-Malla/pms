import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";

// GET all fiscal years
export async function GET() {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const fiscalYears = await prisma.fiscalYear.findMany({
      orderBy: {
        year: "desc"
      }
    });
    
    return NextResponse.json({ fiscalYears });
    
  } catch (error) {
    console.error("Error fetching fiscal years:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new fiscal year
export async function POST(request: Request) {
  try {
    await ensureDbExists();
    
    const body = await request.json();
    const { year, isActive } = body;
    
    // Validation
    if (!year || typeof year !== 'string') {
      return NextResponse.json(
        { error: "Year is required and must be a string" },
        { status: 400 }
      );
    }
    
    // Check if fiscal year already exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: { year }
    });
    
    if (existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year already exists" },
        { status: 400 }
      );
    }
    
    // If this fiscal year is set as active, deactivate all others
    if (isActive) {
      await prisma.fiscalYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }
    
    // Create the fiscal year
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        year,
        isActive: isActive || false
      }
    });
    
    return NextResponse.json({ fiscalYear }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating fiscal year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a fiscal year
export async function PUT(request: Request) {
  try {
    await ensureDbExists();
    
    const body = await request.json();
    const { id, year, isActive } = body;
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "Fiscal year ID is required" },
        { status: 400 }
      );
    }
    
    // Check if fiscal year exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: { id }
    });
    
    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year not found" },
        { status: 404 }
      );
    }
    
    // If this fiscal year is set as active, deactivate all others
    if (isActive) {
      await prisma.fiscalYear.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }
    
    // Update the fiscal year
    const updatedFiscalYear = await prisma.fiscalYear.update({
      where: { id },
      data: {
        year: year || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });
    
    return NextResponse.json({ fiscalYear: updatedFiscalYear });
    
  } catch (error) {
    console.error("Error updating fiscal year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a fiscal year
export async function DELETE(request: Request) {
  try {
    await ensureDbExists();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Fiscal year ID is required" },
        { status: 400 }
      );
    }
    
    // Check if fiscal year exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: { id },
      include: { programs: { select: { id: true } } }
    });
    
    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year not found" },
        { status: 404 }
      );
    }
    
    // Check if fiscal year is in use
    if (existingFiscalYear.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete fiscal year that is in use by programs" },
        { status: 400 }
      );
    }
    
    // Delete the fiscal year
    await prisma.fiscalYear.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting fiscal year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}