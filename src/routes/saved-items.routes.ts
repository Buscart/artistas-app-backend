import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Obtener todos los elementos guardados por el usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Implementar lógica para obtener elementos guardados
    res.json({ message: 'Lista de elementos guardados' });
  } catch (error) {
    console.error('Error al obtener elementos guardados:', error);
    res.status(500).json({ error: 'Error al obtener elementos guardados' });
  }
});

// Guardar un nuevo elemento
router.post('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Implementar lógica para guardar un elemento
    res.status(201).json({ message: 'Elemento guardado exitosamente' });
  } catch (error) {
    console.error('Error al guardar elemento:', error);
    res.status(500).json({ error: 'Error al guardar el elemento' });
  }
});

// Eliminar un elemento guardado
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Implementar lógica para eliminar un elemento guardado
    res.json({ message: `Elemento con ID ${id} eliminado` });
  } catch (error) {
    console.error('Error al eliminar elemento guardado:', error);
    res.status(500).json({ error: 'Error al eliminar el elemento guardado' });
  }
});

export default router;
