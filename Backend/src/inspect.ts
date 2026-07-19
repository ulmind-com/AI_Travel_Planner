import mongoose from 'mongoose';
import SubscribeMail from './shared/database/models/subscribeMail.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUri = process.env.DB_URI || 'mongodb+srv://AdventureNexus:Samiran2004@cluster0.b05d5ed.mongodb.net/AdventureNexus';

async function run() {
    console.log('Connecting to', dbUri);
    await mongoose.connect(dbUri);
    console.log('Connected!');
    
    const subscribers = await SubscribeMail.find({});
    console.log('Subscribers count:', subscribers.length);
    console.log('Subscribers:', JSON.stringify(subscribers, null, 2));
    
    await mongoose.disconnect();
}

run().catch(console.error);
