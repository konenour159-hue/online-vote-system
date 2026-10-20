import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { AuthenticationError, UserError } from '../utils/errors.js';
import { JwtPayload } from '../types/index.js';

export class AuthService {
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Le mot de passe est correct : on peut maintenant dire pourquoi l'accès est refusé sans aider un inconnu.
    this.assertCanSignIn(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens (le jeton de renouvellement est conservé pour pouvoir le vérifier et le révoquer)
    const tokens = this.generateTokens(user.id, user.email, user.roleId);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.formatUser(user),
      ...tokens
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt_refresh_secret) as JwtPayload;

      const stored = await prisma.refreshToken.findUnique({ where: { token } });
      if (!stored) {
        throw new AuthenticationError('Refresh token not found');
      }
      if (new Date() > stored.expiresAt) {
        await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
        throw new AuthenticationError('Refresh token expired');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        throw new AuthenticationError('Invalid refresh token');
      }
      this.assertCanSignIn(user);

      // Rotation : un jeton de renouvellement ne sert qu'une fois.
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      const tokens = this.generateTokens(user.id, user.email, user.roleId);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof UserError) throw error;
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  /** Un compte en attente, refusé ou désactivé ne peut pas ouvrir de session. */
  private assertCanSignIn(user: { approvalStatus: string; isActive: boolean }) {
    if (user.approvalStatus === 'PENDING') {
      throw new UserError(403, 'Votre inscription est en attente de validation par un administrateur. Vous recevrez un e-mail dès qu’elle sera traitée.');
    }
    if (user.approvalStatus === 'REJECTED') {
      throw new UserError(403, 'Votre demande d’accès n’a pas été acceptée. Contactez l’administrateur de la plateforme.');
    }
    if (!user.isActive) {
      throw new UserError(403, 'Ce compte est désactivé. Contactez l’administrateur de la plateforme.');
    }
  }

  private async storeRefreshToken(userId: string, token: string) {
    await prisma.refreshToken.create({
      data: { token, userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
  }

  private generateTokens(userId: string, email: string, roleId: string) {
    const payload: JwtPayload = { userId, email, roleId };

    const accessToken = jwt.sign(payload, config.jwt_access_secret, {
      expiresIn: config.jwt_access_expiry as jwt.SignOptions['expiresIn']
    });

    const refreshToken = jwt.sign(payload, config.jwt_refresh_secret, {
      expiresIn: config.jwt_refresh_expiry as jwt.SignOptions['expiresIn'],
      // Identifiant unique : deux jetons émis dans la même seconde ne doivent jamais être identiques
      jwtid: crypto.randomUUID()
    });

    return { accessToken, refreshToken };
  }

  private formatUser(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
