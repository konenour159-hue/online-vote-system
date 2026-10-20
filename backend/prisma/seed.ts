import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Données de DÉVELOPPEMENT uniquement (mot de passe connu : ne jamais lancer en production).
 * Crée un administrateur et un vote d'exemple ouvert avec trois candidats.
 */
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const roles: Record<string, string> = {};
  for (const name of ['SUPER_ADMIN', 'ELECTION_ADMIN', 'VOTER']) {
    roles[name] = (await prisma.role.upsert({ where: { name }, update: {}, create: { name } })).id;
  }
  console.log('✅ Roles created');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@votingsystem.com' },
    update: {},
    create: {
      email: 'admin@votingsystem.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: await bcrypt.hash('Admin@12345', 12),
      roleId: roles.SUPER_ADMIN,
      emailVerified: true
    }
  });
  const profile = await prisma.electionAdmin.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id } });
  console.log('✅ Admin user created');

  await prisma.election.create({
    data: {
      title: 'Élection du responsable du groupe 2026',
      description: 'Choisissez la personne qui dirigera le groupe cette année.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      adminId: profile.id,
      positions: {
        create: {
          title: 'Choix',
          order: 1,
          maxVotes: 1,
          candidates: {
            create: ['Alice Johnson', 'Bob Smith', 'Carol White'].map((name, i) => ({
              name,
              bio: `Candidature de ${name}`,
              order: i + 1
            }))
          }
        }
      }
    }
  });
  console.log('✅ Sample vote created');
  console.log('✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
