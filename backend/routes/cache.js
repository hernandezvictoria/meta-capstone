const express = require("express");
const router = express.Router();
const {
    getPotentialAPICalls,
    getCacheHits,
} = require("../helpers/server-cache");
const { getActualAPICalls, getDBHits } = require("../helpers/db-cache");

router.get("/cache-stats", async (req, res) => {
    res.json({
        potentialAPICalls: getPotentialAPICalls(),
        cacheHits: getCacheHits(),
        actualAPICalls: getActualAPICalls(),
        DBHits: getDBHits(),
    });
});

module.exports = router;
