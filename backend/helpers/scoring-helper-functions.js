var jaccard = require('jaccard');
const { getProductImage } = require('./server-cache.js');

const MIN_BRANDS = 3; // minimum number of brands to consider for liked/disliked overlap
const MIN_INGREDIENTS = 5; // minimum number of ingredients to consider for liked/disliked overlap
const LIKED_DISLIKED_BOOST = 2; // boost for product already being liked or disliked
const LIKED_DISLIKED_BRAND_BOOST = 0.1; // boost for product's brand having overlap with liked/disliked products' brands
const LIKED_DISLIKED_INGREDIENT_BOOST = 0.5; // boost for product's ingredients having overlap with liked/disliked products' ingredients
const MAX_LIKED_DISLIKED_OVERLAP_SCORE = 2; // maximum score for liked/disliked overlap
const MAX_SCORE = 10; // maximum score for a product

/**
 * Parses user's liked or disliked products to get brands that have been repeated
 * MIN_BRANDS or more times and ingredients that have been repeated MIN_INGREDIENTS or more times.
 * @param {list} products - Either user's liked or disliked products.
 * @returns {object} - Object with two sets: brands (string) and ingredients (string).
 */
const parseLikedDislikedProducts = (products) => {
    const brands = products.map(product => product.brand);
    const brandSet = new Set();
    const brandFrequencies = {}; // count of each brand
    for (const brand of brands) {
        brandFrequencies[brand] = (brandFrequencies[brand] || 0) + 1;
        if(brandFrequencies[brand] >= MIN_BRANDS) { // if brand appears MIN_BRANDS or more times, add to set
            brandSet.add(brand);
        }
    }

    const ingredients = products.map(product => product.ingredients.map(ingredient => ingredient.id)).flat();
    const ingredientSet = new Set();
    const ingredientFrequencies = {}; // count of each ingredient
    for (const ingredient of ingredients) {
        ingredientFrequencies[ingredient] = (ingredientFrequencies[ingredient] || 0) + 1;
        if(ingredientFrequencies[ingredient] >= MIN_INGREDIENTS) { // if ingredient appears MIN_INGREDIENTS or more times, add to set
            ingredientSet.add(ingredient);
        }
    }
    // list of brand names that appeared greater than MIN_BRANDS times, list of ingredient ids that appeared greater than MIN_INGREDIENTS times
    return {brands: brandSet, ingredients: ingredientSet};
}

/**
 * Computes skin type score for a product by assessing how many skin types the product and its ingredients satisfy.
 * @param {object} product - Product to compute skin type score for.
 * @param {list} userSkinType - List of skin types the user selected.
 * @returns {object} - Object with two scores: productSkinTypeScore (number) and ingredientSkinTypeScore (number) both between 0 and 1.
 */
const computeSkinTypeScore = (product, userSkinType) => {
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
    return {productSkinTypeScore, ingredientSkinTypeScore};
}

/**
 * Computes skin concern score for a product by assessing how many skin concerns the product and its ingredients satisfy.
 * @param {object} product - Product to compute skin concern score for.
 * @param {list} userSkinConcerns - List of skin concerns the user selected.
 * @returns {object} - Object with two scores: productConcernsScore (number) and ingredientConcernsScore (number) both between 0 and 1.
 */
const computeConcernScore = (product, userSkinConcerns) => {
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
    return {productConcernsScore, ingredientConcernsScore};
}

/**
 * Computes popularity score for a product by assessing how many users have liked or
 * disliked the product, relative to the total number of users.
 * @param {object} product - Product to compute popularity score for.
 * @param {number} totalUsers - Total number of users in DB.
 * @returns {number} - Popularity score for the given product (between 0 and 1).
 */
const computePopularityScore = (product, totalUsers) => {
    let popularityScore = 0;
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (totalUsers > 0) {
        popularityScore = (likeCount - dislikeCount) / totalUsers; // normalize by total number of users
    }
    return popularityScore;
}

/**
 * Computes overlap score between a product and the user's liked or disliked products based on product's brand and ingredients.
 * @param {object} product - Product to compute overlap score for.
 * @param {list} likedDislikedProducts - Either user's liked or disliked products.
 * @returns {number} - Overlap score between the product and the user's liked or disliked products (between 0 and MAX_LIKED_DISLIKED_OVERLAP_SCORE).
 */
