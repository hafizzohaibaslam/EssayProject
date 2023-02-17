const sw = require('stopword');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_HOST
    // log: 'trace' 
});


//========= Http Services ===============
var services = function (app) {

    /**
     * @swagger
     * /api/suggestParagraphs:
     *   post:
     *     description: Give suggestions based on the query
     *     tags: [Power Essay]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *       - name: user_query
     *         in: formData
     *         type: string
     *         description: the query
     *         required: true
     *         default: In the recent decades, influence maximization has drawn great attention from both researchers and practitioners. It shows
     *       - name: writing_sections
     *         in: formData
     *         type: string
     *         description: sections to query
     *         required: false
     *         default: conclusion, relatedwork, introduction
     *     responses:
     *       200:
     *         description: processed
     *       404:
     *         description: No matching results
     *       500:
     *         description: Server error
     */

    app.post('/api/suggestParagraphs', function (req, res) {
        console.log('Power Essay - Suggestion');

        var user_query = req.body.user_query;

        var doc_index = req.body.doc_index === undefined ? 'influence_max_x' : req.body.doc_index
        var doc_type = req.body.doc_type === undefined ? 'research' : req.body.doc_type
        var doc_size = req.body.doc_size === undefined ? 20 : req.body.doc_size
        var fragment_size = req.body.fragment_size === undefined ? 300 : req.body.fragment_size
        var number_of_fragments = req.body.number_of_fragments === undefined ? 1 : req.body.number_of_fragments
        var writing_sections = req.body.writing_sections;

        // console.log(writing_sections)


        // if (writing_sections)
        //     writing_sections = writing_sections.split(',');


        var boost_phrase = 1;
        var boost_context = 1;
        var fuzziness_phrase = 1;
        var fuzziness_context = 1;
        // var writing_sections = ['conclusion', 'relatedwork', 'introduction']

        // var doc_index = 'influence_max_x';
        // var doc_type = 'research';
        // var doc_size = 3;
        // var fragment_size = 300;
        // var number_of_fragments = 3;


        // var boost_phrase = 2;
        // var boost_context = 0
        // var fuzziness_phrase = 1;
        // var fuzziness_context = 1;
        // var writing_sections = ['conclusion', 'relatedwork', 'introduction']

        var query_obj = parseQuery(user_query);
        var queryPhrase = query_obj.queryPhrase;
        var queryText = query_obj.queryText;
        var queryContext = query_obj.queryContext;


        //prepare search object fields
        var highlight = {
            fragment_size: fragment_size,
            fields: {
                'text': {
                    number_of_fragments: number_of_fragments,
                    order: "score"
                }
            }
        }

        var query = {
            bool: {
                should: [],
                filter: {
                    bool: {
                        should: []
                    }
                }
            }
        }

        //add filters - sections
        if (writing_sections && writing_sections.length > 0) {
            writing_sections.forEach((section) => {
                query.bool.filter.bool.should.push(
                    {
                        "term": {
                            "doc_type": section.trim()
                        }
                    }
                );
            })
        }

        //phrase
        if (queryPhrase) {
            query.bool.should.push({
                match_phrase: {
                    "text": {
                        query: queryPhrase,
                        boost: boost_phrase + 1,
                        "slop": 1
                    }
                }
            });
        }

        //text - fuzzy
        if (queryText) {
            query.bool.should.push({
                match: {
                    "text": {
                        query: queryText,
                        boost: boost_phrase,
                        fuzziness: fuzziness_phrase
                    }
                }
            });
        }

        //context
        if (queryContext) {
            query.bool.should.push({
                match: {
                    "text": {
                        query: queryContext,
                        boost: boost_context,
                        fuzziness: fuzziness_context
                    }
                }
            });
        }

        //search object construction
        var returnFields = ['highlight', 'from_paper', 'doc_type']
        var searchObj = {
            index: doc_index,
            type: doc_type,
            size: doc_size,
            _source: returnFields,
            body: {
                query: query,
                highlight: highlight
            }
        }

        console.log(JSON.stringify(searchObj))

        // console.log(JSON.stringify(searchObj, null, 4))

        //conduct search
        client.search(searchObj).then((data) => {
            res.status(200).send(data);
        }, (ex) => {
            res.status(500).send(ex.message);
        });
    });


    /**
     * @swagger
     * /api/getParagraphsByPaperID:
     *   post:
     *     description: Get Paragraphs by ID
     *     tags: [Power Essay]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *       - name: paper_title
     *         in: formData
     *         type: string
     *         description: the query
     *         required: true
     *         default: 
     *     responses:
     *       200:
     *         description: processed
     *       404:
     *         description: No matching results
     *       500:
     *         description: Server error
     */

    app.post('/api/getParagraphsByPaperID', function (req, res) {
        console.log('Power Essay - Get Paragraphs by Title');

        var paper_title = req.body.paper_title;

        var doc_index = req.body.doc_index === undefined ? 'influence_max_x' : req.body.doc_index
        var doc_type = req.body.doc_type === undefined ? 'research' : req.body.doc_type
        var doc_size = req.body.doc_size === undefined ? 50 : req.body.doc_size

        var query = {
            bool: {
                must: [
                    {
                        match: {
                            "from_paper": {
                                query: paper_title
                            }
                        }
                    }
                ],
                filter: {
                    bool: {
                        should: []
                    }
                }
            }
        }

        var searchObj = {
            index: doc_index,
            type: doc_type,
            size: doc_size,
            body: {
                sort: "paragraph_no",
                query: query
            }
        }

        // console.log(JSON.stringify(searchObj, null, 4))

        //conduct search
        client.search(searchObj).then((data) => {
            res.status(200).send(data);
        }, (ex) => {
            res.status(500).send(ex.message);
        });
    });


    /**
     * @swagger
     * /api/getIndices:
     *   post:
     *     description: Get all indices
     *     tags: [Power Essay]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     responses:
     *       200:
     *         description: processed
     *       404:
     *         description: No matching results
     *       500:
     *         description: Server error
     */
    app.post('/api/getIndices', function (req, res) {
        console.log('query indices');
        //parameters
        var docIndex = "_all";

        var elasticObject = {
            index: docIndex
        };

        client.cat.indices(elasticObject, function (error, response) {
            if (error) {
                res.status(500).send(error);
            } else {
                res.status(200).send(response);
            }
        });

    });


}

