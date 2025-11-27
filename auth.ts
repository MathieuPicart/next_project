import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                try {
                    await connectDB();

                    // Find user and explicitly select password field
                    const user = await User.findOne({
                        email: (credentials.email as string).toLowerCase()
                    }).select('+password');

                    if (!user) {
                        throw new Error("Invalid email or password");
                    }

                    // Verify password
                    const isPasswordValid = await user.comparePassword(
                        credentials.password as string
                    );

                    if (!isPasswordValid) {
                        throw new Error("Invalid email or password");
                    }

                    // Return user object (password will be excluded from session)
                    return {
                        id: (user._id as any).toString(),
                        name: (user as any).name,
                        email: (user as any).email,
                        role: (user as any).role,
                        image: (user as any).image,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    throw new Error("Authentication failed");
                }
            },
        }),
    ],
});
