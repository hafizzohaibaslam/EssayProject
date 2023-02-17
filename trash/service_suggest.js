const sw = require('stopword');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'localhost:9200'
    // log: 'trace' 
});



// var queryText = 'influence maximization';
// var queryText = 'In this paper, we propose a novel model called';
// var queryText = 'In the recent decades, influence maximization has drawn great attention from both researchers and practitioners. It shows ';
// console.log(parseQuery(queryText));

function parseQuery(queryText) {

    var processSentence = (queryText) => { return queryText.split(/[,.!?:]+/) }

    var processContext = (queryText) => {
        var originalString = queryText.split(/[\s,.!?:]+/)
        var newString = sw.removeStopwords(originalString)
        return newString.join(' ');
    }

    var countWords = (str) => { return str.trim().split(/\s+/).length }
    var getTokens = (str) => { return str.trim().split(/\s+/) }

    //for a short query scenario
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
    if (countWords(phrases[phrases.length - 1]) > 3) {
        var tokens = getTokens(phrases[phrases.length - 1]);
        queryPhrase = tokens.slice(tokens.length - 3, tokens.length).join(' '); //last three words only
        return {
            queryPhrase: queryPhrase,
            queryText: queryPhrase,
            queryContext: context
        }
    } else {
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


var user_query = 'A complex network can be considered as a graph containing a large collection of nodes connected by links representing various complex interactions among the nodes. In this paper, a novel'
var query_obj = parseQuery(user_query);

var queryPhrase = query_obj.queryPhrase;
var queryText = query_obj.queryText;
var queryContext = query_obj.queryContext;

var doc_index = 'influence_max_x';
var doc_type = 'research';
var doc_size = 3;
var fragment_size = 300;
var number_of_fragments = 3;


var boost_phrase = 2;
var boost_context = 0
var fuzziness_phrase = 1;
var fuzziness_context = 1;
var writing_sections = ['conclusion', 'relatedwork', 'introduction']


//prepare search object fields
var highlight = {
    fragment_size: fragment_size,
    fields: {
        'doc.text': {
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
if (writing_sections && writing_sections.length > 1) {
    writing_sections.forEach((section) => {
        query.bool.filter.bool.should.push(
            {
                "term": {
                    "doc.doc_type": section
                }
            }
        );
    })
}

//phrase
if (queryPhrase) {
    query.bool.should.push({
        match_phrase: {
            "doc.text": {
                query: queryPhrase,
                boost: boost_phrase + 10,
                "slop": 2
            }
        }
    });
}

//text - fuzzy
if (queryText) {
    query.bool.should.push({
        match: {
            "doc.text": {
                query: queryText,
                boost: boost_phrase + 2,
                fuzziness: fuzziness_phrase
            }
        }
    });
}

//context
if (queryContext) {
    query.bool.should.push({
        match: {
            "doc.text": {
                query: queryContext,
                boost: boost_context,
                fuzziness: fuzziness_context
            }
        }
    });
}


console.log(JSON.stringify(query, null, 5));

var returnFields = ['highlight', 'doc.from_paper', 'doc.doc_type']
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

//conduct search
client.search(searchObj).then((data) => {
    console.log(JSON.stringify(data, null, 5));
}, (err) => {
    console.log(err);
});



// GET influence_max_x/_search
// {
//   "size": 5,
//   "_source": {
//     "includes": [
//       "highlight"
//     ]
//   },
//   "query": {
//     "bool": {
//       "must": {
//         "match_phrase": {
//           "doc.text": {
//             "query": "Social network is",
//             "boost": 2
//           }
//         }
//       },
//       "should": {
//         "match": {
//           "doc.text": {
//             "query": "A complex network can be considered as a graph containing a large collection of nodes connected by links representing various complex interactions among the nodes.",
//             "boost": 1
//           }
//         }
//       },
//       "filter": [
//         {
//           "term": {
//             "doc.doc_type": "introduction"
//           }
//         }
//       ]
//     }
//   },
//   "highlight": {
//     "fragment_size": 300,
//     "fields": {
//       "_all": {
//         "pre_tags": [
//           "<em>"
//         ],
//         "post_tags": [
//           "</em>"
//         ]
//       },
//       "doc.text": {
//         "number_of_fragments": 3,
//         "order": "score"
//       }
//     }
//   }
// }




// var query = {
//     bool: {
//         // must: [
//         //     {
//         //         match_phrase: {
//         //             "doc.text": {
//         //                 query: query_text,
//         //                 boost: boost_phrase
//         //                 // fuzziness: fuzziness_phrase
//         //             }
//         //         }
//         //     }
//         // ],
//         should: [
//             {
//                 match_phrase: {
//                     "doc.text": {
//                         query: query_text,
//                         boost: boost_phrase + 10,
//                         "slop": 2
//                     }
//                 }
//             },
//             {
//                 match: {
//                     "doc.text": {
//                         query: query_text,
//                         boost: boost_phrase + 2,
//                         fuzziness: fuzziness_phrase
//                     }
//                 }
//             },
//             {
//                 match: {
//                     "doc.text": {
//                         query: query_context,
//                         boost: boost_context,
//                         fuzziness: fuzziness_context
//                     }
//                 }
//             }

//         ]
//         ,
//         filter: {
//             bool: {
//                 should: [
//                     {
//                         "term": {
//                             "doc.doc_type": 'relatedwork'
//                         }
//                     },
//                     {
//                         "term": {
//                             "doc.doc_type": 'conclusion'
//                         }
//                     }
//                 ]
//             }
//         }
//     }
// }
