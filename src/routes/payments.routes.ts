import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { payments, userContracts } from '../schema/contracts.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware as any);

// Crear un nuevo pago para un contrato
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const { contractId, paymentMethod, amount } = req.body;

    if (!contractId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'contractId, paymentMethod y amount son requeridos'
      });
    }

    // Verificar que el contrato existe y pertenece al usuario
    const [contract] = await db.select()
      .from(userContracts)
      .where(and(
        eq(userContracts.id, contractId),
        eq(userContracts.userId, userId)
      ))
      .limit(1);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }

    if (contract.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Este contrato ya fue pagado' });
    }

    // Calcular comisión de plataforma (10%)
    const platformFee = parseFloat(amount) * 0.10;
    const artistAmount = parseFloat(amount) - platformFee;

    // Crear el registro de pago
    const [newPayment] = await db.insert(payments).values({
      contractId,
      userId,
      amount: amount.toString(),
      paymentMethod,
      status: 'processing',
      metadata: {
        clientIp: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).returning();

    // Actualizar el contrato con la información del pago
    await db.update(userContracts)
      .set({
        status: 'awaiting_payment',
        paymentStatus: 'processing',
        platformFee: platformFee.toString(),
        artistAmount: artistAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(userContracts.id, contractId));

    // Simular procesamiento de pago (en producción usaría un proveedor real)
    // Por ahora, marcamos como completado después de validación básica
    setTimeout(async () => {
      try {
        await db.update(payments)
          .set({
            status: 'completed',
            paidAt: new Date(),
            providerTransactionId: `TXN_${Date.now()}_${contractId}`,
            updatedAt: new Date()
          })
          .where(eq(payments.id, newPayment.id));

        await db.update(userContracts)
          .set({
            status: 'paid',
            paymentStatus: 'completed',
            updatedAt: new Date()
          })
          .where(eq(userContracts.id, contractId));
      } catch (err) {
        console.error('Error procesando pago:', err);
      }
    }, 2000);

    return res.status(201).json({
      success: true,
      message: 'Pago iniciado correctamente',
      data: {
        paymentId: newPayment.id,
        status: 'processing',
        amount,
        platformFee,
        artistAmount
      }
    });

  } catch (error: any) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    });
  }
});

// Obtener estado de pago de un contrato
router.get('/contract/:contractId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const contractId = parseInt(req.params.contractId);

    // Obtener pagos del contrato
    const contractPayments = await db.select()
      .from(payments)
      .where(eq(payments.contractId, contractId))
      .orderBy(desc(payments.createdAt));

    // Verificar que el usuario tiene acceso al contrato
    const [contract] = await db.select()
      .from(userContracts)
      .where(eq(userContracts.id, contractId))
      .limit(1);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }

    if (contract.userId !== userId && contract.artistId !== userId) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a este contrato' });
    }

    return res.json({
      success: true,
      data: {
        contractId,
        paymentStatus: contract.paymentStatus,
        payments: contractPayments
      }
    });

  } catch (error: any) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el estado del pago',
      error: error.message
    });
  }
});

// Obtener historial de pagos del usuario
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const userPayments = await db.select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(50);

    return res.json({
      success: true,
      data: userPayments
    });

  } catch (error: any) {
    console.error('Error getting payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pagos',
      error: error.message
    });
  }
});

