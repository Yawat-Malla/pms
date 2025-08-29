import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Validate input
          const validatedCredentials = loginSchema.parse(credentials);

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: validatedCredentials.email },
            include: {
              roles: true,
              ward: true
            }
          });

          if (!user || !user.hashedPassword) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            validatedCredentials.password,
            user.hashedPassword
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            wardId: user.wardId,
            ward: user.ward,
            roles: user.roles
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.wardId = user.wardId;
        token.ward = user.ward;
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.wardId = token.wardId as string;
        session.user.ward = token.ward as {
          id: string;
          code: string;
          name: string;
        };
        session.user.roles = token.roles as {
          id: string;
          name: string;
        }[];
      }
      return session;
    }
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
