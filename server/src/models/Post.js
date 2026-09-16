import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, default: 'Field Notes', trim: true },
    author: { type: String, default: 'The Inkwell Team', trim: true },
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);
