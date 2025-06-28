/*
  Warnings:

  - The `concerns` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `skin_type` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "concerns",
ADD COLUMN     "concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "skin_type",
ADD COLUMN     "skin_type" TEXT[] DEFAULT ARRAY[]::TEXT[];
