-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_userId_fkey";

-- DropIndex
DROP INDEX "Candidate_userId_idx";

-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "userId",
ADD COLUMN     "accessToken" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "Election" ADD COLUMN     "publicToken" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "hasVoted" BOOLEAN NOT NULL DEFAULT false,
    "votedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicVote" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "PublicVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_electionId_idx" ON "Participant"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_electionId_email_key" ON "Participant"("electionId", "email");

-- CreateIndex
CREATE INDEX "VerificationCode_participantId_idx" ON "VerificationCode"("participantId");

-- CreateIndex
CREATE INDEX "PublicVote_electionId_idx" ON "PublicVote"("electionId");

-- CreateIndex
CREATE INDEX "PublicVote_candidateId_idx" ON "PublicVote"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_accessToken_key" ON "Candidate"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Election_publicToken_key" ON "Election"("publicToken");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicVote" ADD CONSTRAINT "PublicVote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicVote" ADD CONSTRAINT "PublicVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

