// Backend: api/contracts/create.js
// Endpoint para crear contratos con Mercado Pago

const mercadopago = require('mercadopago');
const { auth } = require('../firebase/config');

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  sandbox: process.env.NODE_ENV !== 'production'
});

// Comisión de la plataforma (15%)
const PLATFORM_COMMISSION = 0.15;

async function createContract(req, res) {
  try {
    const {
      artistId,
      serviceTitle,
      serviceDescription,
      price,
      currency = 'COP',
      eventDate,
      eventLocation,
      technicalSpecs,
      metadata = {}
    } = req.body;

    // Verificar usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener información del artista
    const artistDoc = await db.collection('users').doc(artistId).get();
    if (!artistDoc.exists) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    const artistData = artistDoc.data();
    if (!artistData.mpUserId) {
      return res.status(400).json({ 
        error: 'El artista no tiene configurado Mercado Pago' 
      });
    }

    // Calcular comisiones
    const commissionAmount = Math.round(price * PLATFORM_COMMISSION);
    const netAmount = price - commissionAmount;

    // Crear preferencia de pago en Mercado Pago
    const preference = await mercadopago.preferences.create({
      items: [{
        id: `contract_${Date.now()}`,
        title: serviceTitle,
        description: serviceDescription || `Contratación: ${serviceTitle}`,
        unit_price: price,
        quantity: 1,
        currency_id: currency,
        category_id: 'services'
      }],
      
      // Configuración de split de pagos
      marketplace_fee: commissionAmount,
      binary_mode: true, // Solo pagos aprobados
      auto_return: 'approved',
      
      // Vincular al artista
      collector_id: artistData.mpUserId,
      
      // URLs de retorno
      back_urls: {
        success: `${process.env.FRONTEND_URL}/contracts/success`,
        failure: `${process.env.FRONTEND_URL}/contracts/failure`,
        pending: `${process.env.FRONTEND_URL}/contracts/pending`
      },
      
      // Notificaciones
      notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      
      // Metadata
      metadata: {
        contract_type: 'immediate',
        artist_id: artistId,
        client_id: user.uid,
        event_date: eventDate,
        event_location: eventLocation,
        technical_specs: technicalSpecs,
        ...metadata
      }
    });

    // Guardar contrato en base de datos
    const contractData = {
      id: preference.body.id,
      clientId: user.uid,
      artistId,
      artistName: artistData.displayName || artistData.name,
      clientName: user.displayName || user.email,
      artistAvatar: artistData.photoURL,
      clientAvatar: user.photoURL,
      serviceTitle,
      serviceDescription,
      price,
      currency,
      commission: commissionAmount,
      netAmount,
      eventDate,
      eventLocation,
      technicalSpecs,
      status: 'pending_payment',
      paymentId: preference.body.id,
      mercadoPagoPreferenceId: preference.body.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata
    };

    await db.collection('contracts').doc(preference.body.id).set(contractData);

    // Enviar notificación al artista
    await sendNotification(artistId, {
      title: '¡Nueva contratación!',
      body: `${user.displayName || 'Un cliente'} te ha contratado: ${serviceTitle}`,
      data: {
        type: 'new_contract',
        contractId: preference.body.id
      }
    });

    res.json({
      success: true,
      preference: {
        id: preference.body.id,
        initPoint: preference.body.init_point,
        sandboxMode: process.env.NODE_ENV !== 'production'
      },
      contract: contractData
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ 
      error: 'Error al crear contrato',
      details: error.message 
    });
  }
}

// Función auxiliar para enviar notificaciones
async function sendNotification(userId, notification) {
  try {
    // Guardar notificación en Firestore
    await db.collection('notifications').add({
      userId,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false
    });

    // Enviar push notification si el usuario tiene token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.fcmToken) {
      const admin = require('firebase-admin');
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          data: notification.data
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

module.exports = { createContract };
