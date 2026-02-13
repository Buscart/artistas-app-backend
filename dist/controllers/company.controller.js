import { storage } from '../storage/index.js';
export const companyController = {
    // Obtener todas las empresas del usuario autenticado
    async getMyCompanies(req, res) {
        // Validar que el usuario esté autenticado
        if (!req.user?.id) {
            console.error('❌ Intento de acceso no autorizado a getMyCompanies');
            return res.status(401).json({
                success: false,
                message: 'No autorizado',
                error: 'USER_NOT_AUTHENTICATED'
            });
        }
        const userId = req.user.id;
        try {
            console.log(`🔍 Buscando empresas para el usuario: ${userId}`);
            // Verificar que el userId tenga un formato válido
            if (typeof userId !== 'string' || userId.trim() === '') {
                throw new Error('ID de usuario no válido');
            }
            // Obtener las empresas del usuario usando CompanyStorage
            const userCompanies = await storage.getCompaniesByUserId(userId);
            console.log(`✅ Se encontraron ${userCompanies.length} empresas para el usuario ${userId}`);
            return res.status(200).json({
                success: true,
                data: userCompanies,
                count: userCompanies.length
            });
        }
        catch (error) {
            console.error('❌ Error en getMyCompanies:', {
                error: error instanceof Error ? error.message : 'Error desconocido',
                stack: error instanceof Error ? error.stack : undefined,
                userId,
                timestamp: new Date().toISOString()
            });
            // Manejar diferentes tipos de errores
            if (error instanceof Error) {
                if (error.message.includes('relation "companies" does not exist')) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error en la base de datos: tabla no encontrada',
                        error: 'DATABASE_TABLE_NOT_FOUND'
                    });
                }
                if (error.message.includes('connection')) {
                    return res.status(503).json({
                        success: false,
                        message: 'Error de conexión con la base de datos',
                        error: 'DATABASE_CONNECTION_ERROR'
                    });
                }
            }
            // Error genérico
            return res.status(500).json({
                success: false,
                message: 'Error al obtener las empresas',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    },
    // Obtener una empresa específica por ID
    async getCompanyById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const result = await storage.getCompany(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }
            // Verificar que el usuario sea el dueño de la empresa
            if (userId && result.company.userId !== userId) {
                // Si no es el dueño, solo devolver información pública
                const publicResult = await storage.getPublicCompanyProfile(parseInt(id));
                if (!publicResult) {
                    return res.status(404).json({ message: 'Empresa no encontrada' });
                }
                return res.json(publicResult.company);
            }
            // Retornar la empresa directamente, no el objeto anidado
            return res.json(result.company);
        }
        catch (error) {
            console.error('Error al obtener empresa:', error);
            return res.status(500).json({ message: 'Error al obtener empresa' });
        }
    },
    // Crear una nueva empresa
    async createCompany(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            const { companyName, legalName, taxId, description, shortDescription, companyType, categories, subcategories, tags, contactPerson, phone, email, website, socialMedia, address, city, state, country, postalCode, coordinates, services, amenities, capacity, rooms, openingHours, is24h, priceRange, depositRequired, depositAmount, logoUrl, coverPhotoUrl, gallery, videoTourUrl, isPrimary, 
            // Nuevos campos unificados
            portfolio, bio, history, mission, vision, team, teamSize, foundedYear, certifications, awards, licenses, partnerships, linkedAccounts, languages, education, workExperience, } = req.body;
            if (!companyName) {
                return res.status(400).json({ message: 'El nombre de la empresa es requerido' });
            }
            // Si es la primera empresa o se marca como principal, actualizar otras empresas usando CompanyStorage
            if (isPrimary) {
                await storage.setPrimaryCompany(userId, 0); // This will unset all primary flags
            }
            const newCompany = await storage.createCompany({
                userId,
                companyName,
                legalName,
                taxId,
                description,
                shortDescription,
                companyType,
                categories,
                subcategories,
                tags,
                contactPerson,
                phone,
                email,
                website,
                socialMedia,
                address,
                city,
                state,
                country,
                postalCode,
                coordinates,
                services,
                amenities,
                capacity,
                rooms,
                openingHours,
                is24h,
                priceRange,
                depositRequired,
                depositAmount,
                logoUrl,
                coverPhotoUrl,
                gallery,
                videoTourUrl,
                isPrimary,
                portfolio,
                bio,
                history,
                mission,
                vision,
                team,
                teamSize,
                foundedYear,
                certifications,
                awards,
                licenses,
                partnerships,
                linkedAccounts,
                languages,
                education,
                workExperience,
            });
            // Crear automáticamente un venue para que la empresa aparezca en el explorador
            const multimedia = {
                logo: logoUrl,
                cover: coverPhotoUrl,
                gallery: gallery || [],
                video: videoTourUrl,
            };
            const contact = {
                phone,
                email,
                website,
                ...(socialMedia || {}),
            };
            const dailyRate = priceRange?.min || depositAmount || 0;
            await storage.createVenue({
                companyId: newCompany.id,
                name: companyName,
                description: description || shortDescription,
                venueType: companyType,
                services: tags || [],
                address,
                city,
                openingHours: openingHours || {},
                contact,
                multimedia,
                coordinates,
                dailyRate,
                capacity,
                isAvailable: true,
                rating: 0,
                totalReviews: 0,
            });
            console.log(`✅ Empresa y venue creados exitosamente para ${companyName}`);
            return res.status(201).json(newCompany);
        }
        catch (error) {
            console.error('Error al crear empresa:', error);
            return res.status(500).json({ message: 'Error al crear empresa' });
        }
    },
    // Actualizar una empresa existente
    async updateCompany(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            // Verificar que la empresa existe y pertenece al usuario usando CompanyStorage
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
            }
            const updateData = { ...req.body };
            delete updateData.userId; // No permitir cambiar el dueño
            delete updateData.id; // No permitir cambiar el ID
            // Si se marca como principal, desmarcar otras empresas
            if (updateData.isPrimary) {
                await storage.setPrimaryCompany(userId, parseInt(id));
            }
            const updatedCompany = await storage.updateCompany(parseInt(id), updateData);
            // Actualizar también el venue asociado si hay cambios relevantes
            const venueUpdateData = {};
            if (updateData.companyName)
                venueUpdateData.name = updateData.companyName;
            if (updateData.description || updateData.shortDescription) {
                venueUpdateData.description = updateData.description || updateData.shortDescription;
            }
            if (updateData.companyType)
                venueUpdateData.venueType = updateData.companyType;
            if (updateData.tags)
                venueUpdateData.services = updateData.tags;
            if (updateData.address)
                venueUpdateData.address = updateData.address;
            if (updateData.city)
                venueUpdateData.city = updateData.city;
            if (updateData.openingHours)
                venueUpdateData.openingHours = updateData.openingHours;
            if (updateData.coordinates)
                venueUpdateData.coordinates = updateData.coordinates;
            if (updateData.capacity)
                venueUpdateData.capacity = updateData.capacity;
            // Actualizar multimedia si hay cambios
            const multimedia = {};
            if (updateData.logoUrl)
                multimedia.logo = updateData.logoUrl;
            if (updateData.coverPhotoUrl)
                multimedia.cover = updateData.coverPhotoUrl;
            if (updateData.gallery)
                multimedia.gallery = updateData.gallery;
            if (updateData.videoTourUrl)
                multimedia.video = updateData.videoTourUrl;
            if (Object.keys(multimedia).length > 0)
                venueUpdateData.multimedia = multimedia;
            // Actualizar contacto si hay cambios
            const contact = {};
            if (updateData.phone)
                contact.phone = updateData.phone;
            if (updateData.email)
                contact.email = updateData.email;
            if (updateData.website)
                contact.website = updateData.website;
            if (updateData.socialMedia)
                Object.assign(contact, updateData.socialMedia);
            if (Object.keys(contact).length > 0)
                venueUpdateData.contact = contact;
            // Actualizar tarifa diaria si hay cambios
            if (updateData.priceRange?.min || updateData.depositAmount) {
                venueUpdateData.dailyRate = updateData.priceRange?.min || updateData.depositAmount;
            }
            // Solo actualizar el venue si hay cambios
            if (Object.keys(venueUpdateData).length > 0) {
                // Find the venue associated with this company
                const companyResult = await storage.getCompany(parseInt(id));
                if (companyResult && companyResult.venues && companyResult.venues.length > 0) {
                    const venue = companyResult.venues[0];
                    await storage.updateVenue(venue.id, venueUpdateData);
                    console.log(`✅ Venue actualizado para la empresa ${id}`);
                }
            }
            return res.json(updatedCompany);
        }
        catch (error) {
            console.error('Error al actualizar empresa:', error);
            return res.status(500).json({ message: 'Error al actualizar empresa' });
        }
    },
    // Eliminar una empresa
    async deleteCompany(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            // Verificar que la empresa existe y pertenece al usuario usando CompanyStorage
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para eliminar esta empresa' });
            }
            await storage.deleteCompany(parseInt(id));
            return res.json({ message: 'Empresa eliminada exitosamente' });
        }
        catch (error) {
            console.error('Error al eliminar empresa:', error);
            return res.status(500).json({ message: 'Error al eliminar empresa' });
        }
    },
    // Marcar una empresa como principal
    async setPrimaryCompany(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            // Verificar que la empresa existe y pertenece al usuario usando CompanyStorage
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para modificar esta empresa' });
            }
            // Establecer como empresa principal usando CompanyStorage
            const updatedCompany = await storage.setPrimaryCompany(userId, parseInt(id));
            return res.json(updatedCompany);
        }
        catch (error) {
            console.error('Error al establecer empresa principal:', error);
            return res.status(500).json({ message: 'Error al establecer empresa principal' });
        }
    },
    // Obtener perfil público de la empresa (sin datos sensibles)
    async getPublicProfile(req, res) {
        try {
            const { id } = req.params;
            const publicProfile = await storage.getPublicCompanyProfile(parseInt(id));
            if (!publicProfile) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }
            // Retornar solo los datos de la empresa, no el objeto anidado
            return res.json(publicProfile.company);
        }
        catch (error) {
            console.error('Error al obtener perfil público:', error);
            return res.status(500).json({ message: 'Error al obtener perfil público' });
        }
    },
    // Obtener sección "Acerca de" de la empresa
    async getAbout(req, res) {
        try {
            const { id } = req.params;
            const result = await storage.getCompany(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }
            const aboutData = {
                bio: result.company.bio,
                description: result.company.description,
                shortDescription: result.company.shortDescription,
                history: result.company.history,
                mission: result.company.mission,
                vision: result.company.vision,
                foundedYear: result.company.foundedYear,
                teamSize: result.company.teamSize,
            };
            return res.json(aboutData);
        }
        catch (error) {
            console.error('Error al obtener información "Acerca de":', error);
            return res.status(500).json({ message: 'Error al obtener información' });
        }
    },
    // Actualizar sección "Acerca de" de la empresa
    async updateAbout(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
            }
            const { bio, description, shortDescription, history, mission, vision, foundedYear, teamSize } = req.body;
            const updatedCompany = await storage.updateCompany(parseInt(id), {
                bio,
                description,
                shortDescription,
                history,
                mission,
                vision,
                foundedYear,
                teamSize,
            });
            return res.json(updatedCompany);
        }
        catch (error) {
            console.error('Error al actualizar "Acerca de":', error);
            return res.status(500).json({ message: 'Error al actualizar información' });
        }
    },
    // Obtener portafolio de la empresa
    async getPortfolio(req, res) {
        try {
            const { id } = req.params;
            const result = await storage.getCompany(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }
            const portfolioData = {
                portfolio: result.company.portfolio,
                gallery: result.company.gallery,
                videoTourUrl: result.company.videoTourUrl,
                workExperience: result.company.workExperience,
                awards: result.company.awards,
                certifications: result.company.certifications,
            };
            return res.json(portfolioData);
        }
        catch (error) {
            console.error('Error al obtener portafolio:', error);
            return res.status(500).json({ message: 'Error al obtener portafolio' });
        }
    },
    // Actualizar portafolio de la empresa
    async updatePortfolio(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
            }
            const { portfolio, gallery, videoTourUrl, workExperience, awards, certifications } = req.body;
            const updatedCompany = await storage.updateCompany(parseInt(id), {
                portfolio,
                gallery,
                videoTourUrl,
                workExperience,
                awards,
                certifications,
            });
            return res.json(updatedCompany);
        }
        catch (error) {
            console.error('Error al actualizar portafolio:', error);
            return res.status(500).json({ message: 'Error al actualizar portafolio' });
        }
    },
    // Obtener equipo de la empresa
    async getTeam(req, res) {
        try {
            const { id } = req.params;
            const result = await storage.getCompany(parseInt(id));
            if (!result) {
                return res.status(404).json({ message: 'Empresa no encontrada' });
            }
            const teamData = {
                team: result.company.team,
                teamSize: result.company.teamSize,
            };
            return res.json(teamData);
        }
        catch (error) {
            console.error('Error al obtener equipo:', error);
            return res.status(500).json({ message: 'Error al obtener equipo' });
        }
    },
    // Actualizar equipo de la empresa
    async updateTeam(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado' });
            }
            const isOwner = await storage.isCompanyOwner(parseInt(id), userId);
            if (!isOwner) {
                return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
            }
            const { team, teamSize } = req.body;
            const updatedCompany = await storage.updateCompany(parseInt(id), {
                team,
                teamSize,
            });
            return res.json(updatedCompany);
        }
        catch (error) {
            console.error('Error al actualizar equipo:', error);
            return res.status(500).json({ message: 'Error al actualizar equipo' });
        }
    },
    // Incrementar contador de vistas
    async incrementViewCount(req, res) {
        try {
            const { id } = req.params;
            await storage.companyStorage.incrementViewCount(parseInt(id));
            return res.json({ success: true });
        }
        catch (error) {
            console.error('Error al incrementar vistas:', error);
            return res.status(500).json({ message: 'Error al incrementar vistas' });
        }
    },
    // Guardar empresa en favoritos
    async saveToFavorites(req, res) {
        try {
            const { id } = req.params;
            const { save } = req.body; // true para guardar, false para quitar
            if (save) {
                await storage.companyStorage.incrementSaveCount(parseInt(id));
            }
            else {
                await storage.companyStorage.decrementSaveCount(parseInt(id));
            }
            return res.json({ success: true });
        }
        catch (error) {
            console.error('Error al guardar en favoritos:', error);
            return res.status(500).json({ message: 'Error al guardar en favoritos' });
        }
    },
};
