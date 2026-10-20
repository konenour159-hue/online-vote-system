import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { validatePassword, validateEmail } from '../utils/validation.js';

/**
 * Crée (ou met à jour) le premier compte SUPER_ADMIN et les rôles de base.
 * À lancer une fois après le déploiement, sans données de démonstration :
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create --workspace=backend
 * Le mot de passe n'est jamais affiché.
 */
const main = async (): Promise<void> => {
  const email = validateEmail.parse(process.env.ADMIN_EMAIL);
  const password = validatePassword.parse(process.env.ADMIN_PASSWORD);
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'Genies';

  const roles: Record<string, string> = {};
  for (const name of ['SUPER_ADMIN', 'ELECTION_ADMIN', 'VOTER']) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    roles[name] = role.id;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashed = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.user.update({ where: { email }, data: { password: hashed, roleId: roles.SUPER_ADMIN, isActive: true, approvalStatus: 'APPROVED' } });
    console.log(`Compte existant mis à jour : ${email} est maintenant SUPER_ADMIN.`);
  } else {
    await prisma.user.create({
      data: { email, firstName, lastName, password: hashed, roleId: roles.SUPER_ADMIN, emailVerified: true }
    });
    console.log(`Compte SUPER_ADMIN créé : ${email}`);
  }
};

main()
  .catch((err) => {
    console.error('Échec :', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
