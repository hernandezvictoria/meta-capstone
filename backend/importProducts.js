const fs = require('fs');
const parse = require('csv-parse').parse;
const { PrismaClient } = require('./generated/prisma/index.js')
const prisma = new PrismaClient();


fs.createReadStream('AB1.csv')
  .pipe(parse({ columns: true, trim: true }))
  .on('data', async (row) => {
    // Split ingredients by comma and trim whitespace
    let ingredientsArray = row.ingredients.split(',').map(i => i.trim());
    ingredientsArray = ingredientsArray.map(i => i.toLowerCase());

    // Insert into database
    await prisma.productInfo.create({
      data: {
        brand: row.brand,
        name: row.product_name,
        ingredients: ingredientsArray,
      },
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    prisma.$disconnect();
  });
