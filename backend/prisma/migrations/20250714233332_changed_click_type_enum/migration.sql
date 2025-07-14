/*
  Warnings:

  - The values [toggle_like,toggle_dislike,toggle_save] on the enum `ClickType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClickType_new" AS ENUM ('like', 'dislike', 'save', 'remove_like', 'remove_dislike', 'remove_save', 'open_modal');
ALTER TABLE "UserProductInteraction" ALTER COLUMN "click_type" TYPE "ClickType_new" USING ("click_type"::text::"ClickType_new");
ALTER TYPE "ClickType" RENAME TO "ClickType_old";
ALTER TYPE "ClickType_new" RENAME TO "ClickType";
DROP TYPE "ClickType_old";
COMMIT;
