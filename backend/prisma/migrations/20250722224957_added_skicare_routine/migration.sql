-- CreateTable
CREATE TABLE "_skincare_routine" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_skincare_routine_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_skincare_routine_B_index" ON "_skincare_routine"("B");

-- AddForeignKey
ALTER TABLE "_skincare_routine" ADD CONSTRAINT "_skincare_routine_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_skincare_routine" ADD CONSTRAINT "_skincare_routine_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
