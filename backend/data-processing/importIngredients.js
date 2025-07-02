const fs = require('fs');
const parse = require('csv-parse').parse;
const { PrismaClient } = require('../generated/prisma/index.js');
const prisma = new PrismaClient();
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

fs.createReadStream('ingredients.csv')
  .pipe(parse({ columns: true, trim: true }))
  .on('data', async (row) => {

    const getConcernsArray = (str) => {
      let concerns = str.toLowerCase();
      let concernsArray = [];
      if(concerns.includes("acne") || concerns.includes("oiliness") || concerns.includes("antimicrobial")){
        concernsArray.push(SkinConcerns.ACNE);
      }
      if(concerns.includes("wrinkles") || concerns.includes("fine lines") || concerns.includes("aging")){
        concernsArray.push(SkinConcerns.WRINKLES);
      }
      if(concerns.includes("dark") || concerns.includes("discoloration") || concerns.includes("hyperpigmentation") || concerns.includes("sun") || concerns.includes("uv")){
        concernsArray.push(SkinConcerns.HYPERPIGMENTATION);
      }
      if(concerns.includes("exfoliate") || concerns.includes("roughness") || concerns.includes("smooth") || concerns.includes("condition")){
        concernsArray.push(SkinConcerns.TEXTURE);
      }
      if(concerns.includes("redness") || concerns.includes("irritation") || concerns.includes("sooth") || concerns.includes("strength") || concerns.includes("inflam") || concerns.includes("barrier")){
        concernsArray.push(SkinConcerns.REDNESS);
      }
      if(concerns.includes("dullness") || concerns.includes("exfoliate") || concerns.includes("brighten")){
        concernsArray.push(SkinConcerns.DULLNESS);
      }
      if(concerns.includes("dryness") || concerns.includes("moist") || concerns.includes("hydrat") || concerns.includes("plump")){
        concernsArray.push(SkinConcerns.DRYNESS);
      }
      return concernsArray;
    };

    const getSkinTypesArray = (str) => {
      let types = str.toLowerCase();
      let typesArray = []
      if(types.includes("all")){
        typesArray.push(SkinTypes.DRY);
        typesArray.push(SkinTypes.OILY);
        typesArray.push(SkinTypes.COMBINATION);
        typesArray.push(SkinTypes.NORMAL);
      }
      if(types.includes("dry") || types.includes("sensitive")){
        typesArray.push(SkinTypes.DRY);
      }
      if(types.includes("oily")){
        typesArray.push(SkinTypes.OILY);
      }
      if(types.includes("combination")){
        typesArray.push(SkinTypes.COMBINATION);
      }
      if(types.includes("normal")){
        typesArray.push(SkinTypes.NORMAL);
      }
      return typesArray;
    };

    const concernsArray = getConcernsArray(row.Purpose);
    const skinTypeArray = getSkinTypesArray(row['Skin Type']);

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
            ingredient_type: row.Type.toLowerCase(),
            purpose: row.Purpose.toLowerCase(),
            skin_type: skinTypeArray,
            concerns: concernsArray,
          },
        });
      }
    } catch (err) {
      console.error('Error inserting row:', row, err);
    }
  })
  .on('end', async () => {
    console.log('CSV file successfully processed');
    await prisma.$disconnect();
  });
