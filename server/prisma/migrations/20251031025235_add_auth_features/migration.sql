-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '12345',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
