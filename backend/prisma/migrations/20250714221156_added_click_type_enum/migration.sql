/*
  Warnings:

  - Added the required column `click_type` to the `Click` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClickType" AS ENUM ('toggle_like', 'toggle_dislike', 'toggle_save', 'open_modal');

-- AlterTable
ALTER TABLE "Click" ADD COLUMN     "click_type" "ClickType" NOT NULL;
