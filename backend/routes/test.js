const computeProductScore = require('./scoring-helper-functions.js');

const userInfo = {
	"username": "victoria1",
	"concerns": [
		"fine lines & wrinkles",
		"texture",
		"hyperpigmentation (dark spots)",
		"redness & irritation",
		"acne & blemishes",
		"dullness",
		"dryness"
	],
	"skin_type": [
		"oily"
	],
	"loved_products": [
		{
			"id": 12,
			"brand": "The Ordinary",
			"name": "Alpha Arbutin 2% + HA",
			"image": "https://www.sephora.com/productimages/sku/s2031441-main-zoom.jpg?imwidth=270",
			"product_type": "serum",
			"price": "10",
			"concerns": [
				"hyperpigmentation (dark spots)",
				"dullness"
			],
			"skin_type": [
				"combination",
				"normal"
			],
			"ingredients": [
				{
					"id": 957,
					"name": "hyaluronic acid",
					"ingredient_type": "humectant",
					"purpose": "moisturizing, skin plumping",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				},
				{
					"id": 1604,
					"name": "glycerin",
					"ingredient_type": "humectant",
					"purpose": "retains moisture, hydrates skin",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				}
			]
		},
		{
			"id": 11,
			"brand": "Neutrogena",
			"name": "Ultra Sheer Dry-Touch Sunscreen SPF 55",
			"image": "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
			"product_type": "sunscreen",
			"price": "10",
			"concerns": [
				"dullness"
			],
			"skin_type": [
				"oily",
				"combination"
			],
			"ingredients": [
				{
					"id": 1489,
					"name": "vitamin e",
					"ingredient_type": "vitamin",
					"purpose": "antioxidant, skin conditioning",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"texture"
					]
				}
			]
		},
		{
			"id": 31,
			"brand": "The Ordinary",
			"name": "Lactic Acid 10% + HA",
			"image": "https://www.sephora.com/productimages/sku/s2031433-main-zoom.jpg?imwidth=270",
			"product_type": "serum",
			"price": "8",
			"concerns": [
				"texture",
				"dullness"
			],
			"skin_type": [
				"combination",
				"normal"
			],
			"ingredients": [
				{
					"id": 107,
					"name": "lactic acid",
					"ingredient_type": "exfoliant, ph adjuster",
					"purpose": "exfoliates and maintains ph balance",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"texture",
						"dullness"
					]
				},
				{
					"id": 957,
					"name": "hyaluronic acid",
					"ingredient_type": "humectant",
					"purpose": "moisturizing, skin plumping",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				}
			]
		},
		{
			"id": 1,
			"brand": "EltaMD",
			"name": "UV Clear Broad-Spectrum SPF 46",
			"image": "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
			"product_type": "sunscreen",
			"price": "39",
			"concerns": [
				"acne & blemishes",
				"redness & irritation"
			],
			"skin_type": [
				"oily",
				"combination"
			],
			"ingredients": [
				{
					"id": 504,
					"name": "niacinamide",
					"ingredient_type": "active ingredient",
					"purpose": "anti-inflammatory, brightening",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"redness & irritation",
						"dullness"
					]
				},
				{
					"id": 774,
					"name": "zinc oxide",
					"ingredient_type": "mineral",
					"purpose": "sunscreen, soothing, anti-inflammatory",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"hyperpigmentation (dark spots)",
						"redness & irritation"
					]
				},
				{
					"id": 957,
					"name": "hyaluronic acid",
					"ingredient_type": "humectant",
					"purpose": "moisturizing, skin plumping",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				}
			]
		}
	],
	"saved_products": [],
	"disliked_products": [
		{
			"id": 5,
			"brand": "Shiseido",
			"name": "Essential Energy Hydrating Cream",
			"image": "https://www.sephora.com/productimages/sku/s2534816-main-zoom.jpg?imwidth=270",
			"product_type": "moisturizer",
			"price": "48",
			"concerns": [
				"dullness",
				"dryness"
			],
			"skin_type": [
				"dry",
				"normal"
			],
			"ingredients": [
				{
					"id": 342,
					"name": "squalane",
					"ingredient_type": "moisturizing, skin softening",
					"purpose": "deeply moisturizes and softens skin",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				},
				{
					"id": 957,
					"name": "hyaluronic acid",
					"ingredient_type": "humectant",
					"purpose": "moisturizing, skin plumping",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"dryness"
					]
				}
			]
		},
		{
			"id": 18,
			"brand": "Glow Recipe",
			"name": "Avocado Melt Retinol Eye Sleeping Mask",
			"image": "https://www.sephora.com/productimages/sku/s2450096-main-zoom.jpg?imwidth=270&pb=clean-planet-aware",
			"product_type": "eye_cream",
			"price": "42",
			"concerns": [
				"fine lines & wrinkles",
				"dryness"
			],
			"skin_type": [
				"dry",
				"normal"
			],
			"ingredients": [
				{
					"id": 504,
					"name": "niacinamide",
					"ingredient_type": "active ingredient",
					"purpose": "anti-inflammatory, brightening",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"redness & irritation",
						"dullness"
					]
				},
				{
					"id": 1405,
					"name": "avocado oil",
					"ingredient_type": "plant-derived oil",
					"purpose": "moisturizing, nourishing, anti-aging",
					"skin_type": [
						"dry"
					],
					"concerns": [
						"fine lines & wrinkles",
						"dryness"
					]
				},
				{
					"id": 2171,
					"name": "retinol",
					"ingredient_type": "vitamin a",
					"purpose": "anti-aging, reduces wrinkles",
					"skin_type": [
						"dry",
						"oily",
						"combination",
						"normal"
					],
					"concerns": [
						"fine lines & wrinkles"
					]
				}
			]
		}
	]
}

const sampleProduct =  {
	"id": 20,
	"brand": "The Ordinary",
	"name": "Glycolic Acid 7% Exfoliating and Brightening Daily Toner",
	"image": "https://www.sephora.com/productimages/sku/s2031508-main-zoom.jpg?imwidth=270",
	"product_type": "toner",
	"price": "13",
	"concerns": [
		"texture",
		"dullness"
	],
	"skin_type": [
		"dry",
		"oily",
		"combination",
		"normal"
	],
	"ingredients": [
		{
			"id": 417,
			"name": "glycolic acid",
			"ingredient_type": "exfoliant, skin renewing",
			"purpose": "promotes cell turnover, improves skin tone and texture",
			"skin_type": [
				"dry",
				"oily"
			],
			"concerns": []
		}
	],
	"loved_by_user": [],
	"disliked_by_user": []
}

const testComputeScore = async () => {

    const productToCheck = sampleProduct;
    const lovedProducts = userInfo.loved_products;
    const dislikedProducts = userInfo.disliked_products;
    const userSkinType = userInfo.skin_type;
    const userSkinConcerns = userInfo.concerns;

    const score = computeProductScore(productToCheck, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns, 2);
    console.log('Score:', score);
    console.log("Score computed successfully");
}

testComputeScore();
