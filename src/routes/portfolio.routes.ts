import { Router } from 'express';

// Portfolio endpoints (profile -> portfolio)
// For now, minimal controllers that validate presence of required fields and return a mock id.
// Frontend already uploads media to Supabase and sends public URLs here.

const portfolioRoutes = Router();

// Helpers
const newId = () => Math.random().toString(36).slice(2);

// POST /api/v1/portfolio/photos
portfolioRoutes.post('/photos', async (req, res) => {
  const { imageUrl, caption, alt, crop } = req.body || {};
  if (!imageUrl) return res.status(400).json({ message: 'imageUrl es requerido' });
  // TODO: persist in DB
  return res.status(201).json({ id: newId(), imageUrl, caption, alt, crop });
});

// POST /api/v1/portfolio/videos
portfolioRoutes.post('/videos', async (req, res) => {
  const { url, title, description } = req.body || {};
  if (!url) return res.status(400).json({ message: 'url es requerido' });
  // TODO: persist in DB
  return res.status(201).json({ id: newId(), url, title, description });
});

// POST /api/v1/portfolio/services
portfolioRoutes.post('/services', async (req, res) => {
  const { title, price, description, tags, imageUrl, crop } = req.body || {};
  if (!title) return res.status(400).json({ message: 'title es requerido' });
  // TODO: persist in DB
  return res.status(201).json({ id: newId(), title, price, description, tags, imageUrl, crop });
});

// POST /api/v1/portfolio/products
portfolioRoutes.post('/products', async (req, res) => {
  const { name, title, price, description, sku, stock, imageUrl, crop, tags } = req.body || {};
  const displayName = name || title; // tolerate either key from FE
  if (!displayName) return res.status(400).json({ message: 'name/title es requerido' });
  // TODO: persist in DB
  return res.status(201).json({ id: newId(), name: displayName, price, description, sku, stock, imageUrl, crop, tags });
});

export default portfolioRoutes;
