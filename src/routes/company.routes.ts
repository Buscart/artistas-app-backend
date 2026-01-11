import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';

const router = Router();

// Obtener todas las empresas del usuario autenticado
router.get('/my-companies', companyController.getMyCompanies);

// Obtener perfil público de la empresa (sin datos sensibles)
router.get('/:id/public', companyController.getPublicProfile);

// Obtener sección "Acerca de" de la empresa
router.get('/:id/about', companyController.getAbout);

// Actualizar sección "Acerca de" de la empresa
router.put('/:id/about', companyController.updateAbout);

// Obtener portafolio de la empresa
router.get('/:id/portfolio', companyController.getPortfolio);

// Actualizar portafolio de la empresa
router.put('/:id/portfolio', companyController.updatePortfolio);

// Obtener equipo de la empresa
router.get('/:id/team', companyController.getTeam);

// Actualizar equipo de la empresa
router.put('/:id/team', companyController.updateTeam);

// Incrementar contador de vistas
router.post('/:id/increment-view', companyController.incrementViewCount);

// Guardar/quitar de favoritos
router.post('/:id/save', companyController.saveToFavorites);

// Obtener una empresa específica por ID
router.get('/:id', companyController.getCompanyById);

// Crear una nueva empresa
router.post('/', companyController.createCompany);

// Actualizar una empresa existente
router.put('/:id', companyController.updateCompany);

// Eliminar una empresa
router.delete('/:id', companyController.deleteCompany);

// Marcar una empresa como principal
router.patch('/:id/set-primary', companyController.setPrimaryCompany);

export default router;
