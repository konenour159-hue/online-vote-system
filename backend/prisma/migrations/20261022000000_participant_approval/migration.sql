-- AlterTable
ALTER TABLE "Election" ADD COLUMN     "accessMode" TEXT NOT NULL DEFAULT 'APPROVAL';

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "requestMessage" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "tokenHash" TEXT;

-- CreateIndex
CREATE INDEX "Participant_electionId_status_idx" ON "Participant"("electionId", "status");

