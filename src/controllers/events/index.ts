// Re-exportar todo desde los módulos individuales
export * from './event.types.js';
export * from './event.validations.js';
export * from './event.utils.js';
export * from './event.service.js';
export { default as EventController } from './event.controller.js';

// También podemos exportar el controlador como un objeto con todos los métodos estáticos
import EventController from './event.controller.js';

export default {
  // Métodos del controlador
  getEventById: EventController.getEventById,
  createEvent: EventController.createEvent,
  updateEvent: EventController.updateEvent,
  cancelEvent: EventController.cancelEvent,
  searchEvents: EventController.searchEvents,
  getUpcomingEvents: EventController.getUpcomingEvents,

  // También podemos exportar la clase completa
  Controller: EventController
};
