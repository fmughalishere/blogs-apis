import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  blog: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  },
  { timestamps: true }
);

export default model<IComment>("Comment", CommentSchema);
