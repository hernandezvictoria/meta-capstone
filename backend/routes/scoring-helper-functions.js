var jaccard = require('jaccard');
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const parseDislikedProducts = (dislikedProducts) => {
    const dislikedProductsBrands = dislikedProducts.map(product => product.brand);
    const dislikedBrands = new Set();
    const brandFrequencies = {}; // count of each brand
    for (const brand of dislikedProductsBrands) {
        brandFrequencies[brand] = (brandFrequencies[brand] || 0) + 1;
        if(brandFrequencies[brand] >= 3) {
            dislikedBrands.add(brand);
        }
    }

    const dislikedProductsIngredients = dislikedProducts.map(product => product.ingredients.map(ingredient => ingredient.id)).flat();
    const dislikedIngredients = new Set();
    const ingredientFrequencies = {}; // count of each brand
    for (const ingredient of dislikedProductsIngredients) {
        ingredientFrequencies[ingredient] = (ingredientFrequencies[ingredient] || 0) + 1;
        if(ingredientFrequencies[ingredient] >= 5) {
            dislikedIngredients.add(ingredient);
        }
    }
    // list of brand names that appeared greater than 3 times, list of ingredient ids that appeared greater than 5 times
    return {dislikedBrands, dislikedIngredients};
}

const parseLikedProducts = (likedProducts) => {
    const likedProductsBrands = likedProducts.map(product => product.brand);
    const likedBrands = new Set();
    const brandFrequencies = {}; // count of each brand
    for (const brand of likedProductsBrands) {
        brandFrequencies[brand] = (brandFrequencies[brand] || 0) + 1;
        if(brandFrequencies[brand] >= 3) {
            likedBrands.add(brand);
        }
    }

    const likedProductsIngredients = likedProducts.map(product => product.ingredients.map(ingredient => ingredient.id)).flat();
    const likedIngredients = new Set();
    const ingredientFrequencies = {}; // count of each brand
    for (const ingredient of likedProductsIngredients) {
        ingredientFrequencies[ingredient] = (ingredientFrequencies[ingredient] || 0) + 1;
        if(ingredientFrequencies[ingredient] >= 4) {
            likedIngredients.add(ingredient);
        }
    }
    // list of brand names, list of ingredient ids
    return {likedBrands, likedIngredients};
}

