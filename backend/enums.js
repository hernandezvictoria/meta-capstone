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
    serum: "serum",
    toner: "toner",
    sunscreen: "sunscreen",
    moisturizer: "moisturizer",
    retinol: "retinol",
    mask: "mask",
    cleanser: "cleanser",
    eye_cream: "eye_cream"
})

const InteractionTypes = Object.freeze({
  LIKE: "like",
  DISLIKE: "dislike",
  SAVE: "save",
  REMOVE_LIKE: "remove_like",
  REMOVE_DISLIKE: "remove_dislike",
  REMOVE_SAVE: "remove_save",
  OPEN_MODAL: "open_modal"
})

const ActivityTypes = Object.freeze({
    LOGIN: "login",
    LOGOUT: "logout"
})

module.exports = { SkinTypes, SkinConcerns, ProductTypes, InteractionTypes, ActivityTypes };
