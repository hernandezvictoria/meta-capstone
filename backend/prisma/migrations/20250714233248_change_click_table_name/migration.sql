/*
  Warnings:

  - You are about to drop the `Click` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_user_id_fkey";

-- DropTable
DROP TABLE "Click";

-- CreateTable
CREATE TABLE "UserProductInteraction" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "click_time" TIMESTAMP(3) NOT NULL,
    "click_type" "ClickType" NOT NULL,

    CONSTRAINT "UserProductInteraction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserProductInteraction" ADD CONSTRAINT "UserProductInteraction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ProductInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProductInteraction" ADD CONSTRAINT "UserProductInteraction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
