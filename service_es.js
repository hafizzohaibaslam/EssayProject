const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config({ silent: true });

var cmd = `${process.env.ELASTICSEARCH_PATH}/bin/elasticsearch.bat`
// var cmd = `${global.__basedir}/${process.env.ELASTICSEARCH_PATH}/bin/elasticsearch.bat`

console.log(cmd);
var launchES = (callback) => {
    if (!fs.existsSync(cmd)) {
        console.log('ElasticSearch Launching Batch is not found!');
        return;
    }

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(stdout);
            // node couldn't execute the command
            return;
        }
        // the *entire* stdout and stderr (buffered)
        callback(stdout)
    });
}


//========= Exports ===============
// module.exports = { launchES }
module.exports.launchES = launchES;