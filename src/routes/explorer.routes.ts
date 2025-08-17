import { Router } from 'express';

// Page-scoped router: Explorar (Explorer)
// TODO: Wire to search/browse controllers (artists, events, posts)
const explorerRoutes = Router();

// GET /api/v1/pages/explorer
explorerRoutes.get('/', async (req, res) => {
  // Placeholder: return filters and featured lists
  return res.json({
    page: 'explorer',
    message: 'Explorer page API placeholder',
    sections: ['filters', 'featured_artists', 'recommended', 'trending'],
  });
});

export default explorerRoutes;
