import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      wardId?: string;
      ward?: {
        id: string;
        code: string;
        name: string;
      };
      roles?: {
        id: string;
        name: string;
      }[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    wardId?: string;
    ward?: {
      id: string;
      code: string;
      name: string;
    };
    roles?: {
      id: string;
      name: string;
    }[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wardId?: string;
    ward?: {
      id: string;
      code: string;
      name: string;
    };
    roles?: {
      id: string;
      name: string;
    }[];
  }
}
