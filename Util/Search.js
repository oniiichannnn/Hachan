const $         = require("node-superfetch");
const { parse } = require("node-html-parser");


/**
 * 
 * @param {string} Query 
 * @returns {string}
 */
module.exports = async function ( Query ) {
    const Base_URL      = "https://e-hentai.org/?f_search=";
    const ParsedQuery   = encodeURIComponent(Query);

    const Response = await $.get(`${Base_URL}${ParsedQuery}`);

    const HTMLContent = Response.body.toString();

    return HTMLContent;
}