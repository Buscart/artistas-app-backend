import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    // Datos básicos
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    userType: {
        type: String,
        enum: ['artist', 'general', 'company'],
        default: 'general'
    },
    profileImageUrl: { type: String },
    city: { type: String },
    bio: { type: String },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 0,
        max: 5
    },
    // Campos específicos para artistas
    artisticName: { type: String },
    artisticCategories: [{ type: String }],
    skills: [{ type: String }],
    portfolio: [{
            type: {
                type: String,
                enum: ['image', 'video'],
                required: true
            },
            url: { type: String, required: true },
            title: { type: String },
            description: { type: String }
        }],
    // Campos específicos para empresas/espacios culturales
    companyName: { type: String },
    companyCategory: { type: String },
    address: { type: String },
    services: [{ type: String }],
    // Redes sociales
    socialMedia: {
        website: { type: String },
        instagram: { type: String },
        facebook: { type: String },
        twitter: { type: String },
        youtube: { type: String },
        tiktok: { type: String }
    }
}, {
    timestamps: true
});
export const User = model('User', userSchema);
