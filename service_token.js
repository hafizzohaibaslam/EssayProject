require('dotenv').config({ silent: true });
const jwt = require('jsonwebtoken');
const key = process.env.CBA_SECRET;



module.exports = function (app) {

    /**
     * @swagger
     * /api/cbaauth/GenerateToken:
     *   get:
     *     description: Generate a token
     *     tags: [CBA Auth]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *        - in: query
     *          name: userid
     *          schema:
     *          type: string
     *          description: user id required for token generation
     *          required: true
     *          default: cbasit
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

    app.get('/api/cbaauth/GenerateToken', function (req, res) {
        console.log('Generate a Token');


        //backend validation
        if (req.query.userid == undefined) {
            res.status(400).send('Bad Request! User ID (userid) is required!');
            return;
        }

        //parameters
        var userid = req.query.userid;
        var timeflag = new Date().toISOString();
        var payload = {
            userid: userid,
            createdon: timeflag
        };

        //generate token
        var token = jwt.sign(payload, key).toString();


        res.status(200).json({
            token: token
        });

    });

    /**
     * @swagger
     * /api/cbaauth/VerifyToken:
     *   get:
     *     description: Process the document using NLP and ingest to the Elasaticsearch. If the document ID exists, the old doucment will be replaced.  
     *     tags: [CBA Auth]
     *     consumes:
     *       - application/x-www-form-urlencoded
     *       - application/json
     *       - application/xml
     *     produces:
     *       - application/json
     *       - application/xml
     *       - text/yaml
     *     parameters:
     *        - in: query
     *          name: token
     *          schema:
     *          type: string
     *          description: user id required for token generation
     *          required: true
     *          default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOiJjYmFzaXQiLCJjcmVhdGVkb24iOiIyMDE4LTAxLTI0VDIyOjQ2OjI2LjQ0OFoiLCJpYXQiOjE1MTY4MzM5ODZ9.qCl-hXbj_uXWV8uCy7WzgmEqv0NFy2wpw-k5UC9MF6I
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

    app.get('/api/cbaauth/VerifyToken', function (req, res) {
        console.log('Verify a Token');

        //backend validation
        if (req.query.token == undefined) {
            res.status(400).send('Bad Request! Token (token) is required!');
            return;
        }

        //parameters
        var decoded = jwt.verify(req.query.token, key, (err, token) => {
            if (err) {
                res.status(200).json({
                    error: err.message
                });
            } else {
                res.status(200).json(token);
            }
        });

    });

}