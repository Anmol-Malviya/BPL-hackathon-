import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import UrlScan from '../../../lib/models/UrlScan';

export async function GET() {
  try {
    await dbConnect();
    const history = await UrlScan.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      
    // Format response to match expected UI structure
    const formatted = history.map(item => ({
      url: item.url,
      rating: item.rating,
      score: item.score,
      date: item.date
    }));
    
    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Failed to fetch scan history:', err);
    return NextResponse.json({ error: 'Failed to fetch scan history: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, rating, score } = body;
    
    if (!url || !rating || score === undefined) {
      return NextResponse.json({ error: 'url, rating, and score are required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Remove previous scan of same URL (case-insensitive) to bring it to the top of the history
    await UrlScan.deleteMany({ url: { $regex: new RegExp(`^${url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
    
    const newScan = await UrlScan.create({
      url,
      rating,
      score,
      date: new Date().toLocaleDateString()
    });
    
    return NextResponse.json({ success: true, data: newScan });
  } catch (err) {
    console.error('Failed to save scan result:', err);
    return NextResponse.json({ error: 'Failed to save scan result: ' + err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await UrlScan.deleteMany({});
    return NextResponse.json({ success: true, message: 'Scan history cleared successfully' });
  } catch (err) {
    console.error('Failed to clear scan history:', err);
    return NextResponse.json({ error: 'Failed to clear scan history: ' + err.message }, { status: 500 });
  }
}
