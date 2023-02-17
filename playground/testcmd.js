const { exec } = require('child_process');
exec('dir/w', (err, stdout, stderr) => {
    if (err) {
        console.log(stdout);
        // node couldn't execute the command
        return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});