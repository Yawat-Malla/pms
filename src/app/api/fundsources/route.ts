import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";

// GET all funding sources
export async function GET() {
  try {
    // Ensure database exists before querying
    await ensureDbExists();
    
    const fundingSources = await prisma.fundingSource.findMany({
      orderBy: {
        name: "asc"
      }
    });
    
    return NextResponse.json({ fundingSources });
    
  } catch (error) {
    console.error("Error fetching funding sources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new funding source
export async function POST(request: Request) {
  try {
    await ensureDbExists();
    
    const body = await request.json();
    const { name, code } = body;
    
    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      );
    }
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: "Code is required and must be a string" },
        { status: 400 }
      );
    }
    
    // Check if funding source already exists
    const existingFundingSource = await prisma.fundingSource.findFirst({
      where: {
        OR: [
          { name },
          { code }
        ]
      }
    });
    
    if (existingFundingSource) {
      return NextResponse.json(
        { error: "Funding source with this name or code already exists" },
        { status: 400 }
      );
    }
    
    // Create the funding source
    const fundingSource = await prisma.fundingSource.create({
      data: {
        name,
        code
      }
    });
    
    return NextResponse.json({ fundingSource }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating funding source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a funding source
export async function PUT(request: Request) {
  try {
    await ensureDbExists();
    
    const body = await request.json();
    const { id, name, code } = body;
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "Funding source ID is required" },
        { status: 400 }
      );
    }
    
    // Check if funding source exists
    const existingFundingSource = await prisma.fundingSource.findUnique({
      where: { id }
    });
    
    if (!existingFundingSource) {
      return NextResponse.json(
        { error: "Funding source not found" },
        { status: 404 }
      );
    }
    
    // Check if name or code already exists for another funding source
    if (name || code) {
      const duplicateFundingSource = await prisma.fundingSource.findFirst({
        where: {
          OR: [
            name ? { name } : {},
            code ? { code } : {}
          ],
          id: { not: id }
        }
      });
      
      if (duplicateFundingSource) {
        return NextResponse.json(
          { error: "Another funding source with this name or code already exists" },
          { status: 400 }
        );
      }
    }
    
    // Update the funding source
    const updatedFundingSource = await prisma.fundingSource.update({
      where: { id },
      data: {
        name: name || undefined,
        code: code || undefined
      }
    });
    
    return NextResponse.json({ fundingSource: updatedFundingSource });
    
  } catch (error) {
    console.error("Error updating funding source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a funding source
export async function DELETE(request: Request) {
  try {
    await ensureDbExists();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Funding source ID is required" },
        { status: 400 }
      );
    }
    
    // Check if funding source exists
    const existingFundingSource = await prisma.fundingSource.findUnique({
      where: { id },
      include: { programs: { select: { id: true } } }
    });
    
    if (!existingFundingSource) {
      return NextResponse.json(
        { error: "Funding source not found" },
        { status: 404 }
      );
    }
    
    // Check if funding source is in use
    if (existingFundingSource.programs.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete funding source that is in use by programs" },
        { status: 400 }
      );
    }
    
    // Delete the funding source
    await prisma.fundingSource.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting funding source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}