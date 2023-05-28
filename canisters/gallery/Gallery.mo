actor {


  // Define types for your gallery items and the tree structure
  type GalleryItem = { id: Nat; name: Text; subgallery: ?Gallery };
  type Gallery = [GalleryItem];


  // Our gallery storage
  var galleries : TrieMap.TrieMap<Text, Gallery> = TrieMap.empty();

   func getGallery(path : Text) : async ?Gallery {
    return TrieMap.find(galleries, path);
  };

  public func addGallery(path : Text, gallery : Gallery) : async Bool {
    let _ = TrieMap.put(galleries, path, gallery);
    return true;
  };

  public func addGalleryItem(path : Text, item : GalleryItem) : async Bool {
    let result=TrieMap.find(galleries, path);

      switch (result) {
      case null { // If the result is null, we return a PostNotFound error.
        return #err(#PostNotFound);
      };
      case (?v) {
      (var gallery) {
        gallery := gallery ++ [item];
        let _ = TrieMap.put(galleries, path, gallery);
        true;
      };
    };
  }

  public func removeGalleryItem(path : Text, itemId : Nat) : async Bool {
    switch (TrieMap.find(galleries, path)) {
      null -> false;
      (var gallery) {
        gallery := Array.filter(gallery, func (item) { item.id != itemId });
        let _ = TrieMap.put(galleries, path, gallery);
        true;
      };
    };
  }

};
