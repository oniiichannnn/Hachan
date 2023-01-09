const $         = require("node-superfetch");
const { parse } = require("node-html-parser");


/**
 * 
 * @param {string} Query 
 * @returns {string}
 */
module.exports = async function ( Query ) {
    Query = Query.trim();

    const Base_URL      = "https://e-hentai.org/?f_search=";

    if (Query.startsWith(Base_URL)) {
        Query = Query.slice(Base_URL.length)
    }

    const ParsedQuery   = encodeURIComponent(Query);

    const Response = await $.get(`${Base_URL}${ParsedQuery}`);

    const HTMLContent = Response.body.toString();

    return HTMLContent;
}