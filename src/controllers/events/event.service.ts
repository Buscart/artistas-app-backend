// Barrel: re-exporta todos los sub-servicios como EventService unificado
export { EventCrudService } from './event.crud.service.js';
export { EventAttendeesService } from './event.attendees.service.js';
export { EventReviewsService } from './event.reviews.service.js';

import { EventCrudService } from './event.crud.service.js';
import { EventAttendeesService } from './event.attendees.service.js';
import { EventReviewsService } from './event.reviews.service.js';

// Clase unificada para retrocompatibilidad con imports existentes
export const EventService = {
  // CRUD
  getEventById: EventCrudService.getEventById.bind(EventCrudService),
  createEvent: EventCrudService.createEvent.bind(EventCrudService),
  getCompanyEvents: EventCrudService.getCompanyEvents.bind(EventCrudService),
  getMyEvents: EventCrudService.getMyEvents.bind(EventCrudService),
  updateEvent: EventCrudService.updateEvent.bind(EventCrudService),
  cancelEvent: EventCrudService.cancelEvent.bind(EventCrudService),
  deleteEvent: EventCrudService.deleteEvent.bind(EventCrudService),
  isEventOrganizer: EventCrudService.isEventOrganizer.bind(EventCrudService),
  searchEvents: EventCrudService.searchEvents.bind(EventCrudService),
  getUpcomingEvents: EventCrudService.getUpcomingEvents.bind(EventCrudService),
  // Attendees
  getAttendeeStats: EventAttendeesService.getAttendeeStats.bind(EventAttendeesService),
  registerForEvent: EventAttendeesService.registerForEvent.bind(EventAttendeesService),
  unregisterFromEvent: EventAttendeesService.unregisterFromEvent.bind(EventAttendeesService),
  getMyRegistration: EventAttendeesService.getMyRegistration.bind(EventAttendeesService),
  getEventAttendees: EventAttendeesService.getEventAttendees.bind(EventAttendeesService),
  approveAttendee: EventAttendeesService.approveAttendee.bind(EventAttendeesService),
  rejectAttendee: EventAttendeesService.rejectAttendee.bind(EventAttendeesService),
  moveToWaitlist: EventAttendeesService.moveToWaitlist.bind(EventAttendeesService),
  moveFromWaitlist: EventAttendeesService.moveFromWaitlist.bind(EventAttendeesService),
  checkInAttendee: EventAttendeesService.checkInAttendee.bind(EventAttendeesService),
  undoCheckIn: EventAttendeesService.undoCheckIn.bind(EventAttendeesService),
  // Reviews + History + Certificates
  createReview: EventReviewsService.createReview.bind(EventReviewsService),
  getEventReviews: EventReviewsService.getEventReviews.bind(EventReviewsService),
  respondToReview: EventReviewsService.respondToReview.bind(EventReviewsService),
  getAttendedEvents: EventReviewsService.getAttendedEvents.bind(EventReviewsService),
  getRegisteredEvents: EventReviewsService.getRegisteredEvents.bind(EventReviewsService),
  generateCertificate: EventReviewsService.generateCertificate.bind(EventReviewsService),
};
