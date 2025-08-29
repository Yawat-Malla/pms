import { NextResponse } from "next/server";
import { prisma, ensureDbExists } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  wardId: z.string().optional(),
  roleIds: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  try {
    await ensureDbExists();

    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        wardId: validatedData.wardId || null,
        roles: {
          connect: validatedData.roleIds.map(id => ({ id }))
        }
      },
      include: {
        roles: true,
        ward: true
      }
    });

    // Remove password from response
    const { hashedPassword: _, ...userWithoutPassword } = user;

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "user_created",
        description: `New user account created: ${user.name} (${user.email})`,
        entityType: "user",
        entityId: user.id,
        userId: user.id
      }
    });

    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    
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
