/*
  Warnings:

  - You are about to drop the column `ingredients` on the `ProductInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductInfo" DROP COLUMN "ingredients";

-- CreateTable
CREATE TABLE "_ingredients" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ingredients_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ingredients_B_index" ON "_ingredients"("B");

-- AddForeignKey
ALTER TABLE "_ingredients" ADD CONSTRAINT "_ingredients_A_fkey" FOREIGN KEY ("A") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ingredients" ADD CONSTRAINT "_ingredients_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
