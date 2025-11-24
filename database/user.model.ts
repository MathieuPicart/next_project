import { Schema, model, models, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface for User document
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    image?: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (email: string) {
                    // RFC 5322 compliant email validation regex
                    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    return emailRegex.test(email);
                },
                message: 'Please provide a valid email address',
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't return password by default in queries
        },
        image: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: {
                values: ['user', 'admin'],
                message: 'Role must be either user or admin',
            },
            default: 'user',
        },
    },
    {
        timestamps: true, // Auto-generate createdAt and updatedAt
    }
);

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function (next) {
    const user = this as IUser;

    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
        return next();
    }

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Indexes are automatically created from schema unique: true constraint
// Additional indexes can be created manually in production via MongoDB

let User: ReturnType<typeof model<IUser>>;

try {
    User = model<IUser>('User');
} catch {
    User = model<IUser>('User', UserSchema);
}

export default User;
