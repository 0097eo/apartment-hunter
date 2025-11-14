/*
  Warnings:

  - You are about to drop the column `property_ids` on the `Comparison` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `Viewing` table. All the data in the column will be lost.
  - You are about to drop the `Property` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PropertyTag` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `listing_id` to the `Viewing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Property" DROP CONSTRAINT "Property_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyTag" DROP CONSTRAINT "PropertyTag_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyTag" DROP CONSTRAINT "PropertyTag_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Viewing" DROP CONSTRAINT "Viewing_property_id_fkey";

-- DropIndex
DROP INDEX "public"."Viewing_property_id_idx";

-- AlterTable
ALTER TABLE "Comparison" DROP COLUMN "property_ids",
ADD COLUMN     "listing_ids" TEXT[];

-- AlterTable
ALTER TABLE "Viewing" DROP COLUMN "property_id",
ADD COLUMN     "listing_id" TEXT NOT NULL,
ADD COLUMN     "saved_property_id" TEXT;

-- DropTable
DROP TABLE "public"."Property";

-- DropTable
DROP TABLE "public"."PropertyTag";

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "county" VARCHAR(100) NOT NULL,
    "zip_code" VARCHAR(20),
    "price" DECIMAL(12,2) NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "square_feet" INTEGER,
    "property_type" "PropertyType" NOT NULL,
    "listing_url" TEXT,
    "image_urls" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProperty" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "pros" TEXT[],
    "cons" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPropertyTag" (
    "saved_property_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPropertyTag_pkey" PRIMARY KEY ("saved_property_id","tag_id")
);

-- CreateIndex
CREATE INDEX "Listing_user_id_idx" ON "Listing"("user_id");

-- CreateIndex
CREATE INDEX "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX "Listing_county_idx" ON "Listing"("county");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");

-- CreateIndex
CREATE INDEX "SavedProperty_user_id_idx" ON "SavedProperty"("user_id");

-- CreateIndex
CREATE INDEX "SavedProperty_listing_id_idx" ON "SavedProperty"("listing_id");

-- CreateIndex
CREATE INDEX "SavedProperty_status_idx" ON "SavedProperty"("status");

-- CreateIndex
CREATE INDEX "Viewing_listing_id_idx" ON "Viewing"("listing_id");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_saved_property_id_fkey" FOREIGN KEY ("saved_property_id") REFERENCES "SavedProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPropertyTag" ADD CONSTRAINT "SavedPropertyTag_saved_property_id_fkey" FOREIGN KEY ("saved_property_id") REFERENCES "SavedProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPropertyTag" ADD CONSTRAINT "SavedPropertyTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