//========= Exports ===============
module.exports = { services }


function parseQuery(queryText) {

    var processSentence = (queryText) => { return queryText.split(/[,.!?:]+/) }
    var processContext = (queryText) => {
        var originalString = queryText.split(/[\s,.!?:]+/)
        var newString = sw.removeStopwords(originalString)
        return newString.join(' ');
    }
    var countWords = (str) => { return str.trim().split(/\s+/).length }
    var getTokens = (str) => { return str.trim().split(/\s+/) }

    //for a short query scenario - no context
    if (countWords(queryText) < 4) {
        return {
            queryPhrase: queryText,
            queryText: queryText
        }
    }

    //a long-tail question scenario
    var phrases = processSentence(queryText);
    var context = processContext(queryText);
    var queryPhrase = '';
    var countofLastPhrase = countWords(phrases[phrases.length - 1]);
    if (countofLastPhrase > 0) {
        var tokens = getTokens(phrases[phrases.length - 1]);
        if (countofLastPhrase > 3)
            queryPhrase = tokens.slice(tokens.length - 3, tokens.length).join(' '); //last three words only
        else
            queryPhrase = tokens.join(' '); //all the words
        return {
            queryPhrase: queryPhrase,
            queryText: queryPhrase,
            queryContext: context
        }
    }
    else {
        var tokens = getTokens(queryText);
        var queryPhrase = tokens.slice(tokens.length - 3, tokens.length).join(' ');
        return {
            queryPhrase: queryPhrase,
            queryText: queryPhrase,
            queryContext: context
        }
    }

    // else if (countWords(phrases[phrases.length - 1]) === 0) {
    //     var tokens = getTokens(queryText);
    //     var queryPhrase = tokens.slice(tokens.length - 3, tokens.length).join(' ');
    //     return {
    //         queryPhrase: queryPhrase,
    //         queryText: queryPhrase,
    //         queryContext: context
    //     }
    // }
    // else {
    //     return {
    //         queryPhrase: phrases[phrases.length - 1],
    //         queryText: phrases[phrases.length - 1],
    //         queryContext: context
    //     }
    // }
}

