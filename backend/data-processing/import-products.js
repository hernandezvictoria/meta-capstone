const fs = require("fs");
const parse = require("csv-parse").parse;
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const { SkinTypes, SkinConcerns } = require("../enums.js");

const concernRelatedWords = new Map();
concernRelatedWords.set(SkinConcerns.ACNE, ["acne", "oiliness", "antimicrobial"]);
concernRelatedWords.set(SkinConcerns.WRINKLES, ["wrinkles", "fine lines", "aging"]);
concernRelatedWords.set(SkinConcerns.HYPERPIGMENTATION, ["dark", "discoloration", "hyperpigmentation", "sun", "uv"]);
concernRelatedWords.set(SkinConcerns.TEXTURE, ["exfoliate", "roughness", "smooth", "condition"]);
concernRelatedWords.set(SkinConcerns.REDNESS, ["redness", "irritation", "sooth", "strength", "inflam", "barrier"]);
concernRelatedWords.set(SkinConcerns.DULLNESS, ["dullness", "exfoliate", "brighten"]);
concernRelatedWords.set(SkinConcerns.DRYNESS, ["dryness", "moist", "hydrat", "plump"]);
fs.createReadStream("seed.csv")
    .pipe(parse({ columns: true, trim: true }))
    .on("data", async (row) => {
        const getConcernsArray = (str) => {
            let concerns = str.toLowerCase();
            let concernsArray = [];
            for (const [concern, words] of concernRelatedWords.entries()) {
                for (const word of words) {
                    if (concerns.includes(word)) {
                        concernsArray.push(concern);
                        break; // Break to avoid adding the same concern multiple times
                    }
                }
            }
            return concernsArray;
        };

        const getSkinTypesArray = (str) => {
            let types = str.toLowerCase();
            let typesArray = [];
            if (types.includes("dry")) {
                typesArray.push(SkinTypes.DRY);
            }
            if (types.includes("oily")) {
                typesArray.push(SkinTypes.OILY);
            }
            if (types.includes("combination")) {
                typesArray.push(SkinTypes.COMBINATION);
            }
            if (types.includes("normal")) {
                typesArray.push(SkinTypes.NORMAL);
            }
            return typesArray;
        };

        let ingredientsArray = row.ingredients
            .split(",")
            .map((i) => i.trim().toLowerCase());

        const concernsArray = getConcernsArray(row.concerns);
        const skinTypeArray = getSkinTypesArray(row.skin_type);
        let price = row.price;
        price = price.slice(1);
        const priceDecimal = parseFloat(price);

        // Insert into database
        try {
            // Fetch ingredients from the database
            const ingredientRecords = await prisma.ingredient.findMany({
                where: {
                    name: { in: ingredientsArray },
                },
            });

            await prisma.productInfo.create({
                data: {
                    brand: row.brand,
                    name: row.name,
                    product_type:
                        row.product_type === "eye cream"
                            ? "eye_cream"
                            : row.product_type,

                    price: priceDecimal,
                    ingredients: {
                        connect: ingredientRecords.map((ingredient) => ({
                            id: ingredient.id,
                        })),
                    },
                    concerns: concernsArray,
                    skin_type: skinTypeArray,
                },
            });
        } catch (err) {
            console.error("Error inserting row:", row, err);
        }
    })
    .on("end", async () => {
        console.log("CSV file successfully processed");
        await prisma.$disconnect();
    });
