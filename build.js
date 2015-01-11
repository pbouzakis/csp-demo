var fs = require("fs");
var browserify = require("browserify");
var to5ify = require("6to5ify");

browserify({ debug: true })
    .transform(to5ify.configure({
        runtime: true
    }))
    .add("./main.js")
    .bundle()
    .on("error", function (err) { console.log("Error : " + err.message); })
    .pipe(fs.createWriteStream("public/bundle.js"));
