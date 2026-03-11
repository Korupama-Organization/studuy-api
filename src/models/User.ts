import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IBankAccount {
    bankName?: string;
    number?: string;
}

export interface ITeacherProfile {
    bio?: string;
    expertise?: string[];
    bankAccount?: IBankAccount;
}

export interface IUser extends Document {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    emailVerified: boolean;
    passwordUpdatedAt?: Date;
    role: 'student' | 'teacher' | 'admin';
    avatar?: string;
    /** Authentication provider: 'local' | 'google' | 'facebook' */
    authProvider: string;
    isBlocked: boolean;
    teacherProfile?: ITeacherProfile;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const BankAccountSchema = new Schema<IBankAccount>(
    {
        bankName: String,
        number: String,
    },
    { _id: false }
);

const TeacherProfileSchema = new Schema<ITeacherProfile>(
    {
        bio: String,
        expertise: [String],
        bankAccount: BankAccountSchema,
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false }, // Excluded from queries by default
        emailVerified: { type: Boolean, default: false },
        passwordUpdatedAt: { type: Date },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student',
        },
        avatar: String,
        authProvider: { type: String, default: 'local' },
        isBlocked: { type: Boolean, default: false },
        teacherProfile: TeacherProfileSchema,
    },
    { timestamps: true }
);

// Note: email index is auto-created by unique: true in the schema
UserSchema.index({ role: 1 });


export const User = model<IUser>('User', UserSchema);
