var login = require('facebook-chat-api'),
    fs = require('fs');
var Clarifai = require('./clarifai_node.js');
var google = require('google');
google.resultsPerPage = 5;


var secretData = JSON.parse(fs.readFileSync('secretData.json', 'utf8'));
var foodItems = fs.readFileSync('food.txt', 'utf8');

Clarifai.initAPI(secretData.clarifai_id, secretData.clarifai_secret);


var userDB = {};



login(
    {
        email: secretData.email,
        password: secretData.password
        
    }, 
    function callback (err, api) {
    api.listen(function(err, event) {
        
        if(err) return console.error(err);

        switch(event.type) {
          case "message":
              
              if(event.body == "help"){
                  api.sendMessage("Hi, I'm Foodini, a personal assistant to help you decide what to eat!\n"
                                    + "To get a recipe, first send me 'new recipe'.\n"
                                    + "Then, send me some pictures of ingredients you have in your house.\n"
                                    + "If I'm unable to identify an ingredient from the picture, you can just "
                                    + "enter the food ingredient as text. When you're done with the ingredients, "
                                    + "just send me 'find recipe' and I'll find you the perfect meal.\n"
                                    + "Happy Foodining!", event.threadID);
                return;
              }
              
              if(!(event.threadID in userDB) || event.body.trim() =="new recipe"){ //if its a new user or a new recipe
              
                  userDB[event.threadID] = {                                        // remove+add user to db
                  
                      items: []
                  
                  };
                  api.sendMessage("Creating a new recipe for user "+event.senderName+". Send pictures of ingredients or just ingredient names to add them to the ingredient list, and send 'find recipe' to get your recipe.",event.threadID);
                  return;
              }
                if(event.body.startsWith("remove")){
                    for(var i = 0; i < userDB[event.threadID].items.length; i++){
                        if(event.body.indexOf(userDB[event.threadID].items[i]) != -1){
                            userDB[event.threadID].items.splice(i,1);
                            break;
                        }
                    }
                    return;
                }
                if(event.body == "list"){
                    var list="";
                    for(var i = 0; i < userDB[event.threadID].items.length; i++){
                        list+= userDB[event.threadID].items[i]+"\n";
                    }
                    api.sendMessage(list,event.threadID);
                    return;
                }
                if(event.body && event.body.trim().toLowerCase()=="find recipe"){
                    
                    var query = "";
                    
                    for(var i = 0; i < userDB[event.threadID].items.length; i++){
                        query+= userDB[event.threadID].items[i]+" ";
                    }
                        
                    google(query+" recipe", function(err, res){
                        
                        api.sendMessage("Here's a recipe that you might like:\n " 
                            + res.links[0].description, event.threadID); 
                            
                        api.sendMessage(res.links[0].title+":\n"
                        +res.links[0].link, event.threadID); 
                        
                        userDB[event.threadID] = {                                        // remove+add user to db
                          items: []
                        };
                        
                    });
                    return;
                }
            if(event.attachments.length > 0 && (event.attachments[0].type == "photo" || event.attachments[0].type == "animated_image")){
                var testImageURL = event.attachments[0].url;
                
                var ourId = Math.random()+"foodini"; // this is any string that identifies the image to your system
                
                
                Clarifai.tagURL(testImageURL , ourId, function(err, res){
                    var i=0;
                    var tag = res.results[0].result.tag.classes[i];
                    while(foodItems.indexOf(tag) == -1){
                        i++;
                        if(i == res.results[0].result.tag.classes.length)    //prevent indexoutofbounds
                            return api.sendMessage("We could not identify this food ingredient. You can enter its name as plain text to include it in the list.", 
                                event.threadID);
                        tag = res.results[0].result.tag.classes[i];
                    }
                    
                    
                    userDB[event.threadID].items.push(tag);
                
                    api.sendMessage("Added ingredient '"+tag+"'.", 
                    event.threadID);
                });
            }else{
                
                userDB[event.threadID].items.push(event.body);
                
                 api.sendMessage("Added ingredient '"+event.body+"'.", 
                    event.threadID);
            }
            break;
          case "event":
           
            break;
        }
    });
});
