import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";
      
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to /login
      }

      // Restrict IT-only routes in middleware
      const isITOnly =
        nextUrl.pathname.startsWith("/settings/users") ||
        nextUrl.pathname.startsWith("/devices/new") ||
        nextUrl.pathname.includes("/edit") ||
        nextUrl.pathname.startsWith("/employees/new");

      if (isITOnly && auth.user.role !== "IT") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.employeeId = (token.employeeId as string) || null;
      }
      return session;
    },
  },
  providers: [], // Credentials provider added in auth.ts
  session: { strategy: "jwt" },
};
