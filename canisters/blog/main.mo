import List "mo:base/List";
import Time "mo:base/Time";
import Map "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

actor {

    type PostId = Nat;

    // Post type is going to represent each post. You can add your own attributes.
    type Post = {
        title : Text;
        time_created: Time.Time;
        time_updated: Time.Time;
        content : Text;
        description : Text;
        published : Bool;
        author : Principal;
        tags : [Text]
    }; 

    // Custom error types, you can define your own error type for situations that can go wrong.
    type Error = {
      #PostNotFound;
      #UserNotAuthenticated;
      #EmptyTitle;
    };

    // Stable variable that will store an index to create new posts in the create function.
    private stable var next : PostId = 1;
    
    /* 
    Stable array that will be used to keep posts between updates.
    We need this because HashMap that we use to store posts is not stable storage.
    */  
    private stable var stableposts : [(PostId, Post)] = [];
        
    // Function for equality check
    let eq: (Nat, Nat) -> Bool = func(x, y) { x == y };

    /*
        This is our database. I choose HashMap as it can store a lot of posts and read them individually effectively. 
        HashMap is not a stable storageu, that is why we also defined stable array stableposts and preupgrade and postupgrade functions
    */
    private var blogposts = Map.HashMap<PostId, Post>(0, eq, Hash.hash);

    // Preupgrade function will store all posts into stable array before update
    system func preupgrade() {
        stableposts := Iter.toArray(blogposts.entries());
    };

    // Postupgrade function will then poppulate HashMap with posts after the update is finished
    system func postupgrade() {
        blogposts := Map.fromIter<PostId, Post>(stableposts.vals(), 10, eq, Hash.hash);
        stableposts := []; // reset stable storage once it is done
    };
    
    /*
        Create function takes care of post creation. 
        It expects a simplified version of Post type as only some attributes are defined by the user.
        Attributes like time_upated or author are defined in the backend.
    */
    public shared(msg) func create(post : {title : Text; description : Text; content : Text; published : Bool; tags : [Text]}): async Result.Result<(),Error> {
        // Commented for local development, be sure to uncomment this for production use
        // if(Principal.isAnonymous(msg.caller)){ // Only allows signed users to create a posts
        //     return #err(#UserNotAuthenticated); // If the caller is anonymous Principal "2vxsx-fae" then return an error
        // };

        // Title is required in the fron-tend, but we can also check in the backend
        if(post.title == ""){ 
          return #err(#EmptyTitle) 
        };

        let postId = next;
        next += 1; // increment the counter so we never try to create a post under same index

        let blogpost: Post = {
            time_created = Time.now(); // Time is assigned on the backend side
            time_updated = Time.now();
            title = post.title; 
            description = post.description;
            content = post.content;
            published = post.published;
            author = msg.caller; // Author is assigned on the backend side too
            tags = post.tags;
        };
        
        blogposts.put(postId, blogpost);
        return #ok(()); // Return an OK result
    };

    // Function for reading individuall post. We could return an optional ?Post type, but for unity, lets return also a Result type
    // Unlike for post create, update and delete, we don't need the user to be authenticated for post reading.
    public query func get(id : PostId) : async Result.Result<Post, Error> {
        let post = blogposts.get(id);
        return Result.fromOption(post, #PostNotFound); // If the post is not found, this will return an error as result.
    };

    // Function for post updating. Very similar to create function, only excepts ID of the post.
    public shared(msg) func update(id : PostId, post : {title : Text; description : Text; content : Text; published : Bool; tags : [Text]}) : async Result.Result<(),Error> {
        // commented for local development 
        // if(Principal.isAnonymous(msg.caller)){
        //     return #err(#UserNotAuthenticated); // We require the user to be authenticated,
        // };

        if(post.title == ""){
          return #err(#EmptyTitle) // We don't want the title to be empty, also checked in the front-end.
        };
                
        let result = blogposts.get(id); // Try to get the blogpost
        // Now handle the result
        switch (result){
            case null { // If the result is null, we return a PostNotFound error.
                return #err(#PostNotFound);
            };
            case (? v){ // If post was found, we try to update it.
                let blogpost : Post = {
                    time_created = v.time_created; // We don't touch time_created anymore.
                    time_updated = Time.now(); // Only update time_updated attribute.
                    title = post.title; // Assign new values for the update.
                    content = post.content;
                    description = post.description;
                    published = post.published;
                    author = v.author; // We could but we don't change the author – we keep the principal of the initial author.
                    tags = post.tags;
                };
                blogposts.put(id, blogpost);
            };
        };
        return #ok(()); // If all goes fine, return an OK result.
    };


    // Function for deleting a post is simple. We only want the user to be authenticated.
    public shared(msg) func  delete(id : PostId) : async Result.Result<(),Error> {
      if(Principal.isAnonymous(msg.caller)){
        return #err(#UserNotAuthenticated);
      } else {
        blogposts.delete(id);
        return #ok(());
      }
    };

    public query func get_all_posts() : async List.List<Post> {
        let iter = blogposts.entries();
        var post_list : List.List<Post> = List.nil();

        for ((postNat, post) in iter){
            //Prim.debugPrint(debug_show(post_list));
            post_list := List.push<Post>(post, post_list);
        };
        return post_list;
    };

    // Lists all posts. We could check for the msg.caller (if authenticated) for 100 % prevention of anonymous users reading unpublished articles.
    // But this would make the call to take longer so we check authentication in the front-end only as we are not working with sensitive data.
    public query func list_all(): async [(PostId, Post)] {
        return Iter.toArray(blogposts.entries());
    };

    // Internal function that returns BOOL for the published attribute.
    func published((id : PostId, p : Post)) : Bool {
      return p.published
    };

    // Returns only published posts.
    public query func list_published(): async [(PostId, Post)] {
        return Array.filter(Iter.toArray(blogposts.entries()), published);
    };  
};