const computeLikedDislikedOverlapScore = (product, likedDislikedProducts) => {
    const parsedBrandsAndIngredients = parseLikedDislikedProducts(likedDislikedProducts);
    const likedDislikedBrands = parsedBrandsAndIngredients.brands;
    const likedDislikedIngredients = parsedBrandsAndIngredients.ingredients;

    // get overlap with loved or disliked products products
    let likedDislikedProductOverlapScore = 0;
    let likedDislikedProductIngredientSimilarityScore = 0;
    let isProductLikedDisliked = false;
    for (const lovedProduct of likedDislikedProducts) {
        if(lovedProduct.id === product.id) {
            isProductLikedDisliked = true;
            likedDislikedProductOverlapScore = LIKED_DISLIKED_BOOST; // automatically boost for loved/disliked product by LIKED_DISLIKED_BOOST points
            break;
        }

        if(lovedProduct.brand === product.brand) {
            likedDislikedProductOverlapScore += (likedDislikedBrands.has(lovedProduct.brand) ? (LIKED_DISLIKED_BRAND_BOOST * 2) : LIKED_DISLIKED_BRAND_BOOST); // double boost if brand is well-liked/well-disliked
        }

        // jaccard index computes similarity between two sets
        likedDislikedProductIngredientSimilarityScore += jaccard.index(
            lovedProduct.ingredients.map(i => i.id), // convert to array of ids
            product.ingredients.map(i => i.id)
        );
    }

    if(!isProductLikedDisliked && likedDislikedProducts.length > 0) {
        likedDislikedProductOverlapScore += (likedDislikedProductIngredientSimilarityScore / likedDislikedProducts.length); // average jaccard score
    }

    for(const ingredient of product.ingredients){
        if(likedDislikedIngredients.has(ingredient.id)) {
            likedDislikedProductOverlapScore += LIKED_DISLIKED_INGREDIENT_BOOST; // extra boost for liked/disliked ingredient
        }
    }

    likedDislikedProductOverlapScore = Math.min(likedDislikedProductOverlapScore, MAX_LIKED_DISLIKED_OVERLAP_SCORE); // cap at MAX_LIKED_DISLIKED_OVERLAP_SCORE
    return likedDislikedProductOverlapScore;
}

/**
 * Computes a score for a given product based on user's preferences and product's popularity.
 * @param {object} product - Product to compute score for.
 * @param {list} lovedProducts - User's liked products.
 * @param {list} dislikedProducts - User's disliked products.
 * @param {list} userSkinType - User's skin type.
 * @param {list} userSkinConcerns - User's skin concerns.
 * @param {number} totalUsers - Total number of users in DB.
 * @returns {number} - Score for the given product (between 0 and MAX_SCORE (10)).
 */
const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns, totalUsers) => {
    // =========== get overlap between skin types and skin concerns ===========
    const {productSkinTypeScore, ingredientSkinTypeScore} = computeSkinTypeScore(product, userSkinType);
    const {productConcernsScore, ingredientConcernsScore} = computeConcernScore(product, userSkinConcerns);

    // ========== get popularity score of product ==========
    const popularityScore = computePopularityScore(product, totalUsers);

    // ========== bonus points: overlap with loved and disliked products ===========
    let lovedProductOverlapScore = computeLikedDislikedOverlapScore(product, lovedProducts);
    let dislikedProductOverlapScore = computeLikedDislikedOverlapScore(product, dislikedProducts);

    const bonusScore = lovedProductOverlapScore - dislikedProductOverlapScore;

    // ========== combine all scores ===========
    let weights = new Map(); // map from score name -> weight
    if(product.ingredients.length > 0) {
        weights.set('productSkinTypeScore', 5);
        weights.set('ingredientSkinTypeScore', 1);
        weights.set('productConcernsScore', 2.5);
        weights.set('ingredientConcernsScore', 0.5);
        weights.set('popularityScore', 1);
    } else {
        weights.set('productSkinTypeScore', 5.5);
        weights.set('ingredientSkinTypeScore', 0);
        weights.set('productConcernsScore', 3);
        weights.set('ingredientConcernsScore', 0);
        weights.set('popularityScore', 1.5);
    }
    weights.set('bonusScore', 1);

    let totalScore = 0;
    const scores = {
        productSkinTypeScore,
        ingredientSkinTypeScore,
        productConcernsScore,
        ingredientConcernsScore,
        popularityScore,
        bonusScore
    };

    for (const key of weights.keys()) {
        totalScore += scores[key] * weights.get(key);
    }

    // cap score between 0 and MAX_SCORE (10)
    totalScore = Math.min(totalScore, MAX_SCORE);
    totalScore = Math.max(totalScore, 0);
    totalScore = Math.round(totalScore * 10) / 10; // round to 1 decimal place
    return totalScore;
}

/**
 * Updates product objects with computed scores and fetched images.
 * @param {list} products - List of product objects to update.
 * @param {object} user - User to compute scores for.
 * @param {number} totalUsers - Total number of users in DB.
 * @returns
 */
const updateProductsWithScore = async (products, user, totalUsers) => {
    // need to await Promise.all to ensure all images are fetched before returning (otherwise map will return promises)
    const updatedProducts = await Promise.all(products.map(async (product) => {
        return {
            id: product.id,
            brand: product.brand,
            name: product.name,
            image: await getProductImage(user.id, product.id), // getProductImage is async, so need to await
            product_type: product.product_type,
            price: product.price,
            concerns: product.concerns,
            skin_type: product.skin_type,
            ingredients: product.ingredients,
            score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns, totalUsers)
        };
    }));
    return updatedProducts;
}

module.exports = {computeProductScore, updateProductsWithScore};
