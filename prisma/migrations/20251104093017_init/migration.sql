-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'maisonette', 'bungalow', 'other');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('saved', 'interested', 'viewed', 'applied', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(128),
    "name" VARCHAR(100),
    "google_id" TEXT,
    "profile_picture" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'local',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
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
    "status" "PropertyStatus" NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "pros" TEXT[],
    "cons" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viewing" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TIMESTAMP(3),
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "location_notes" TEXT,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "viewing_notes" TEXT,
    "rating" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viewing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "property_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyTag" (
    "property_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyTag_pkey" PRIMARY KEY ("property_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE INDEX "Property_user_id_idx" ON "Property"("user_id");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_county_idx" ON "Property"("county");

-- CreateIndex
CREATE INDEX "Property_price_idx" ON "Property"("price");

-- CreateIndex
CREATE INDEX "Viewing_property_id_idx" ON "Viewing"("property_id");

-- CreateIndex
CREATE INDEX "Viewing_user_id_idx" ON "Viewing"("user_id");

-- CreateIndex
CREATE INDEX "Viewing_scheduled_date_idx" ON "Viewing"("scheduled_date");

-- CreateIndex
CREATE INDEX "Comparison_user_id_idx" ON "Comparison"("user_id");

-- CreateIndex
CREATE INDEX "Tag_user_id_idx" ON "Tag"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_user_id_name_key" ON "Tag"("user_id", "name");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTag" ADD CONSTRAINT "PropertyTag_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTag" ADD CONSTRAINT "PropertyTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
