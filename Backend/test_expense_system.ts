import { recalculateGroupBalances, calculateSettlements, getAIExpenseInsights } from './src/shared/services/expenseEngine';
import User from './src/shared/database/models/userModel';
import Group from './src/shared/database/models/groupModel';
import GroupExpense from './src/shared/database/models/groupExpenseModel';
import ExpenseItem from './src/shared/database/models/expenseItemModel';
import UserBalance from './src/shared/database/models/userBalanceModel';
import mongoose from 'mongoose';

console.log("🧪 Initializing Mock Environment for Smart Expense System Tests...");

// 1. Mock DB Storage
const mockDb = {
    users: [] as any[],
    groups: [] as any[],
    groupExpenses: [] as any[],
    expenseItems: [] as any[],
    userBalances: [] as any[]
};

// 2. Mocks
User.findById = (async (id: any) => mockDb.users.find(u => u._id.toString() === id.toString())) as any;

// Mock Group.findById directly on Group model
Group.findById = (async (id: any) => {
    return mockDb.groups.find(g => g._id.toString() === id.toString()) || null;
}) as any;

GroupExpense.find = (async (query: any) => {
    return mockDb.groupExpenses.filter((ge: any) => ge.groupId.toString() === query.groupId.toString());
}) as any;
GroupExpense.findOne = (async (query: any) => {
    return mockDb.groupExpenses.find((ge: any) => ge.groupId.toString() === query.groupId.toString()) || null;
}) as any;

ExpenseItem.find = (async (query: any) => {
    if (query.expenseId && query.expenseId.$in) {
        const ids = query.expenseId.$in.map((id: any) => id.toString());
        return mockDb.expenseItems.filter((ei: any) => ids.includes(ei.expenseId.toString()));
    }
    return [];
}) as any;

// Mock findOneAndUpdate for UserBalance to support populate chaining
UserBalance.findOneAndUpdate = (() => {
    const fn = async (query: any, update: any, options: any) => {
        let balance = mockDb.userBalances.find(b => 
            b.groupId.toString() === query.groupId.toString() && 
            b.userId.toString() === query.userId.toString()
        );
        if (!balance) {
            balance = {
                groupId: query.groupId,
                userId: query.userId,
                owes: 0,
                owed: 0,
                netBalance: 0
            };
            mockDb.userBalances.push(balance);
        }
        // Apply updates
        balance.owes = update.owes;
        balance.owed = update.owed;
        balance.netBalance = update.netBalance;

        return balance;
    };
    
    return (query: any, update: any, options: any) => {
        const promise = fn(query, update, options);
        (promise as any).populate = function() { return this; };
        return promise;
    };
})() as any;

// Mock UserBalance.find with proper chainable thenable
UserBalance.find = ((query: any) => {
    const list = mockDb.userBalances.filter(b => b.groupId.toString() === query.groupId.toString());
    const chain = {
        populate: function() { return this; },
        lean: function() {
            return Promise.resolve(list.map(b => {
                const user = mockDb.users.find(u => u._id.toString() === b.userId.toString());
                return {
                    ...b,
                    userId: user ? { _id: user._id, username: user.username, fullname: user.fullname, profilepicture: user.profilepicture } : b.userId
                };
            }));
        },
        then: function(resolve: any) {
            this.lean().then(resolve);
        }
    };
    return chain;
}) as any;

async function runTests() {
    console.log("🏃 Running Smart Split & Settlement Tests...");

    // Setup Mock Users
    const userA = { _id: new mongoose.Types.ObjectId(), username: 'alice', fullname: 'Alice Smith', profilepicture: '' };
    const userB = { _id: new mongoose.Types.ObjectId(), username: 'bob', fullname: 'Bob Jones', profilepicture: '' };
    const userC = { _id: new mongoose.Types.ObjectId(), username: 'charlie', fullname: 'Charlie Brown', profilepicture: '' };
    mockDb.users.push(userA, userB, userC);

    const groupId = new mongoose.Types.ObjectId();
    const group = {
        _id: groupId,
        name: 'Europe Trip 2026',
        members: [userA._id, userB._id, userC._id]
    };
    mockDb.groups.push(group);

    const groupExpenseId = new mongoose.Types.ObjectId();
    const groupExpense = {
        _id: groupExpenseId,
        groupId: groupId,
        title: 'Europe Trip Expenses',
        totalAmount: 900
    };
    mockDb.groupExpenses.push(groupExpense);

    // Scenario 1: Equal Split
    // Alice paid 900 for lodging, split equally between Alice, Bob, and Charlie.
    // Each should pay 300.
    // Alice net: 900 - 300 = +600 (owed 600)
    // Bob net: 0 - 300 = -300 (owes 300)
    // Charlie net: 0 - 300 = -300 (owes 300)
    console.log("💰 Scenario 1: Alice paid 900 (Equal split amongst 3 people)");
    const expenseItem1 = {
        expenseId: groupExpenseId,
        paidBy: userA._id,
        amount: 900,
        description: 'Hotel Lodging',
        splitType: 'equal',
        splitDetails: [
            { userId: userA._id, amount: 300 },
            { userId: userB._id, amount: 300 },
            { userId: userC._id, amount: 300 }
        ]
    };
    mockDb.expenseItems.push(expenseItem1);

    await recalculateGroupBalances(groupId.toString());
    console.log("Balances after calculation:");
    mockDb.userBalances.forEach(b => {
        const u = mockDb.users.find(usr => usr._id.toString() === b.userId.toString());
        console.log(`👤 ${u?.fullname}: Net = ${b.netBalance} (Owes: ${b.owes}, Owed: ${b.owed})`);
    });

    const settlements = await calculateSettlements(groupId.toString());
    console.log("Settlement Transactions Suggestion:");
    settlements.forEach(s => {
        console.log(`💸 ${s.from.fullname} pays ${s.to.fullname} ₹${s.amount}`);
    });

    // Assertions
    const aliceBalance = mockDb.userBalances.find(b => b.userId.toString() === userA._id.toString());
    const bobBalance = mockDb.userBalances.find(b => b.userId.toString() === userB._id.toString());
    if (aliceBalance?.netBalance !== 600 || bobBalance?.netBalance !== -300) {
        throw new Error("Incorrect balance calculations!");
    }
    if (settlements.length !== 2) {
        throw new Error("Settlement engine should minimize to exactly 2 transactions!");
    }

    console.log("✅ All balance engine and transaction minimizer tests passed successfully!");
}

runTests().catch(err => {
    console.error("❌ Tests failed:", err);
    process.exit(1);
});
