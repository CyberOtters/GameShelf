/*
  Warnings:

  - You are about to drop the column `wishlist` on the `Game` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'WISHLIST';

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "wishlist",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;
