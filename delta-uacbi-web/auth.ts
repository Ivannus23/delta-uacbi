import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAIN = "uan.edu.mx";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          hd: ALLOWED_DOMAIN,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase() || "";

      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return false;
      }

      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        await db.user.create({
          data: {
            name: user.name || email,
            email,
            role: UserRole.JEFE_GRUPO,
          },
        });
      } else if (user.name && existingUser.name !== user.name) {
        await db.user.update({
          where: { email },
          data: { name: user.name },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      const email = (user?.email || token.email || "").toLowerCase();

      if (email) {
        const dbUser = await db.user.findUnique({
          where: { email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
      }

      return session;
    },
  },
};

export const auth = () => getServerSession(authOptions);

export default NextAuth(authOptions);
