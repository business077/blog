import mongoose from 'mongoose';

const visitCounterSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site' },
  total: { type: Number, default: 0 }
});

export const VisitCounter = mongoose.model('VisitCounter', visitCounterSchema);
