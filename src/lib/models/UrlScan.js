import mongoose from 'mongoose';

const UrlScanSchema = new mongoose.Schema({
  url: { type: String, required: true },
  rating: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString() },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.UrlScan || mongoose.model('UrlScan', UrlScanSchema);
