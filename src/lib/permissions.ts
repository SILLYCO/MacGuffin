import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Please log in");
  }
  return user;
}

export async function requireITRole() {
  const user = await requireAuth();
  if (user.role !== "IT") {
    throw new Error("Forbidden: Only IT administrators can perform this action");
  }
  return user;
}
