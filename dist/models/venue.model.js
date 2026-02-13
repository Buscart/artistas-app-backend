import { Schema, model } from 'mongoose';
const venueSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    venueType: {
        type: String,
        required: true,
        enum: [
            'Teatro', 'Auditorio', 'Galería', 'Centro Cultural',
            'Café Cultural', 'Biblioteca', 'Museo', 'Sala de Conciertos',
            'Espacio Abierto', 'Club'
        ]
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    services: [{
            type: String,
            enum: [
                'sound', 'lighting', 'projection', 'catering',
                'parking', 'accessibility'
            ]
        }],
    imageUrl: String,
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
// Índices para búsqueda eficiente
venueSchema.index({ city: 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ capacity: 1 });
venueSchema.index({ services: 1 });
export const Venue = model('Venue', venueSchema);
