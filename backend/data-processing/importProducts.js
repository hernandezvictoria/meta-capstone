const fs = require('fs');
const parse = require('csv-parse').parse;
const { PrismaClient } = require('../generated/prisma/index.js');
const prisma = new PrismaClient();
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')


fs.createReadStream('seed.csv')

  .pipe(parse({ columns: true, trim: true }))
  .on('data', async (row) => {

    const getConcernsArray = (str) => {
      let concerns = str.toLowerCase();
      let concernsArray = [];
      if(concerns.includes("acne") || concerns.includes("oiliness")){
        concernsArray.push(SkinConcerns.ACNE);
      }
      if(concerns.includes("wrinkles") || concerns.includes("fine lines") || concerns.includes("aging")){
        concernsArray.push(SkinConcerns.WRINKLES);
      }
      if(concerns.includes("dark spots") || concerns.includes("discoloration") || concerns.includes("hyperpigmentation") || concerns.includes("sun")){
        concernsArray.push(SkinConcerns.HYPERPIGMENTATION);
      }
      if(concerns.includes("texture") || concerns.includes("roughness") || concerns.includes("smooth")){
        concernsArray.push(SkinConcerns.TEXTURE);
      }
      if(concerns.includes("redness") || concerns.includes("irritation") || concerns.includes("sooth")){
        concernsArray.push(SkinConcerns.REDNESS);
      }
      if(concerns.includes("dullness")){
        concernsArray.push(SkinConcerns.DULLNESS);
      }
      if(concerns.includes("dryness") || concerns.includes("moist")){
        concernsArray.push(SkinConcerns.DRYNESS);
      }
      return concernsArray;
    };

    const getSkinTypesArray = (str) => {
      let types = str.toLowerCase();
      let typesArray = []
      if(types.includes("dry")){
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

    let ingredientsArray = row.ingredients.split(',').map(i => i.trim().toLowerCase());

    const concernsArray = getConcernsArray(row.concerns);
    const skinTypeArray = getSkinTypesArray(row.skin_type);
    let price = row.price;
    price = price.slice(1);
    const priceDecimal = parseFloat(price);

    //TODO: handle edge cases for prices input wrongly
    let price = row.price;
    price = price.slice(1);
    const priceDecimal = parseFloat(price);

    // Insert into database
    try {
      // Fetch ingredients from the database
      const ingredientRecords = await prisma.ingredient.findMany({
        where: {
          name: { in: ingredientsArray }
        }
      });

      await prisma.productInfo.create({
        data: {
          brand: row.brand,
          name: row.name,
          product_type: row.product_type === "eye cream" ? "eye_cream" : row.product_type,

          price: priceDecimal,
          ingredients: {
            connect: ingredientRecords.map(ingredient => ({ id: ingredient.id }))
          },
          concerns: concernsArray,
          skin_type: skinTypeArray,
        },
      });
    } catch (err) {
      console.error('Error inserting row:', row, err);
    }
  })
  .on('end', async () => {
    console.log('CSV file successfully processed');
    await prisma.$disconnect();
  });
