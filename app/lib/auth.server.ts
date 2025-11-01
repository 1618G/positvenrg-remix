import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.server";
import { authLogger, securityLogger } from "./logger.server";
import { createDefaultSubscription } from "./subscription.server";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
}

export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  // Create default free subscription for new user
  await createDefaultSubscription(user.id);

  authLogger.userCreated(user.id, user.email, user.role);
  return user;
}

export async function verifyLogin(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    authLogger.loginAttempt(email, false);
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    authLogger.loginAttempt(email, false);
    return null;
  }

  authLogger.loginAttempt(email, true);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function createUserSession(userId: string) {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  
  authLogger.sessionCreated(userId, 'unknown'); // We don't have email here
  return token;
}

export function verifyUserSession(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded;
  } catch {
    securityLogger.invalidToken(token, 'unknown'); // We don't have IP here
    return null;
  }
}

export async function getUserById(id: string): Promise<(User & { verificationToken?: string | null; verificationTokenExpiry?: Date | null }) | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      verificationToken: true,
      verificationTokenExpiry: true,
    },
  });

  return user ? {
    ...user,
    name: user.name || undefined
  } : null;
}
