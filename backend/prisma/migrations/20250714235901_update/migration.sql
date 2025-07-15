/*
  Warnings:

  - You are about to drop the column `click_time` on the `UserProductInteraction` table. All the data in the column will be lost.
  - You are about to drop the column `click_type` on the `UserProductInteraction` table. All the data in the column will be lost.
  - Added the required column `interaction_time` to the `UserProductInteraction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interaction_type` to the `UserProductInteraction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('like', 'dislike', 'save', 'remove_like', 'remove_dislike', 'remove_save', 'open_modal');

-- AlterTable
ALTER TABLE "UserProductInteraction" DROP COLUMN "click_time",
DROP COLUMN "click_type",
ADD COLUMN     "interaction_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "interaction_type" "InteractionType" NOT NULL;

-- DropEnum
DROP TYPE "ClickType";
