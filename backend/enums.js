const SkinTypes = Object.freeze({
    OILY: "oily",
    DRY: "dry",
    COMBINATION: "combination",
    NORMAL: "normal"
});

const SkinConcerns = Object.freeze({
    WRINKLES: "fine lines & wrinkles",
    TEXTURE: "texture",
    HYPERPIGMENTATION: "hyperpigmentation (dark spots)",
    REDNESS: "redness & irritation",
    ACNE: "acne & blemishes",
    DULLNESS: "dullness",
    DRYNESS: "dryness"
})

const ProductTypes = Object.freeze({
    SERUM: "serum",
    TONER: "toner",
    SUNSCREEN: "sunscreen",
    MOISTURIZER: "moisturizer",
    RETINOL: "retinol",
    MASK: "mask",
    CLEANSER: "cleanser",
    EYE: "eye cream"
})

module.exports = { SkinTypes, SkinConcerns, ProductTypes };
