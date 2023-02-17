require('dotenv').config({ silent: true, path: '../.env' });
const { authenticate } = require('./middleware/authenticate');
const elasticsearch = require('elasticsearch');
const fs = require('fs');
const rimraf = require('rimraf');
const sourceJSON = process.env.GROBID_OUTPUT;
const defaultResearchIndex = process.env.ELASTICSEARCH_IG_INDEX;
const uuidv1 = require('uuid/v1');
const client = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_HOST
});


//========= Http Services ===============
var services = function (app) {
    /**
      * @swagger
      * /api/ReplicateRepository:
      *   post:
      *     description: Replicate the index from one place to another
      *     tags: [ElasticSearch]
      *     consumes:
      *       - application/x-www-form-urlencoded
      *       - application/json
      *       - application/xml
      *     produces:
      *       - application/json
      *       - application/xml
      *       - text/yaml
      *     parameters:
      *       - name: x-auth
      *         in: header
      *         description: an authorization header
      *         required: true
      *         type: string
      *         default: 
      *       - name: indeRep
      *         description: The index for replication
      *         in: formData
      *         required: true
      *         type: string
      *         default: influence_max_x
      *       - name: typeRep
      *         description: The type for replication
      *         in: formData
      *         required: false
      *         type: string
      *         default: research
      *       - name: sourceHost
      *         description: Connection string of Host
      *         in: formData
      *         required: true
      *         type: string
      *         default: http://localhost:9200
      *       - name: targetHost
      *         description: Connection string of target
      *         in: formData
      *         required: true
      *         type: string
      *         default: https://search-cbaelastic-7myu5373eaijy4yz54tloikbje.ap-southeast-2.es.amazonaws.com
      *     responses:
      *       200:
      *         description: processed
      *       400:
      *         description: Bad Request - missing paramters
      *       404:
      *         description: No matching results
      *       500:
      *         description: Server error
      */


    app.post('/api/ReplicateRepository', authenticate, function (req, res) {
        console.log('Elasticsearch - Replicate the knowledge from one repository to another');

        var sourceHost = req.body.sourceHost;
        var targetHost = req.body.targetHost;
        var indexRep = req.body.indeRep;
        var typeRep = req.body.typeRep;

        const clientSource = new elasticsearch.Client({
            host: sourceHost,
            requestTimeout: 30000
        });

        const clientTarget = new elasticsearch.Client({
            host: targetHost,
            requestTimeout: 30000
        });

        //obtain the document id list from the source host

        var searchObj = {
            index: indexRep,
            type: typeRep,
            size: 10000,
            _source: ["_id"],
        }

        res.status(200).send('The request is being processed...');

        getAllDocIDPromise(clientSource, searchObj)
            .then(async (data) => {
                var count = 0;
                
                for (var i = 0; i < data.length; i++) {
                    await getDocByIDPromise(clientSource, data[i])
                        .then((documentObject) => {
                            return insertDocPromise(clientTarget, documentObject);
                        })
                        .then((result) => {
                            count++;
                            console.log('complete: ', count, '/', data.length);
                        })
                        .catch((e) => {
                            count++;
                            console.log(e.message);
                        });

                    console.log('---------------------------');
                }
            })
            .catch((ex) => {
                console.log(ex);
            });
    });

    /**
     * @swagger
     * /api/IngestParagraphs:
     *   post:
     *     description: Ingest JSON files to the search engine
     *     tags: [ElasticSearch]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *       - name: ingest_from
     *         in: formData
     *         type: string
     *         description: the folder where JSON files locate
     *         required: false
     *         default: 
     *       - name: researchIndex
     *         in: formData
     *         type: string
     *         description: the index of elasticsearch to be ingested
     *         required: false
     *         default: 
     *     responses:
     *       200:
     *         description: processed
     *       404:
     *         description: No matching results
     *       500:
     *         description: Server error
     */

    app.post('/api/IngestParagraphs', function (req, res) {
        var ingest_from = req.body.ingest_from === undefined ? sourceJSON : req.body.ingest_from
        var researchIndex = req.body.researchIndex === undefined ? defaultResearchIndex : req.body.researchIndex
        
        var dirs = fs.readdirSync(ingest_from);
        var jsonFiles = [];
        dirs.forEach((fileName) => {
            var filePath = `${ingest_from}/${fileName}`;
            if (filePath.includes('.json')) {
                jsonFiles.push(filePath);
            }
        })

        if (jsonFiles.length > 0) {
            recursiveIngestion(0, jsonFiles, 0, researchIndex)
            res.status(200).send('Ingestion Launched!');
        } else {
            res.status(500).send('No json files');
        }



    });
}

//=======================================

var ingestPromise = (elasticObject) => {
    return new Promise((resolve, reject) => {
        client.create(elasticObject, function (error, response) {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    })
}

function recursiveIngestion(index, jsonFiles, fileIndex, researchIndex) {
    var paragraphs = require(jsonFiles[fileIndex]);
    var paragraph = paragraphs[index];

    //multiple paragraphs 
    var elasticObject = {
        index: researchIndex,
        type: 'research',
        id: uuidv1(),
        body: {
            paper_id: paragraph.paper_id,
            from_paper: paragraph.fromPaper,
            paragraph_no: paragraph.paragraphNo,
            head: paragraph.head.text,
            n: paragraph.head.n,
            doc_type: paragraph.head.type,
            text: paragraph.paragraphs
        }
    }

    // console.log(elasticObject)

    ingestPromise(elasticObject)
        .then((response) => {
            console.log(response._id + ' has been ingested!');
            if (index + 1 < paragraphs.length) {
                recursiveIngestion(index + 1, jsonFiles, fileIndex, researchIndex);
            } else if (fileIndex + 1 < jsonFiles.length) {
                recursiveIngestion(0, jsonFiles, fileIndex + 1, researchIndex);
            } else {
                //recycle
                // rimraf(sourceJSON, () => {
                //     fs.mkdirSync(sourceJSON);
                // });
            }
        })
        .catch((ex) => {
            console.log(ex.message);
        })
}



//==============================
var getAllDocIDPromise = ((client, searchObj) => {
    return new Promise((resolve, reject) => {
        client.search(searchObj).then((data) => {
            var documentIDList = [];
            if (data.hits.total == 0) {
                reject('No matching results');
            }
            else {
                for (var i = 0; i < data.hits.hits.length; i++) {
                    documentIDList.push({
                        "index": data.hits.hits[i]._index,
                        "type": data.hits.hits[i]._type,
                        "id": data.hits.hits[i]._id
                    });
                }
                resolve(documentIDList);
            }
        }, (err) => {
            reject(err.message);
        });
    });
});

var getDocByIDPromise = ((client, documentIDObject) => {
    return new Promise((resolve, reject) => {
        var searchObj = {
            index: documentIDObject.index,
            type: documentIDObject.type,
            body: {
                query: {
                    term: { _id: documentIDObject.id },
                }
            }
        }

        //conduct search
        client.search(searchObj).then((data) => {
            if (data.hits.total != 0) {
                resolve(data.hits.hits[0]);
            } else {
                reject("cannot find the file");
            }
        }, (err) => {
            reject(err.message);
        });
    });
});

var insertDocPromise = ((client, documentObject) => {
    return new Promise((resolve, reject) => {

        var elasticObject = {
            index: documentObject._index,
            type: documentObject._type,
            id: documentObject._id,
            body: documentObject._source
        };

        client.create(elasticObject, function (error, response) {
            if (error) {
                console.log(error.message);
                reject(error);
            } else {
                resolve(response);
            }
        });

    });
});

//========= Exports ===============
module.exports = { services }