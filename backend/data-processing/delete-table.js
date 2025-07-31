const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();

const updateTable = async () => {
    await prisma.productInfo.updateMany({
        data: { image: null,
            image_fetch_time : null,
         },

    });
};

try {
    await updateTable();
    console.log("All entries updated successfully!");
} catch (error) {
    console.error("Error deleting entries:", error);
}
