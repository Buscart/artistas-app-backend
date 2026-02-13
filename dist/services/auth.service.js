import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
// Los tipos ahora están definidos en src/types/user.types.ts
export class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class AuthService {
    static async login(credentials) {
        const { email, password } = credentials;
        console.log(`🔍 Intentando login para el usuario: ${email}`);
        try {
            // Buscar usuario por email
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);
            if (!user) {
                console.log('❌ Usuario no encontrado');
                throw new AuthenticationError('Credenciales inválidas');
            }
            console.log(`✅ Usuario encontrado: ${user.id}`);
            // Verificar si el usuario tiene contraseña
            const userWithPassword = user;
            if (!userWithPassword.password) {
                console.log('❌ El usuario no tiene contraseña configurada');
                throw new AuthenticationError('Credenciales inválidas');
            }
            console.log('🔑 Verificando contraseña...');
            // Verificar contraseña
            const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
            console.log(`🔑 Resultado de la comparación de contraseña: ${isPasswordValid}`);
            if (!isPasswordValid) {
                console.log('❌ Contraseña incorrecta');
                throw new AuthenticationError('Credenciales inválidas');
            }
            // Crear el objeto de usuario con la contraseña
            const userData = {
                ...user,
                password: userWithPassword.password
            };
            console.log('✅ Contraseña válida');
            // Actualizar última conexión
            await db
                .update(users)
                .set({ lastActive: new Date() })
                .where(eq(users.id, userData.id));
            // Generar token JWT
            const token = this.generateToken(userData);
            // Devolver token y usuario (sin contraseña)
            return {
                token,
                user: this.sanitizeUser(userData)
            };
        }
        catch (error) {
            console.error('❌ Error en el login:', error);
            throw error;
        }
    }
    static async register(data) {
        const { email, password, firstName, lastName, userType = 'general', city, phone } = data;
        // Verificar si el usuario ya existe
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existingUser) {
            throw new AuthenticationError('El correo electrónico ya está en uso');
        }
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
        const userId = uuidv4();
        const now = new Date();
        // Extraer nombre del email si no se proporciona firstName
        const emailUsername = email.split('@')[0];
        const defaultFirstName = firstName || emailUsername;
        // Crear objeto con los datos del nuevo usuario
        const newUserData = {
            id: userId,
            email,
            password: hashedPassword,
            firstName: defaultFirstName,
            lastName: lastName || null,
            userType: userType,
            city: city || null,
            phone: phone || null,
            isVerified: false,
            isAvailable: true,
            rating: '0.00',
            totalReviews: 0,
            fanCount: 0,
            preferences: {},
            settings: {},
            lastActive: now,
            createdAt: now,
            updatedAt: now,
            // Campos de onboarding - usuario nuevo necesita completar onboarding
            emailVerified: false,
            onboardingCompleted: false,
            onboardingStep: 'user-type-selection',
            onboardingStartedAt: now,
            // Campos con valores por defecto
            displayName: null,
            profileImageUrl: null,
            coverImageUrl: null,
            bio: null,
            address: null,
            website: null,
            socialMedia: {},
            isFeatured: false,
            username: null,
            shortBio: null,
            interestedCategories: null,
            interestedTags: null,
            emailVerificationToken: null,
            emailVerificationExpires: null,
            onboardingData: null,
            onboardingCompletedAt: null
        };
        // Insertar nuevo usuario
        const [newUser] = await db
            .insert(users)
            .values(newUserData)
            .returning();
        // Crear UserData a partir del nuevo usuario
        const userData = {
            ...newUser,
            password: hashedPassword
        };
        // Generar token JWT
        const token = this.generateToken(userData);
        // Devolver token y usuario (sin contraseña)
        return {
            token,
            user: this.sanitizeUser(userData)
        };
    }
    static async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }
    static sanitizeUser(user) {
        if (!user) {
            throw new Error('User is required');
        }
        // Crear un objeto con las propiedades del usuario sin la contraseña
        const { password: _, ...userData } = user;
        return userData;
    }
    static generateToken(user) {
        if (!user || !user.id || !user.email || !user.userType) {
            throw new Error('Invalid user data for token generation');
        }
        const payload = {
            id: user.id,
            email: user.email,
            userType: user.userType
        };
        return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
}
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
AuthService.JWT_EXPIRES_IN = '7d';
AuthService.SALT_ROUNDS = 10;
