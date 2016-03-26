var login = require('facebook-chat-api'),
    fs = require('fs');
var Clarifai = require('./clarifai_node.js');

Clarifai.initAPI("sd6G4O9OIMIRBBPV069mz9DxvxdZLYalePN554_k","1oLEWf0LEC-o0g7bGjQ5fzSxiYyfaSEymTqoPeZH");


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
