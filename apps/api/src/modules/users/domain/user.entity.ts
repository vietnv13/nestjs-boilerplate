export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
  image: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name?: string;
  role?: "user" | "admin";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  image?: string;
  emailVerified?: boolean;
}
