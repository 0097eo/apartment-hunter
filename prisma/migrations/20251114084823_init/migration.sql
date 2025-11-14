/*
  Warnings:

  - A unique constraint covering the columns `[user_id,listing_id]` on the table `SavedProperty` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SavedProperty_user_id_listing_id_key" ON "SavedProperty"("user_id", "listing_id");
