import { Router } from 'express';
import { venuesController } from '../controllers/venues.controller.js';

const router = Router();

// Obtener todos los venues de una company
router.get('/company/:companyId', venuesController.getVenuesByCompany);

// Obtener un venue específico
router.get('/:id', venuesController.getVenueById);

// Crear un nuevo venue
router.post('/company/:companyId', venuesController.createVenue);

// Actualizar un venue
router.put('/company/:companyId/:id', venuesController.updateVenue);

// Eliminar un venue
router.delete('/company/:companyId/:id', venuesController.deleteVenue);

export default router;
