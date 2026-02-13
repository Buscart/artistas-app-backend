import { db } from '../db.js';
import { users, artists } from '../schema.js';
import { eq } from 'drizzle-orm';
export class ProfileProgressService {
    /**
     * Calcular el progreso de completitud del perfil
     */
    async calculateProfileCompleteness(userId) {
        try {
            // Obtener datos del usuario
            const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            if (user.length === 0) {
                throw new Error('Usuario no encontrado');
            }
            const userData = user[0];
            const isArtist = userData.userType === 'artist';
            // Obtener datos de artista si aplica
            let artistData = null;
            if (isArtist) {
                const artist = await db.select().from(artists).where(eq(artists.userId, userId)).limit(1);
                artistData = artist.length > 0 ? artist[0] : null;
            }
            // Secciones del perfil
            const sections = {
                basicInfo: this.checkBasicInfo(userData),
                bio: this.checkBio(userData),
                contact: this.checkContact(userData),
                portfolio: this.checkPortfolio(userData, artistData),
                social: this.checkSocial(userData, artistData),
                artist: isArtist ? this.checkArtistProfile(artistData) : { complete: true, percentage: 100, missing: [] },
            };
            // Calcular porcentaje general
            const weights = {
                basicInfo: 25,
                bio: 15,
                contact: 10,
                portfolio: isArtist ? 20 : 10,
                social: 10,
                artist: isArtist ? 20 : 0,
            };
            let overall = 0;
            Object.entries(sections).forEach(([key, section]) => {
                const weight = weights[key];
                overall += (section.percentage / 100) * weight;
            });
            // Generar sugerencias
            const suggestions = this.generateSuggestions(sections, isArtist);
            return {
                overall: Math.round(overall),
                sections,
                suggestions,
            };
        }
        catch (error) {
            console.error('Error calculating profile completeness:', error);
            throw error;
        }
    }
    /**
     * Verificar información básica
     */
    checkBasicInfo(user) {
        const fields = {
            'Nombre': user.firstName,
            'Apellido': user.lastName,
            'Nombre de usuario': user.username,
            'Ciudad': user.city,
            'Foto de perfil': user.profileImageUrl,
        };
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value && value !== '') {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage === 100,
            percentage,
            missing,
        };
    }
    /**
     * Verificar bio
     */
    checkBio(user) {
        const fields = {
            'Biografía': user.bio,
            'Bio corta': user.shortBio,
        };
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value && value !== '') {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage === 100,
            percentage,
            missing,
        };
    }
    /**
     * Verificar información de contacto
     */
    checkContact(user) {
        const fields = {
            'Teléfono': user.phone,
            'Sitio web': user.website,
        };
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value && value !== '') {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage >= 50, // Al menos uno
            percentage,
            missing,
        };
    }
    /**
     * Verificar portafolio
     */
    checkPortfolio(user, artist) {
        const fields = {};
        if (artist) {
            const gallery = Array.isArray(artist.gallery) ? artist.gallery : [];
            const portfolio = artist.portfolio || {};
            const images = portfolio.images || [];
            fields['Galería de imágenes'] = gallery.length > 0 || images.length > 0;
            fields['Video de presentación'] = artist.videoPresentation;
        }
        if (Object.keys(fields).length === 0) {
            return { complete: true, percentage: 100, missing: [] };
        }
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value) {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage >= 50,
            percentage,
            missing,
        };
    }
    /**
     * Verificar redes sociales
     */
    checkSocial(user, artist) {
        const userSocial = user.socialMedia || {};
        const artistSocial = artist?.socialMedia || {};
        const allSocial = { ...userSocial, ...artistSocial };
        const fields = {
            'Instagram': allSocial.instagram,
            'Facebook': allSocial.facebook,
            'Twitter': allSocial.twitter,
            'TikTok': allSocial.tiktok,
            'YouTube': allSocial.youtube,
        };
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value && value !== '') {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage >= 40, // Al menos 2 redes
            percentage,
            missing,
        };
    }
    /**
     * Verificar perfil de artista
     */
    checkArtistProfile(artist) {
        if (!artist) {
            return { complete: false, percentage: 0, missing: ['Perfil de artista completo'] };
        }
        const fields = {
            'Nombre artístico': artist.artistName || artist.stageName,
            'Categoría': artist.categoryId,
            'Descripción': artist.description || artist.bio,
            'Años de experiencia': artist.yearsOfExperience,
            'Precio por hora': artist.pricePerHour,
            'Disponibilidad': artist.availability,
        };
        const missing = [];
        let completed = 0;
        Object.entries(fields).forEach(([field, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                completed++;
            }
            else {
                missing.push(field);
            }
        });
        const total = Object.keys(fields).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            complete: percentage >= 80,
            percentage,
            missing,
        };
    }
    /**
     * Generar sugerencias para mejorar el perfil
     */
    generateSuggestions(sections, isArtist) {
        const suggestions = [];
        // Información básica
        if (sections.basicInfo.percentage < 100) {
            if (sections.basicInfo.missing.includes('Foto de perfil')) {
                suggestions.push('Agrega una foto de perfil para que te reconozcan fácilmente');
            }
            if (sections.basicInfo.missing.includes('Ciudad')) {
                suggestions.push('Indica tu ciudad para que te encuentren usuarios cercanos');
            }
        }
        // Bio
        if (sections.bio.percentage < 50) {
            suggestions.push('Escribe una biografía para que otros usuarios te conozcan mejor');
        }
        // Portafolio
        if (sections.portfolio.percentage < 50 && isArtist) {
            suggestions.push('Agrega trabajos a tu portafolio para mostrar tu experiencia');
        }
        // Redes sociales
        if (sections.social.percentage < 40) {
            suggestions.push('Conecta tus redes sociales para expandir tu alcance');
        }
        // Artista
        if (isArtist && sections.artist.percentage < 80) {
            if (sections.artist.missing.includes('Precio por hora')) {
                suggestions.push('Define tu precio por hora para recibir más contrataciones');
            }
            if (sections.artist.missing.includes('Disponibilidad')) {
                suggestions.push('Configura tu disponibilidad para que sepan cuándo estás libre');
            }
        }
        return suggestions.slice(0, 5); // Máximo 5 sugerencias
    }
    /**
     * Obtener estadísticas de progreso
     */
    async getProgressStats(userId) {
        try {
            const completeness = await this.calculateProfileCompleteness(userId);
            return {
                overallPercentage: completeness.overall,
                nextMilestone: this.getNextMilestone(completeness.overall),
                topSuggestions: completeness.suggestions.slice(0, 3),
                sections: Object.entries(completeness.sections).map(([key, value]) => ({
                    name: this.getSectionName(key),
                    percentage: value.percentage,
                    complete: value.complete,
                })),
            };
        }
        catch (error) {
            console.error('Error getting progress stats:', error);
            throw error;
        }
    }
    /**
     * Obtener siguiente milestone
     */
    getNextMilestone(current) {
        const milestones = [
            { target: 25, label: 'Perfil Básico' },
            { target: 50, label: 'Perfil Intermedio' },
            { target: 75, label: 'Perfil Avanzado' },
            { target: 100, label: 'Perfil Completo' },
        ];
        const next = milestones.find(m => m.target > current);
        return next || { target: 100, label: 'Perfil Completo' };
    }
    /**
     * Obtener nombre amigable de sección
     */
    getSectionName(key) {
        const names = {
            basicInfo: 'Información Básica',
            bio: 'Biografía',
            contact: 'Contacto',
            portfolio: 'Portafolio',
            social: 'Redes Sociales',
            artist: 'Perfil de Artista',
        };
        return names[key] || key;
    }
}
export const profileProgressService = new ProfileProgressService();
