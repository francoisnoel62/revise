// ABOUTME: Auth.js configuration with MongoDB user validation.
// ABOUTME: Uses bcrypt for password verification.

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { config } from '../config/env';
import { getDatabase } from '../config/database';
import { MongoDBUserRepository } from '../persistence/MongoDBUserRepository';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Get user from database
          const db = await getDatabase();
          const userRepo = new MongoDBUserRepository(db);
          const user = await userRepo.findByEmail(email);

          if (!user) {
            return null;
          }

          // Verify password
          const isValid = await MongoDBUserRepository.verifyPassword(
            password,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          // Check if user is approved
          if (!user.isApproved) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (but cookie is session-only)
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Session cookie - deleted when browser closes
        expires: undefined,
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/signup', // Redirect here after OAuth (not used currently)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },
  secret: config.auth.secret,
  // Only pass trustHost if explicitly set; otherwise let Auth.js auto-detect (Vercel)
  ...(config.auth.trustHost !== undefined && { trustHost: config.auth.trustHost }),
});
