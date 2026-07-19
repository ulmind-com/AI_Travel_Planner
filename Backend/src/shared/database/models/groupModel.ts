import { Schema, model } from 'mongoose';
import { IGroup } from '../../dtos/CommunityDTO';

const groupSchema = new Schema<IGroup>({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String },
    isPrivate: { type: Boolean, default: false },
    privacy: { type: String, enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'], default: 'PUBLIC' },
    memberCount: { type: Number, default: 0 },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    destination: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: true });

const Group = model<IGroup>('Group', groupSchema);
export default Group;
