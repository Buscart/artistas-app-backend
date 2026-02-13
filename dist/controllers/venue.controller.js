// Stub temporal: funcionalidades de venues deshabilitadas por modelos ausentes
export const venueController = {
    async getAll(req, res) {
        return res.status(501).json({ message: 'Venue: no implementado temporalmente' });
    },
    async getById(req, res) {
        return res.status(501).json({ message: 'Venue: no implementado temporalmente' });
    }
};
