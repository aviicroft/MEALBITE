export type UserRole = "student" | "admin";

export interface IUser {
  _id?: string;
  clerkUserId: string;
  name: string;
  email: string;
  studentId?: string;
  roomNumber?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSessionProfile {
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  roomNumber?: string;
}
