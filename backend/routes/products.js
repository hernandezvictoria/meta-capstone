const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const prisma = new PrismaClient()
const router = express.Router()


const termToEnum = {}; // hm to store related terms to skin types and concerns

// Add key-value pairs
termToEnum['combo'] = SkinTypes.COMBINATION;
termToEnum['wrinkles'] = SkinConcerns.WRINKLES;
termToEnum['fine'] = SkinConcerns.WRINKLES;
termToEnum['lines'] = SkinConcerns.WRINKLES;
termToEnum['line'] = SkinConcerns.WRINKLES;
termToEnum['rough'] = SkinConcerns.TEXTURE;
termToEnum['smooth'] = SkinConcerns.TEXTURE;
termToEnum['dark'] = SkinConcerns.HYPERPIGMENTATION;
termToEnum['spots'] = SkinConcerns.HYPERPIGMENTATION;
termToEnum['hyperpigmentation'] = SkinConcerns.HYPERPIGMENTATION;
termToEnum['redness'] = SkinConcerns.REDNESS;
termToEnum['irritation'] = SkinConcerns.REDNESS;
termToEnum['damaged'] = SkinConcerns.REDNESS;
termToEnum['red'] = SkinConcerns.REDNESS;
termToEnum['acne'] = SkinConcerns.ACNE;
termToEnum['blemish'] = SkinConcerns.ACNE;
termToEnum['blemishes'] = SkinConcerns.ACNE;
termToEnum['pimple'] = SkinConcerns.ACNE;
termToEnum['pimples'] = SkinConcerns.ACNE;
termToEnum['dull'] = SkinConcerns.DULLNESS;
termToEnum['dry'] = SkinConcerns.DRYNESS;
termToEnum['lotion'] = ProductTypes.moisturizer;
termToEnum['eye'] = ProductTypes.eye_cream; // not a great soln for eye cream rn
termToEnum['cream'] = ProductTypes.moisturizer;
termToEnum['wash'] = ProductTypes.cleanser;
termToEnum['retinoid'] = ProductTypes.retinol;


// http://localhost:3000/products
router.get('/products', async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1; // default to page 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10; //default to limit 10 products per page
    const searchTerm = req.query.searchTerm ? req.query.searchTerm : ""; // default to "" if no search term
    const offset = (page - 1) * limit;

    if (!req.session.userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    if(searchTerm === ""){
        try {
            const products = await prisma.productInfo.findMany({
                skip: offset,
                take: limit
            });
            //RES NOW HAS TWO ELEMENTS IN JSON
            res.status(200).json({
                totalProducts: products.length,
                products});
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching user products" })
        }
    }
    else{
        //TODO: make hm of term to related enums in db and pre-process query

        let foundProducts = [];
        const queryArray = searchTerm.split(" ")
            .filter(q => (q !== "and" && q !== "for" && q !== "skin" && q !== "face")) // remove filler words from query, can add more later
            .map(q => (q in termToEnum) ? termToEnum[q] : q); // map terms to enums

        //TODO: make everything lowercase, clean hyphens and plus signs
        // delegate logic elsewhere

        try {
            foundProducts = await prisma.productInfo.findMany({
                where: {
                    AND: queryArray.map(q => ({
                        OR: [
                            { brand: { contains: q, mode: 'insensitive' } },
                            { name: { contains: q, mode: 'insensitive' } },
                            { product_type: { equals: ProductTypes[q.toLowerCase()] } },
                            { concerns: { has: q } }, // Use has for exact match in array
                            { skin_type: { has: q } } // Use has for exact match in array
                        ]
                    }))
                },
                skip: offset,
                take: limit
            });

            // Remove duplicates based on product ID
            const uniqueFoundProducts = foundProducts.filter((product, index, self) =>
                index === self.findIndex((p) => p.id === product.id)
            );

            res.status(200).json({
                totalProducts: uniqueFoundProducts.length,
                products: uniqueFoundProducts
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching queried products" });
        }
    }
});

// http://localhost:3000/change-product-image
router.put('/change-product-image/:productId', async (req, res) => {
    const {image} = req.body
    const id = parseInt(req.params.productId)

    try {
        // Retrieve the product
        const product = await prisma.productInfo.findUnique({
            where: { id: id }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // update the product's image
        const updatedProduct = await prisma.productInfo.update({
            where: { id: id },
            data: {
                image: image
            }
        });
        res.status(200).json(updatedProduct);

    } catch (error) {
        res.status(500).send({ message: "an error occurred while updating the product's image" });
    }
})

module.exports = router;
