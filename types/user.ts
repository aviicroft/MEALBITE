export type UserRole = "STUDENT" | "ADMIN" | "student" | "admin";

export interface IUser {
  id: string;
  name: string;
  email: string;
  studentId?: string | null;
  roomNumber?: string | null;
  role: "STUDENT" | "ADMIN";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSessionProfile {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  studentId?: string | null;
  roomNumber?: string | null;
}

export function isAdminRole(role?: string | null): boolean {
  return role?.toUpperCase() === "ADMIN";
}

export function normalizeRole(role?: string | null): "STUDENT" | "ADMIN" {
  return role?.toUpperCase() === "ADMIN" ? "ADMIN" : "STUDENT";
}
