import { Schema, model, Document } from 'mongoose';

export interface IUserBalance extends Document {
    groupId: Schema.Types.ObjectId; // References Group
    userId: Schema.Types.ObjectId; // References User
    owes: number;
    owed: number;
    netBalance: number;
    updatedAt: Date;
}

const userBalanceSchema = new Schema<IUserBalance>({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owes: { type: Number, default: 0 },
    owed: { type: Number, default: 0 },
    netBalance: { type: Number, default: 0 }
}, { timestamps: { createdAt: false, updatedAt: true } });

userBalanceSchema.index({ groupId: 1, userId: 1 }, { unique: true });

const UserBalance = model<IUserBalance>('UserBalance', userBalanceSchema);
export default UserBalance;
