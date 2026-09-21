import { createReview, listReviews, ReviewError } from '../_lib/reviews.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    if (request.method === 'POST') return response.status(201).json({ review: await createReview(request) });
    if (request.method === 'GET') return response.status(200).json({ reviews: await listReviews(request) });
    response.setHeader('Allow', 'GET, POST'); return response.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return response.status(error instanceof ReviewError ? error.status : 502).json({ message: error instanceof ReviewError ? error.message : 'Reviews are temporarily unavailable.' }); }
}
