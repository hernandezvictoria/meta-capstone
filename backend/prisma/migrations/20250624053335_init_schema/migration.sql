-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "concerns" TEXT,
    "skin_type" TEXT,
    "loved_products" TEXT DEFAULT '',
    "saved_products" TEXT DEFAULT '',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ingredient_type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "skin_type" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInfo" (
    "id" SERIAL NOT NULL,
    "concerns" TEXT NOT NULL,
    "skin_type" TEXT NOT NULL,

    CONSTRAINT "ProductInfo_pkey" PRIMARY KEY ("id")
);