// given a product, compute its score based on user preferences
const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns, totalUsers) => {
    // =========== get overlap between skin types and skin concerns ===========
    // skin type overlap
    let productSkinTypeScore = 0;
    let ingredientSkinTypeScore = 0;
    for (const skinType of userSkinType) {
        if (product.skin_type.includes(skinType)) {
            productSkinTypeScore += 1; // add up product skin type matches
        }

        if(product.ingredients.some(ingredient => ingredient.skin_type.includes(skinType))){
            ingredientSkinTypeScore += 1; // if at least one of the ingredients matches the skin type, get a point
        }
    }
    if(userSkinType.length > 0) {
        productSkinTypeScore /= userSkinType.length; // proportion of skin types satisfied by product
    }
    if(product.ingredients.length > 0) {
        // ingredientSkinTypeScore is the number of skin types satisfied by the ingredients' skin types
        ingredientSkinTypeScore /= product.ingredients.length; // proportion of skin types satisfied by ingredients
    }

    // repeat for skin concern overlap
    let productConcernsScore = 0;
    let ingredientConcernsScore = 0;
    for (const concern of userSkinConcerns) {
        if (product.concerns.includes(concern)) {
            productConcernsScore += 1;
        }

        if(product.ingredients.some(ingredient => ingredient.concerns.includes(concern))){
            ingredientConcernsScore += 1; // if at least one of the ingredients matches the skin type, get a point
        }
    }
    if(userSkinConcerns.length > 0) {
        productConcernsScore = productConcernsScore / userSkinConcerns.length; // proportion of skin concerns satisfied by product, userSkinConcerns.length is nonzero
    }
    if(product.ingredients.length > 0) {
        ingredientConcernsScore /= product.ingredients.length; // proportion of skin concerns satisfied by ingredients
    }

    // ========== get popularity score of product ==========
    let popularityScore = 0;
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (totalUsers > 0) {
        popularityScore = (likeCount - dislikeCount) / totalUsers; // normalize by total number of users
    }


    // ========== bonus points: overlap with loved and disliked products ===========
    // get overlap with loved products
    const lovedBrands = parseLikedProducts(lovedProducts).likedBrands;
    const lovedIngredients = parseLikedProducts(lovedProducts).likedIngredients;
    let lovedProductOverlapScore = 0;
    let lovedProductIngredientSimilarityScore = 0;
    let isProductLoved = false;
    for (const lovedProduct of lovedProducts) {
        if(lovedProduct.id === product.id) {
            isProductLoved = true;
            lovedProductOverlapScore = 2; // automatically boost for loved product by 2 points
            break;
        }

        if(lovedProduct.brand === product.brand) {
            lovedProductOverlapScore += (lovedBrands.has(lovedProduct.brand) ? 0.2 : 0.1); // double boost if brand is well-liked
        }

        // jaccard index computes similarity between two sets
        lovedProductIngredientSimilarityScore += jaccard.index(
            lovedProduct.ingredients.map(i => i.id), // convert to array of ids
            product.ingredients.map(i => i.id)
        );
    }

    if(!isProductLoved && lovedProducts.length > 0) {
        // subtract by 1 if product is already loved, to avoid double counting
        lovedProductOverlapScore += (lovedProductIngredientSimilarityScore / lovedProducts.length); // average jaccard score of loved products
    }

    for(const ingredientId of lovedIngredients) {
        if(product.ingredients.some(i => i.id === ingredientId)) {
            lovedProductOverlapScore += 0.5; // extra boost for loved ingredient
        }
    }

    // penalize for overlap with disliked products
    const dislikedBrands = parseDislikedProducts(dislikedProducts).dislikedBrands;
    const dislikedIngredients = parseDislikedProducts(dislikedProducts).dislikedIngredients;
    let dislikedProductOverlapScore = 0;
    let dislikedProductIngredientSimilarityScore = 0;
    let isProductDisliked = false;
    for(const dislikedProduct of dislikedProducts) {
        if(dislikedProduct.id === product.id) {
            isProductDisliked = true;
            dislikedProductOverlapScore = -2; // automatically penalize for disliked product by 2 points
            break;
        }

        if(dislikedProduct.brand === product.brand) {
            dislikedProductOverlapScore -= (dislikedBrands.has(dislikedProduct.brand) ? 0.2 : 0.1); // penalize for disliked brand
        }

        dislikedProductIngredientSimilarityScore -= jaccard.index(
            dislikedProduct.ingredients.map(i => i.id),
            product.ingredients.map(i => i.id)
        ) // penalize for ingredient overlap
    }
    if(!isProductDisliked && dislikedProducts.length > 0) {
        dislikedProductOverlapScore += (dislikedProductIngredientSimilarityScore / dislikedProducts.length); // average jaccard score of disliked products
    }

    for(const ingredientId of dislikedIngredients) {
        if(product.ingredients.some(i => i.id === ingredientId)) {
            dislikedProductOverlapScore -= 0.5; // penalize extra for disliked ingredient
        }
    }
    lovedProductOverlapScore = Math.min(lovedProductOverlapScore, 2); // cap at 2
    dislikedProductOverlapScore = Math.max(dislikedProductOverlapScore, -2); // cap at -2
    const bonusScore = lovedProductOverlapScore + dislikedProductOverlapScore;

    // ========== combine all scores ===========
    let weights = {}; // can adjust weights further
    if(product.ingredients.length > 0) {
        weights['productSkinTypeScore'] = 5;
        weights['ingredientSkinTypeScore'] = 1;
        weights['productConcernsScore'] = 2.5;
        weights['ingredientConcernsScore'] = 0.5;
        weights['popularityScore'] = 1;
    } else {
        weights['productSkinTypeScore'] = 5.5;
        weights['ingredientSkinTypeScore'] = 0;
        weights['productConcernsScore'] = 3;
        weights['ingredientConcernsScore'] = 0;
        weights['popularityScore'] = 1.5;
    }

    let totalScore = 0;
    totalScore += productSkinTypeScore * weights['productSkinTypeScore'];
    totalScore += ingredientSkinTypeScore * weights['ingredientSkinTypeScore'];
    totalScore += productConcernsScore * weights['productConcernsScore'];
    totalScore += ingredientConcernsScore * weights['ingredientConcernsScore'];
    totalScore += popularityScore * weights['popularityScore'];
    totalScore += bonusScore;

    // cap score between 0 and 10
    totalScore = Math.min(totalScore, 10);
    totalScore = Math.max(totalScore, 0);
    totalScore = Math.round(totalScore * 10) / 10; // round to 1 decimal place
    return totalScore;
}

const cleanSearchQuery = (searchTerm) => {
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
    const stopWords = ["skin", "and", "for", "face"];

    let cleanedSearchTerm = searchTerm.replace(/-/g, " ");
    const queryArray = cleanedSearchTerm.split(" ")
        .filter((q) => {
            if(!stopWords.includes(q)){
                return q;
            }
        }) // remove filler words from query, can add more later
        .map(q => (q in termToEnum) ? termToEnum[q] : q) // map terms to enums
        .map(q => q.toLowerCase());

    return queryArray;
}

// returns same array of products, but with scores as a field
const updateProductsWithScore = (products, user, totalUsers) => {
    return products.map((product) => {
        return {
            id: product.id,
            brand: product.brand,
            name: product.name,
            image: product.image,
            product_type: product.product_type,
            price: product.price,
            concerns: product.concerns,
            skin_type: product.skin_type,
            ingredients: product.ingredients,
            score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns, totalUsers)};
    })
}

module.exports = {computeProductScore, cleanSearchQuery, updateProductsWithScore};
