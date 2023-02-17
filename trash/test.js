var read = require('node-readability');
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
// const { window } = new JSDOM('<hr><BR>');
// var $ = require('jQuery');

// const getJSON = require('get-json');

const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM('<div id="www"></div>');
var $ = require("jquery")(window);





// const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
// console.log(dom.window.document.querySelector("p").textContent); 




// JSDOM.fromURL("https://www.medicalnewstoday.com/articles/320301.php", {}).then(dom => {
//   $('#www').html('');
//   $('#www').append($.parseHTML(dom.serialize()));
//   var text = $('article').text()
//   var html = $('article').html()

//   var regEx = new RegExp(/\/\*(.*)\*\//,'g'); 
//   text = text.replace(/\r?\n|\r/g, " ");
//   text = text.replace(/\s\s+/g, ' ');
//   console.log(text.replace(text.match(regEx), "").trim()); 
//   console.log(html)

//   // console.log(text.match(regEx));
//   // console.log(text);
//   // console.log(text);
// });




read('https://www.medicalnewstoday.com/articles/320301.php', function (err, article, meta) {

  console.log(article.content);

  // Main Article
  // console.log(article.content);
  // Title
  //   console.log(article.title);

  // HTML Source Code
  // console.log(article.html);
  // DOM
  // console.log(article.document);

  // Response Object from Request Lib
    console.log(meta);

  // Close article to clean up jsdom and prevent leaks
  article.close();
});