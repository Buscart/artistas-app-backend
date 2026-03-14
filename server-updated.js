// Backend: server.js (actualizado con contratos)
// Servidor principal con endpoints de contratos

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');

// Importar middlewares y endpoints existentes
const { authMiddleware } = require('./middleware/auth');
const { verifyWebhook } = require('./api/webhooks/mercadopago');

// Importar nuevos endpoints de contratos
const { createContract } = require('./api/contracts/create');
const { updateContractStatus } = require('./api/contracts/update-status');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://buscart.com.co', 'exp://192.168.1.100:8081'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}));

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de autenticación
app.use('/api/contracts', authMiddleware);
app.use('/api/users', authMiddleware);
app.use('/api/services', authMiddleware);
app.use('/api/portfolio', authMiddleware);

// Endpoints existentes (mantener los que ya tienes)
app.use('/api/auth', require('./api/auth'));
app.use('/api/users', require('./api/users'));
app.use('/api/services', require('./api/services'));
app.use('/api/portfolio', require('./api/portfolio'));
app.use('/api/artists', require('./api/artists'));

// === NUEVOS ENDPOINTS DE VERIFICACIÓN ===
app.use('/api/verification', require('./src/routes/verification'));

// === NUEVOS ENDPOINTS DE CONTRATOS ===

// Crear contrato (contratación inmediata)
app.post('/api/contracts/create', createContract);

// Actualizar estado de contrato
app.patch('/api/contracts/:contractId/status', updateContractStatus);

// Obtener contratos del usuario
app.get('/api/contracts', async (req, res) => {
  try {
    const { type = 'client' } = req.query; // 'client' o 'artist'
    const userId = req.user.uid;
    
    let query;
    if (type === 'client') {
      query = db.collection('contracts').where('clientId', '==', userId);
    } else {
      query = db.collection('contracts').where('artistId', '==', userId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const contracts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(contracts);
  } catch (error) {
    console.error('Error getting contracts:', error);
    res.status(500).json({ error: 'Error obteniendo contratos' });
  }
});

// Obtener contrato específico
app.get('/api/contracts/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.uid;

    const contractDoc = await db.collection('contracts').doc(contractId).get();
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const contract = contractDoc.data();
    
    // Verificar que el usuario sea parte del contrato
    if (contract.clientId !== userId && contract.artistId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({
      id: contractDoc.id,
      ...contract
    });
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({ error: 'Error obteniendo contrato' });
  }
});

// Obtener preferencia de pago
app.get('/api/contracts/:contractId/payment', async (req, res) => {
  try {
    const { contractId } = req.params;
    const userId = req.user.uid;

    const contractDoc = await db.collection('contracts').doc(contractId).get();
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const contract = contractDoc.data();
    
    if (contract.clientId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Obtener preferencia de Mercado Pago
    const mercadopago = require('mercadopago');
    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
      sandbox: process.env.NODE_ENV !== 'production'
    });

    const preference = await mercadopago.preferences.findById(contract.mercadoPagoPreferenceId);
    
    res.json({
      id: preference.body.id,
      initPoint: preference.body.init_point,
      sandboxMode: process.env.NODE_ENV !== 'production'
    });
  } catch (error) {
    console.error('Error getting payment preference:', error);
    res.status(500).json({ error: 'Error obteniendo preferencia de pago' });
  }
});

// === WEBHOOKS ===

// Webhook de Mercado Pago (con verificación)
app.post('/api/webhooks/mercadopago', verifyWebhook, require('./api/webhooks/mercadopago').handleMercadoPagoWebhook);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Mercado Pago: ${process.env.NODE_ENV !== 'production' ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log(`🔗 Webhook URL: ${process.env.API_URL}/api/webhooks/mercadopago`);
});

module.exports = app;