// Firmar contrato (cliente o artista)
router.post('/contract/:contractId/sign', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const contractId = parseInt(req.params.contractId);
    const { acceptTerms } = req.body;

    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'Debes aceptar los términos del contrato'
      });
    }

    // Obtener el contrato
    const [contract] = await db.select()
      .from(userContracts)
      .where(eq(userContracts.id, contractId))
      .limit(1);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }

    const isClient = contract.userId === userId;
    const isArtist = contract.artistId === userId;

    if (!isClient && !isArtist) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a este contrato' });
    }

    // Actualizar la firma correspondiente
    const updateData: any = {
      updatedAt: new Date()
    };

    if (isClient) {
      if (contract.clientSigned) {
        return res.status(400).json({ success: false, message: 'Ya has firmado este contrato' });
      }
      updateData.clientSigned = true;
      updateData.clientSignedAt = new Date();
    } else {
      if (contract.artistSigned) {
        return res.status(400).json({ success: false, message: 'Ya has firmado este contrato' });
      }
      updateData.artistSigned = true;
      updateData.artistSignedAt = new Date();
    }

    // Si ambos han firmado, confirmar el contrato
    const bothSigned = (isClient && contract.artistSigned) || (isArtist && contract.clientSigned);
    if (bothSigned) {
      updateData.status = 'confirmed';
    }

    await db.update(userContracts)
      .set(updateData)
      .where(eq(userContracts.id, contractId));

    return res.json({
      success: true,
      message: isClient ? 'Contrato firmado como cliente' : 'Contrato firmado como artista',
      data: {
        contractId,
        clientSigned: isClient ? true : contract.clientSigned,
        artistSigned: isArtist ? true : contract.artistSigned,
        fullyExecuted: bothSigned
      }
    });

  } catch (error: any) {
    console.error('Error signing contract:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al firmar el contrato',
      error: error.message
    });
  }
});

// Obtener detalles del contrato con términos
router.get('/contract/:contractId/details', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    const contractId = parseInt(req.params.contractId);

    const [contract] = await db.select()
      .from(userContracts)
      .where(eq(userContracts.id, contractId))
      .limit(1);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }

    if (contract.userId !== userId && contract.artistId !== userId) {
      return res.status(403).json({ success: false, message: 'No tienes acceso a este contrato' });
    }

    // Generar términos del contrato si no existen
    const terms = contract.contractTerms || generateContractTerms(contract);

    return res.json({
      success: true,
      data: {
        ...contract,
        contractTerms: terms,
        isClient: contract.userId === userId,
        isArtist: contract.artistId === userId
      }
    });

  } catch (error: any) {
    console.error('Error getting contract details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los detalles del contrato',
      error: error.message
    });
  }
});

// Función para generar términos del contrato
function generateContractTerms(contract: any): string {
  const serviceDate = contract.serviceDate ? new Date(contract.serviceDate).toLocaleDateString('es-CO') : 'Por definir';
  const amount = contract.amount ? parseFloat(contract.amount).toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : 'Por definir';

  return `
CONTRATO DE PRESTACIÓN DE SERVICIOS

1. PARTES
Este contrato se celebra entre el CLIENTE (contratante) y el ARTISTA (prestador del servicio) a través de la plataforma BuscartPro.

2. OBJETO DEL CONTRATO
El ARTISTA se compromete a prestar el servicio de: ${contract.serviceName}
${contract.description ? `Descripción: ${contract.description}` : ''}

3. FECHA Y LUGAR
Fecha del servicio: ${serviceDate}
${contract.metadata?.location ? `Ubicación: ${contract.metadata.location}` : ''}

4. VALOR Y FORMA DE PAGO
Valor total del servicio: ${amount}
El pago se realizará a través de la plataforma BuscartPro.

5. OBLIGACIONES DEL ARTISTA
- Prestar el servicio acordado en la fecha y hora establecidas
- Cumplir con los estándares de calidad profesional
- Comunicar cualquier inconveniente con anticipación

6. OBLIGACIONES DEL CLIENTE
- Realizar el pago acordado
- Proporcionar las condiciones necesarias para la prestación del servicio
- Comunicar cualquier cambio con anticipación

7. CANCELACIÓN
- Cancelación con más de 48 horas: Reembolso del 100%
- Cancelación entre 24-48 horas: Reembolso del 50%
- Cancelación con menos de 24 horas: Sin reembolso

8. RESOLUCIÓN DE CONFLICTOS
Cualquier disputa será mediada por BuscartPro. En caso de no llegar a acuerdo, se someterá a las leyes colombianas.

Al firmar este contrato, ambas partes aceptan los términos y condiciones aquí establecidos.

Fecha de generación: ${new Date().toLocaleDateString('es-CO')}
  `.trim();
}

export default router;
