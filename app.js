const authentication = require('./authentication.js');



authentication.init_box((client)=>{


  function getFolders(id, depth){
    client.folders.get(id, null, (err, ret)=>{
      if(!ret)return;
      console.log("  ".repeat(depth), ret.name) 
      ret.item_collection.entries.forEach((f) => {
        if(!f) return;
        //console.log("  ".repeat(depth), f.name) 
        getFolders(f.id, depth++);
      });
    });
  }

  client.users.get(client.CURRENT_USER_ID, null, function(err, currentUser) {
    console.log("logged in as", currentUser.name)
    getFolders(0,0);
  });
})
