import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

export const Question = mongoose.model('Question', questionSchema);
