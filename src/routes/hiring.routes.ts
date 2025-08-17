import { Router } from 'express';

// Page-scoped router: Contratar (Hiring)
// TODO: Wire to offers/jobs/controllers
const hiringRoutes = Router();

// GET /api/v1/pages/hiring
hiringRoutes.get('/', async (req, res) => {
  // Placeholder: return hiring sections
  return res.json({
    page: 'hiring',
    message: 'Hiring page API placeholder',
    sections: ['create_offer', 'open_offers', 'recommended_artists'],
  });
});

export default hiringRoutes;
