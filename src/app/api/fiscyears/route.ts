import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import { z } from "zod";

const createFiscalYearSchema = z.object({
  year: z.string().min(1, "Year is required"),
  isActive: z.boolean().default(false)
});

const updateFiscalYearSchema = z.object({
  id: z.string().min(1, "ID is required"),
  year: z.string().optional(),
  isActive: z.boolean().optional()
});

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
    const validatedData = createFiscalYearSchema.parse(body);

    // Check if fiscal year already exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: { year: validatedData.year }
    });

    if (existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year already exists" },
        { status: 400 }
      );
    }

    // If setting as active, deactivate all other fiscal years
    if (validatedData.isActive) {
      await prisma.fiscalYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    // Create the fiscal year
    const fiscalYear = await prisma.fiscalYear.create({
      data: validatedData
    });

    return NextResponse.json({ fiscalYear }, { status: 201 });

  } catch (error) {
    console.error("Error creating fiscal year:", error);

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

// PUT - Update a fiscal year
export async function PUT(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = updateFiscalYearSchema.parse(body);

    // Check if fiscal year exists
    const existingFiscalYear = await prisma.fiscalYear.findUnique({
      where: { id: validatedData.id }
    });

    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year not found" },
        { status: 404 }
      );
    }

    // If setting as active, deactivate all other fiscal years
    if (validatedData.isActive) {
      await prisma.fiscalYear.updateMany({
        where: {
          isActive: true,
          id: { not: validatedData.id }
        },
        data: { isActive: false }
      });
    }

    // Update the fiscal year
    const updatedFiscalYear = await prisma.fiscalYear.update({
      where: { id: validatedData.id },
      data: {
        year: validatedData.year,
        isActive: validatedData.isActive
      }
    });

    return NextResponse.json({ fiscalYear: updatedFiscalYear });

  } catch (error) {
    console.error("Error updating fiscal year:", error);

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

// DELETE - Delete a fiscal year
export async function DELETE(request: NextRequest) {
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
      include: {
        programs: true
      }
    });

    if (!existingFiscalYear) {
      return NextResponse.json(
        { error: "Fiscal year not found" },
        { status: 404 }
      );
    }

    // Check if fiscal year has associated programs
    if (existingFiscalYear.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete fiscal year with associated programs" },
        { status: 400 }
      );
    }

    // Delete the fiscal year
    await prisma.fiscalYear.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Fiscal year deleted successfully" });

  } catch (error) {
    console.error("Error deleting fiscal year:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}