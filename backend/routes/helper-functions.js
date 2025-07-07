const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const prisma = new PrismaClient()
const router = express.Router()
var jaccard = require('jaccard');

const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns) => {
    let score = 0;

    // get overlap between skin types and skin concerns, don't penalize if product has extra concerns that don't match the user's
    for (const skinType of userSkinType) {
        if (product.skin_type.includes(skinType)) {
            score += 2; // double points for whole product matching skin type
        }
        for (ingredient of product.ingredients) {
            if (ingredient.skin_type.includes(skinType)) {
                score += 1; // half for ingredient matching skin type
            }
        }
    }

    for (const concern of userSkinConcerns) {
        if (product.concerns.includes(concern)) {
            score += 2;
        }
        for (ingredient of product.ingredients) {
            if (ingredient.concerns.includes(concern)) {
                score += 1;
            }
        }
    }

    // get overlap with loved products
    for (const lovedProduct of lovedProducts) {
        if(lovedProduct.id === product.id) { // ignore if product is already loved
            continue;
        }

        if(lovedProduct.brand === product.brand) {
            score += 0.5; // boost for loved brand
        }

        // jaccard index computes similarity between two sets
        score += jaccard.index(lovedProduct.ingredients, product.ingredients); // boost for ingredient overlap
    }

    // penalize for overlap with disliked products
    for(const dislikedProduct of dislikedProducts) {
        if(dislikedProduct.id === product.id) { // ignore if product is already disliked
            continue;
        }

        if(dislikedProduct.brand === product.brand) {
            score -= 0.5; // penalize for disliked brand
        }

        // jaccard index computes similarity between two sets, produces a number between 0 and 1
        score -= jaccard.index(dislikedProduct.ingredients, product.ingredients); // penalize for ingredient overlap
    }

    // get popularity score of product
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (likeCount + dislikeCount > 0) {
        score += ((likeCount - dislikeCount) / (likeCount + dislikeCount))*2; // normalize by total count and multiply by 2
    }



}
