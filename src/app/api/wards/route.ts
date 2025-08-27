import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a single Prisma instance
const prisma = new PrismaClient();

export async function GET() {
  try {
    const wards = await prisma.ward.findMany({
      orderBy: {
        code: "asc"
      }
    });
    
    return NextResponse.json({ wards });
    
  } catch (error) {
    console.error("Error fetching wards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 