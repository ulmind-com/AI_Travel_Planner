import mongoose from 'mongoose';
import User from './src/shared/database/models/userModel';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.DB_URI || '').then(async () => {
    const users = await User.find({}).lean();
    console.log("USERS IN DB:", users.map(u => ({
        _id: u._id,
        firebaseUid: u.firebaseUid,
        email: u.email,
        username: u.username,
        fullname: u.fullname
    })));
    mongoose.disconnect();
}).catch(console.error);
