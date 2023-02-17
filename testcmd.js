// const { exec } = require('child_process');
require('dotenv').config({ silent: true });
const grobidMaster = process.env.GROBID_MASTER;
const inputSource = process.env.GROBID_INPUT;
const outputTarget = process.env.GROBID_OUTPUT;

var cmd = `java -Xmx4G -jar "${grobidMaster}/grobid-core/build/libs/grobid-core-0.5.2-SNAPSHOT-onejar.jar" -gH "${grobidMaster}/grobid-home" -dIn "${inputSource}" -dOut "${outputTarget}" -exe processFullText`
console.log(cmd);

var exec = require('child_process').exec;
var coffeeProcess = exec(cmd);

coffeeProcess.stdout.on('data', function(data) {
    console.log(data); 
});

