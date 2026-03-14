// Backend: api/webhooks/mercadopago.js
// Webhook para recibir notificaciones de Mercado Pago

const mercadopago = require('mercadopago');
const { admin, db } = require('../firebase/config');

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  sandbox: process.env.NODE_ENV !== 'production'
});

async function handleMercadoPagoWebhook(req, res) {
  try {
    const { topic, data } = req.body;

    console.log('Webhook received:', { topic, data });

    switch (topic) {
      case 'payment':
        await handlePaymentUpdate(data);
        break;
      
      case 'preapproval':
        await handlePreapprovalUpdate(data);
        break;
      
      case 'authorized_payment':
        await handleAuthorizedPayment(data);
        break;
      
      default:
        console.log('Unhandled webhook topic:', topic);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
}

async function handlePaymentUpdate(paymentData) {
  const { id, status, date_approved, payment_type } = paymentData;

  // Buscar contrato por payment_id
  const contractsSnapshot = await db.collection('contracts')
    .where('paymentId', '==', id)
    .get();

  if (contractsSnapshot.empty) {
    console.log('No contract found for payment:', id);
    return;
  }

  const contractDoc = contractsSnapshot.docs[0];
  const contract = contractDoc.data();

  let newStatus;
  let notificationData = {};

  switch (status) {
    case 'approved':
      newStatus = 'escrow_hold';
      notificationData = {
        title: '¡Pago confirmado!',
        body: 'El cliente ha pagado por tu servicio. Prepárate para la fecha acordada.',
        data: {
          type: 'payment_approved',
          contractId: contract.id,
          eventDate: contract.eventDate
        }
      };

      // Notificar a ambos
      await sendNotification(contract.artistId, notificationData);
      await sendNotification(contract.clientId, {
        title: 'Pago procesado',
        body: 'Tu pago ha sido confirmado. El dinero está protegido hasta que recibas el servicio.',
        data: {
          type: 'payment_processed',
          contractId: contract.id
        }
      });
      break;

    case 'rejected':
    case 'cancelled':
      newStatus = 'cancelled';
      notificationData = {
        title: 'Pago cancelado',
        body: 'El pago fue cancelado. Puedes intentar contratar nuevamente.',
        data: {
          type: 'payment_cancelled',
          contractId: contract.id
        }
      };

      await sendNotification(contract.clientId, notificationData);
      await sendNotification(contract.artistId, notificationData);
      break;

    case 'refunded':
      newStatus = 'refunded';
      notificationData = {
        title: 'Pago reembolsado',
        body: 'El pago ha sido reembolsado completamente.',
        data: {
          type: 'payment_refunded',
          contractId: contract.id
        }
      };

      await sendNotification(contract.clientId, notificationData);
      await sendNotification(contract.artistId, notificationData);
      break;

    case 'in_mediation':
      newStatus = 'disputed';
      notificationData = {
        title: 'Disputa iniciada',
        body: 'Se ha iniciado una disputa sobre este contrato. Nuestro equipo revisará el caso.',
        data: {
          type: 'dispute_started',
          contractId: contract.id
        }
      };

      await sendNotification(contract.artistId, notificationData);
      await sendNotification(contract.clientId, notificationData);
      break;
  }

  if (newStatus) {
    // Actualizar estado del contrato
    await contractDoc.ref.update({
      status: newStatus,
      updatedAt: new Date().toISOString(),
      paymentStatus: status,
      dateApproved: date_approved,
      paymentType: payment_type
    });

    console.log(`Contract ${contract.id} updated to status: ${newStatus}`);
  }
}

async function handleAuthorizedPayment(paymentData) {
  // Similar a handlePaymentUpdate pero para pagos autorizados
  console.log('Authorized payment:', paymentData);
  await handlePaymentUpdate(paymentData);
}

async function handlePreapprovalUpdate(preapprovalData) {
  // Para suscripciones o pagos recurrentes (futuro)
  console.log('Preapproval update:', preapprovalData);
}

async function sendNotification(userId, notification) {
  try {
    // Guardar en colección de notificaciones
    await db.collection('notifications').add({
      userId,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false
    });

    // Enviar push notification
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
        },
        android: {
          priority: 'high',
          notification: {
            color: '#7c3aed',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Middleware para verificar webhook de Mercado Pago
function verifyWebhook(req, res, next) {
  const signature = req.headers['x-signature'];
  const body = JSON.stringify(req.body);

  // En producción, verificar la firma
  if (process.env.NODE_ENV === 'production') {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }
  }

  next();
}

module.exports = {
  handleMercadoPagoWebhook,
  verifyWebhook
};
