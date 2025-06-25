/*
  Warnings:

  - You are about to drop the column `loved_products` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `saved_products` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "loved_products",
DROP COLUMN "saved_products";

-- CreateTable
CREATE TABLE "_loved" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_loved_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_saved" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_saved_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_loved_B_index" ON "_loved"("B");

-- CreateIndex
CREATE INDEX "_saved_B_index" ON "_saved"("B");

-- AddForeignKey
ALTER TABLE "_loved" ADD CONSTRAINT "_loved_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_loved" ADD CONSTRAINT "_loved_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_saved" ADD CONSTRAINT "_saved_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_saved" ADD CONSTRAINT "_saved_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
