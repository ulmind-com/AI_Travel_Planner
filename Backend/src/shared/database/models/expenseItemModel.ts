import { Schema, model, Document } from 'mongoose';

export interface ISplitDetail {
    userId: Schema.Types.ObjectId;
    amount: number;
}

export interface IExpenseItem extends Document {
    expenseId: Schema.Types.ObjectId; // References GroupExpense
    paidBy: Schema.Types.ObjectId;
    amount: number;
    description: string;
    splitType: 'equal' | 'custom';
    splitDetails: ISplitDetail[];
    createdAt: Date;
}

const expenseItemSchema = new Schema<IExpenseItem>({
    expenseId: { type: Schema.Types.ObjectId, ref: 'GroupExpense', required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    splitType: { type: String, enum: ['equal', 'custom'], default: 'equal', required: true },
    splitDetails: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true }
    }]
}, { timestamps: { createdAt: true, updatedAt: false } });

expenseItemSchema.index({ expenseId: 1 });

const ExpenseItem = model<IExpenseItem>('ExpenseItem', expenseItemSchema);
export default ExpenseItem;
