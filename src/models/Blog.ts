import { Schema, model, Document, Types } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  siteType: "medical" | "general" | "love";
  tags: string[];
  status: "draft" | "published";
  author: Types.ObjectId;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    category: { type: String, default: "General", index: true },
    siteType: { type: String, enum: ["medical", "general", "love"], required: true, default: "love", index: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "published" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogSchema.index({ title: "text", excerpt: "text" });

export default model<IBlog>("Blog", BlogSchema);
