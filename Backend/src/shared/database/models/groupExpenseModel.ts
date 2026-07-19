import { Schema, model, Document } from 'mongoose';

export interface IGroupExpense extends Document {
    groupId: Schema.Types.ObjectId;
    title: string;
    createdBy: Schema.Types.ObjectId;
    totalAmount: number;
    participants: Schema.Types.ObjectId[];
    createdAt: Date;
}

const groupExpenseSchema = new Schema<IGroupExpense>({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    title: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, default: 0 },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: true, updatedAt: false } });

// Add index on groupId for fast query
groupExpenseSchema.index({ groupId: 1 });

const GroupExpense = model<IGroupExpense>('GroupExpense', groupExpenseSchema);
export default GroupExpense;
