const fs = require("fs");
const parse = require("csv-parse").parse;
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const {
    SkinTypes,
    SkinConcerns,
    HarshIngredientTypes,
} = require("../enums.js");

const concernRelatedWords = new Map(); // Map of skin concern to related words
concernRelatedWords.set(SkinConcerns.ACNE, [
    "acne",
    "oiliness",
    "antimicrobial",
]);
concernRelatedWords.set(SkinConcerns.WRINKLES, [
    "wrinkles",
    "fine lines",
    "aging",
]);
concernRelatedWords.set(SkinConcerns.HYPERPIGMENTATION, [
    "dark",
    "discoloration",
    "hyperpigmentation",
    "sun",
    "uv",
]);
concernRelatedWords.set(SkinConcerns.TEXTURE, [
    "exfoliate",
    "roughness",
    "smooth",
    "condition",
]);
concernRelatedWords.set(SkinConcerns.REDNESS, [
    "redness",
    "irritation",
    "sooth",
    "strength",
    "inflam",
    "barrier",
]);
concernRelatedWords.set(SkinConcerns.DULLNESS, [
    "dullness",
    "exfoliate",
    "brighten",
]);
concernRelatedWords.set(SkinConcerns.DRYNESS, [
    "dryness",
    "moist",
    "hydrat",
    "plump",
]);

const ingredientRelatedWords = new Map(); // Map of ingredient type to related words
ingredientRelatedWords.set(HarshIngredientTypes.EXFOLIANT, ["exfoliant"]);
ingredientRelatedWords.set(HarshIngredientTypes.ACTIVE, [
    "active",
    "vitamin c",
]);
ingredientRelatedWords.set(HarshIngredientTypes.RETINOL, [
    "retinol",
    "vitamin a",
]);

fs.createReadStream("ingredients.csv")
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
            if (types.includes("all")) {
                typesArray.push(SkinTypes.DRY);
                typesArray.push(SkinTypes.OILY);
                typesArray.push(SkinTypes.COMBINATION);
                typesArray.push(SkinTypes.NORMAL);
            }
            if (types.includes("dry") || types.includes("sensitive")) {
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

        const concernsArray = getConcernsArray(row.Purpose);
        const skinTypeArray = getSkinTypesArray(row["Skin Type"]);

        // ingredientType is initially a string of types (e.g. "exfoliant, skin softener")
        // set the type of the ingredient if it is exfoliant, active, or retinol, else keep as is
        let ingredientType = row.Type.toLowerCase();
        for (const [type, words] of ingredientRelatedWords.entries()) {
            for (const word of words) {
                if (ingredientType.includes(word)) {
                    ingredientType = type;
                    break; // Break to avoid checking other words once a match is found
                }
            }
        }

        // Insert into database
        try {
            // Check if the ingredient already exists
            const existingIngredient = await prisma.ingredient.findUnique({
                where: {
                    name: row.Ingredient.toLowerCase(),
                },
            });

            // If the ingredient does not exist, insert it
            if (!existingIngredient) {
                await prisma.ingredient.create({
                    data: {
                        name: row.Ingredient.toLowerCase(),
                        ingredient_type: ingredientType,
                        purpose: row.Purpose.toLowerCase(),
                        skin_type: skinTypeArray,
                        concerns: concernsArray,
                    },
                });
            }
        } catch (err) {
            console.error("Error inserting row:", row, err);
        }
    })
    .on("end", async () => {
        console.log("CSV file successfully processed");
        await prisma.$disconnect();
    });
