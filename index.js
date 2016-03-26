var login = require('facebook-chat-api'),
    fs = require('fs');
var Clarifai = require('./clarifai_node.js');

Clarifai.initAPI("sd6G4O9OIMIRBBPV069mz9DxvxdZLYalePN554_k","1oLEWf0LEC-o0g7bGjQ5fzSxiYyfaSEymTqoPeZH");
var stdio = require('stdio');

// support some command-line options
var opts = stdio.getopt( {
	'print-results' : { description: 'print results'},
	'print-http' : { description: 'print HTTP requests and responses'},
	'verbose' : { key : 'v', description: 'verbose output'}
});
var verbose = opts["verbose"];
Clarifai.setVerbose( verbose );
if( opts["print-http"] ) {
	Clarifai.setLogHttp( true ) ;
}

if(verbose) console.log("using CLIENT_ID="+Clarifai._clientId+", CLIENT_SECRET="+Clarifai._clientSecret);


var loginInfo = JSON.parse(fs.readFileSync('secretData.json', 'utf8'));

var users = [];

login(loginInfo, function callback (err, api) {
    api.listen(function(err, event) {
        if(err) return console.error(err);

        switch(event.type) {
          case "message":
            if(event.attachments.length > 0 && (event.attachments[0].type == "photo" || event.attachments[0].type == "animated_image")){
                var testImageURL = event.attachments[0].url;
                api.sendMessage(testImageURL,event.threadID);
                var ourId = "test image"; // this is any string that identifies the image to your system
                Clarifai.tagURL(testImageURL , ourId, function(err, res){
                    api.sendMessage(JSON.stringify(res, null, 4), event.threadID);
                });
            }
            break;
          case "event":
           
            break;
        }
    });
});
