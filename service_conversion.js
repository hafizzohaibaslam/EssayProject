require('dotenv').config({ silent: true });
const exec = require('child_process').exec;
const grobidMaster = process.env.GROBID_MASTER;
const inputSource = process.env.GROBID_INPUT;
const outputTarget = process.env.GROBID_OUTPUT;

const parseString = require('xml2js').parseString;
const fs = require('fs');
const uuidv1 = require('uuid/v1');


//========= Http Services ===============
var services = function (app) {

    /**
     * @swagger
     * /api/ConvertPapers:
     *   post:
     *     description: Convert papers into TEI
     *     tags: [Conversion]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *       - name: source_folder
     *         in: formData
     *         type: string
     *         description: the folder where research articles locate
     *         required: false
     *         default: 
     *       - name: target_folder
     *         in: formData
     *         type: string
     *         description: the folder where converted TEI files stored
     *         required: false
     *         default: ./dataset
     *     responses:
     *       200:
     *         description: processed
     *       404:
     *         description: No matching results
     *       500:
     *         description: Server error
     */

    app.post('/api/ConvertPapers', function (req, res) {
        console.log('Convert Papers');
        var source_folder = req.body.source_folder === undefined ? inputSource : req.body.source_folder
        var target_folder = req.body.target_folder === undefined ? outputTarget : req.body.target_folder

        var cmd = `java -Xmx4G -jar "${grobidMaster}/grobid-core/build/libs/grobid-core-0.5.2-SNAPSHOT-onejar.jar" -gH "${grobidMaster}/grobid-home" -dIn "${source_folder}" -dOut "${target_folder}" -exe processFullText`;
        var exec = require('child_process').exec;
        var convertProcess = exec(cmd);

        var result = "";
        convertProcess.stdout.on('data', (data) => {
            result += data;
        });
        convertProcess.on('close', (code) => {
            console.log(result);
            res.status(200).send(result);
        });

        //show the process
        convertProcess.stderr.on('data', (data) => {
            console.log(data);
        });

    });

    /**
     * @swagger
     * /api/ConvertTEI:
     *   post:
     *     description: Convert TEI to JSON
     *     tags: [Conversion]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *       - name: source_folder
     *         in: formData
     *         type: string
     *         description: the folder where TEI files locate
     *         required: false
     *         default: 
     *       - name: target_folder
     *         in: formData
     *         type: string
     *         description: the folder where converted JSON stores
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

    app.post('/api/ConvertTEI', function (req, res) {
        var source_folder = req.body.source_folder === undefined ? `${outputTarget}/` : req.body.source_folder + '/'
        var target_folder = req.body.target_folder === undefined ? `${outputTarget}/` : req.body.target_folder + '/'
        readFiles(source_folder, (filename, xml) => {
            // console.log(filename, xml);
            parseString(xml, function (err, result) {
                var paragraphs = encapsulation(result, filename);
                if (paragraphs) {
                    fs.writeFileSync(`${target_folder}/${filename}.json`, JSON.stringify(paragraphs, null, 5));
                    //ingest into the elasticsearch directly
                    //recursiveApproah(paragraphs, 0);
                }
                // console.log(paragraphs);
            });
        }, (ex) => {
            console.log(ex);
        })
        res.status(200).send('TEI -> JSON Conversion is happening!');
    });
}

//========= Exports ===============
module.exports = { services }


function readFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            var filePath = dirname + filename;
            if (fs.lstatSync(filePath).isFile()) {
                var content = fs.readFileSync(filePath, 'utf-8');
                onFileContent(filename, content);
            }
        });
    });
}

function encapsulation(result, filename) {
    if (result === undefined) return undefined;
    var paperId = uuidv1();
    console.log(paperId)
    var paragraphs = [];

    //get abstract as part of the paragraphs
    if (result.TEI.teiHeader[0]
        && result.TEI.teiHeader[0].profileDesc[0]
        && result.TEI.teiHeader[0].profileDesc[0].abstract[0]) {
        var abstract = result.TEI.teiHeader[0].profileDesc[0].abstract[0].p[0];
        paragraphs.push({
            head: {
                n: '0',
                text: 'abstract'
            },
            paragraphs:
                [
                    abstract
                ]
        });
    }

    //get the main contents
    var contentBodyDivArray = result.TEI.text[0].body[0].div;
    if (contentBodyDivArray === undefined) return;
    contentBodyDivArray.forEach((div) => {
        var divObj = parseDiv(div)
        if (divObj === undefined) return;
        else paragraphs.push(divObj);
    });

    //no contents
    if (paragraphs.length === 0) {
        // console.log(filename, 'xxxxxx kill it! xxxxx')
        return undefined;
    }

    //assign types and id
    paragraphs.forEach((paragraph) => {
        if (paragraph) paragraph.paper_id = paperId;
        if (paragraph.head) paragraph.head.type = ruleBasedClassification(paragraph.head.text);
    });

    //type re-calibration
    var currentType = 'introduction';
    for (var i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].head &&
            paragraphs[i].head.type &&
            paragraphs[i].head.type != 'unknown') {
            currentType = paragraphs[i].head.type;
        }

        if (paragraphs[i].head &&
            paragraphs[i].head.type === 'unknown') {
            paragraphs[i].head.type = currentType;
        }

        if (paragraphs[i].head === undefined) {
            paragraphs[i].head = {
                type: currentType
            }
        }
        //give an passage id
        paragraphs[i].paragraphNo = i;
    }

    //add fromPaper to each of the paragraphs
    var fromPaper = '';
    if (result.TEI.teiHeader[0] &&
        result.TEI.teiHeader[0].fileDesc[0] &&
        result.TEI.teiHeader[0].fileDesc[0].titleStmt[0] &&
        result.TEI.teiHeader[0].fileDesc[0].titleStmt[0].title[0]) {
        fromPaper = result.TEI.teiHeader[0].fileDesc[0].titleStmt[0].title[0]._;
    } else {
        fromPaper = filename;
        // console.log(filename);
    }

    paragraphs.forEach((paragraph) => {
        paragraph.fromPaper = fromPaper;
    });

    return paragraphs;
}

function parseDiv(div) {
    if (div.p === undefined || checkSpam(div)) return undefined;
    var paragraphObj = {};

    //add head
    var thisHead = processHead(div);
    if (thisHead) paragraphObj.head = thisHead;

    //add body
    div.p.forEach((paragraph) => {
        var thisParagraph = '';
        if (typeof (paragraph) === "object")
            thisParagraph = paragraph._;
        else
            thisParagraph = paragraph;

        thisParagraph = processText(thisParagraph);
        if (thisParagraph) {
            if (paragraphObj.paragraphs === undefined) paragraphObj.paragraphs = [];
            paragraphObj.paragraphs.push(thisParagraph)
        }
    });
    return paragraphObj;
}

function checkSpam(div) {
    var score = 0;
    var headStr = JSON.stringify(div.head[0], null, 4);
    if (headStr.toLowerCase().trim().includes('algorithm')) score += 50;
    if (div.formula) score += 20;

    if (score > 50) return true;
    else return false;
}

function processText(text) {
    // text = text.replace(/\[([0-9\,]*)\]/g, '');  //remove all the references [12]
    text = text.replace(/(\ *|)(\[([0-9\,]*)\])(\ *|)/g, '');
    text = text.replace(/(\ *|)(�)(\ *|)/g, ''); //remove the symbols that not recognized
    text = text.replace(/  /g, ' '); //remove extra space
    // text += '\n'; //give a new line for each paragraph
    return text;
}

function processHead(div) {
    var newHead = {};
    if (div.head[0]._) {
        if (div.head[0].$.n) newHead = { n: div.head[0].$.n, text: div.head[0]._ };
        else newHead = { text: div.head[0]._ };
    }
    if (div.head[0]._ === undefined && div.head[0]) newHead = { text: div.head[0] };

    if (/^[0-9]+$/.test(newHead.text) === true) {
        return undefined;
    }
    return newHead;
}

function ruleBasedClassification(title) {
    //Abstract, Introduction, Related Work, Modelling, Conclusion
    title = title.toLowerCase().trim();
    if (title.includes('abstract'))
        return 'abstract';

    if (title.includes('introduction') ||
        title.includes('contribution'))
        return 'introduction';

    if (title.includes('related work') ||
        title.includes('literature') ||
        title.includes('review') ||
        title.includes('preliminar') ||
        title.includes('background'))
        return 'relatedwork'

    if (title.includes('experiment') ||
        title.includes('dataset') ||
        title.includes('data set') ||
        title.includes('data process') ||
        title.includes('evaluat') ||
        title.includes('metrics'))
        return 'experiment'

    if (title.includes('conclusion') ||
        title.includes('future work') ||
        title.includes('summary'))
        return 'conclusion'

    if (title.includes('acknowledgment') ||
        title.includes('reference'))
        return 'acknowledgement'

    if (title.includes('model') ||
        title.includes('definition') ||
        title.includes('approach') ||
        title.includes('notation') ||
        title.includes('formulation') ||
        title.includes('proposed'))
        return 'modelling'

    return 'unknown'

}

//==================================

//convert into the plain text
function obtainContent(result) {
    var contentBodyDivArray = result.TEI.text[0].body[0].div;
    // console.log(contentBodyDivArray[0].p)
    var contentArray = [];
    contentBodyDivArray.forEach((div) => {
        var divObj = parseDiv(div)
        if (divObj === undefined) return;
        if (divObj.head.n && divObj.head.text)
            contentArray.push(`${divObj.head.n} ${divObj.head.text} \n`);
        if (divObj.head.n === undefined && divObj.head.text)
            contentArray.push(`${divObj.head.text} \n`);

        divObj.paragraphs.forEach((paragraph) => {
            contentArray.push(`${paragraph} \n`);
        });
    });
    return contentArray;
}
