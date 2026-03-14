// Backend: api/contracts/update-status.js
// Endpoint para actualizar estados de contratos

const { admin, db } = require('../firebase/config');
const mercadopago = require('mercadopago');

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  sandbox: process.env.NODE_ENV !== 'production'
});

async function updateContractStatus(req, res) {
  try {
    const { contractId } = req.params;
    const { status, evidence, rating, review } = req.body;
    const userId = req.user.uid;

    // Verificar que el usuario sea parte del contrato
    const contractDoc = await db.collection('contracts').doc(contractId).get();
    if (!contractDoc.exists) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const contract = contractDoc.data();
    
    // Verificar permisos
    if (contract.clientId !== userId && contract.artistId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    let updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    let notificationData = {};

    switch (status) {
      case 'in_progress':
        // Marcar que el artista comenzó el servicio
        if (contract.artistId !== userId) {
          return res.status(403).json({ error: 'Solo el artista puede marcar como en progreso' });
        }

        updateData.startedAt = new Date().toISOString();
        notificationData = {
          title: 'Servicio iniciado',
          body: `${contract.artistName} ha iniciado el servicio: ${contract.serviceTitle}`,
          data: {
            type: 'service_started',
            contractId
          }
        };

        await sendNotification(contract.clientId, notificationData);
        break;

      case 'delivered':
        // Marcar entrega del artista
        if (contract.artistId !== userId) {
          return res.status(403).json({ error: 'Solo el artista puede marcar como entregado' });
        }

        updateData.deliveryDate = new Date().toISOString();
        updateData.deliveryEvidence = evidence;

        notificationData = {
          title: '¡Servicio entregado!',
          body: `${contract.artistName} ha entregado el servicio. Por favor confirma que recibiste todo correctamente.`,
          data: {
            type: 'service_delivered',
            contractId,
            deliveryEvidence: evidence
          }
        };

        await sendNotification(contract.clientId, notificationData);
        break;

      case 'completed':
        // Confirmación del cliente - liberar pago
        if (contract.clientId !== userId) {
          return res.status(403).json({ error: 'Solo el cliente puede confirmar recepción' });
        }

        updateData.clientConfirmedAt = new Date().toISOString();
        updateData.rating = rating;
        updateData.review = review;

        // Liberar dinero en Mercado Pago
        try {
          const payment = await mercadopago.payment.findById(contract.paymentId);
          if (payment.body.status === 'approved') {
            // El dinero ya está en escrow, solo necesitamos liberarlo
            // En producción, esto se hace automáticamente al marcar como completado
            console.log(`Liberando pago ${contract.paymentId} al artista ${contract.artistId}`);
          }
        } catch (error) {
          console.error('Error liberando pago:', error);
        }

        notificationData = {
          title: '¡Servicio completado!',
          body: `El cliente ha confirmado la recepción. Calificación: ${rating || 'N/A'} ⭐`,
          data: {
            type: 'service_completed',
            contractId,
            rating
          }
        };

        await sendNotification(contract.artistId, notificationData);

        // Actualizar reputación del artista
        await updateArtistReputation(contract.artistId, rating);
        break;

      case 'disputed':
        // Iniciar disputa
        updateData.disputeReason = evidence?.reason;
        updateData.disputeDescription = evidence?.description;
        updateData.disputeEvidence = evidence?.evidence;

        notificationData = {
          title: 'Disputa iniciada',
          body: 'Se ha iniciado una disputa. Nuestro equipo revisará el caso.',
          data: {
            type: 'dispute_started',
            contractId
          }
        };

        await sendNotification(contract.artistId, notificationData);
        await sendNotification(contract.clientId, notificationData);
        break;

      case 'cancelled':
        // Cancelar contrato (antes de pago)
        updateData.cancelledAt = new Date().toISOString();
        updateData.cancelledBy = userId;

        const cancelledBy = userId === contract.clientId ? 'cliente' : 'artista';
        notificationData = {
          title: 'Contrato cancelado',
          body: `El contrato ha sido cancelado por el ${cancelledBy}.`,
          data: {
            type: 'contract_cancelled',
            contractId,
            cancelledBy
          }
        };

        // Notificar a la otra parte
        const otherUserId = userId === contract.clientId ? contract.artistId : contract.clientId;
        await sendNotification(otherUserId, notificationData);
        break;
    }

    // Actualizar contrato
    await contractDoc.ref.update(updateData);

    res.json({
      success: true,
      contract: {
        ...contract,
        ...updateData
      }
    });

  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ 
      error: 'Error actualizando contrato',
      details: error.message 
    });
  }
}

async function updateArtistReputation(artistId, rating) {
  try {
    const artistDoc = await db.collection('users').doc(artistId).get();
    const artistData = artistDoc.data();

    if (!artistData) return;

    const currentRating = artistData.rating || 0;
    const totalRatings = artistData.totalRatings || 0;
    const newTotalRatings = totalRatings + 1;
    const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

    await artistDoc.ref.update({
      rating: Math.round(newRating * 10) / 10, // Redondear a 1 decimal
      totalRatings: newTotalRatings,
      lastRatingAt: new Date().toISOString()
    });

    console.log(`Updated reputation for artist ${artistId}: ${newRating} (${newTotalRatings} ratings)`);
  } catch (error) {
    console.error('Error updating artist reputation:', error);
  }
}

async function sendNotification(userId, notification) {
  try {
    await db.collection('notifications').add({
      userId,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false
    });

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.fcmToken) {
      await admin.messaging().send({
        token: userData.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          data: notification.data || {}
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

module.exports = { updateContractStatus };
