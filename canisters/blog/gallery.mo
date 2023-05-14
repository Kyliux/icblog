import List "mo:base/List";
import Time "mo:base/Time";
import Map "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Order "mo:base/Order";
import Blob "mo:base/Blob";


actor {

  type NodeId = Nat;

  type MediaData = {
    data : Blob;
    mimeType : Text;
  };

  type Node = {
    title : Text;
    time_created : Time.Time;
    content : Text;
    tags : [Text];
    media : MediaData;
    children : [NodeId];
    parent : NodeId;
  };

  type UploadMediaError = {
    #UserNotAuthenticated;
    #InvalidMimeType;
  };

  type CreateNodeError = {
    #UserNotAuthenticated;
    #EmptyTitle;
  };

  type GetNodeError = {
    #NodeNotFound;
  };

  type UpdateNodeError = {
    #UserNotAuthenticated;
    #NodeNotFound;
    #EmptyTitle;
  };

  type DeleteNodeError = {
    #UserNotAuthenticated;
    #NodeNotFound;
  };

  private stable var next : NodeId = 1;

  private stable var stablenodes : [(NodeId, Node)] = [];

  let eq : (Nat, Nat) -> Bool = func(x, y) { x == y };

  private var nodes = Map.HashMap<NodeId, Node>(0, eq, Hash.hash);

  system func preupgrade() {
    stablenodes := Iter.toArray(nodes.entries());
  };

  system func postupgrade() {
    nodes := Map.fromIter<NodeId, Node>(
      stablenodes.vals(),
      10,
      eq,
      Hash.hash,
    );
    stablenodes := []; 
  };


  // added after
public shared (msg) func update (id : NodeId, node : { title : Text; content : Text; tags : [Text]; media : MediaData; parent : NodeId }) : async Result.Result<(), UpdateNodeError> {
  if(Principal.isAnonymous(msg.caller)){
    return #err(#UserNotAuthenticated);
  };

  if (node.title == "") { return #err(#EmptyTitle) };

  let old_node_opt = nodes.get(id);
  switch (old_node_opt) {
    case (null) { return #err(#NodeNotFound) };
    case (?old_node) {
      let new_node : Node = {
        time_created = old_node.time_created;
        title = node.title;
        content = node.content;
        tags = node.tags;
        media = node.media;
        children = old_node.children;
        parent = node.parent;
      };

      nodes.put(id, new_node);
      return #ok(());
    };
  };
};



public shared (msg) func delete(id : NodeId) : async Result.Result<(), DeleteNodeError> {
  if (Principal.isAnonymous(msg.caller)) {
    return #err(#UserNotAuthenticated);
  };

  let node = nodes.get(id);
  if (node == null) {
    return #err(#NodeNotFound);
  } else {
    nodes.delete(id);
    return #ok(());
  }
};

  // Comparison function that takes 2 nodes as an argument and decides the order of those nodes
  // We sort by the node ID argument, that should give the same order as time_created
  func comp((id1 : NodeId, n1 : Node), (id2 : NodeId, n2 : Node)) : Order.Order {
    if (id1 > id2) {
      return #less; // we want a descendant sort
    } else if (id1 < id2) {
      return #greater;
    } else {
      return #equal;
    };
  };

  // Lists all nodes. We could check for the msg.caller (if authenticated) for 100 % prevention of anonymous users reading unpublished articles.
  // But this would make the call to take longer so we check authentication in the front-end only as we are not working with sensitive data.
  public query func list_all() : async [(NodeId, Node)] {
    return Array.sort(Iter.toArray(nodes.entries()), comp);
  };

  // Lists all nodes having a specific parent
public query func list_by_parent(parent : NodeId) : async [NodeId] {
  let node_opt = nodes.get(parent);
  switch (node_opt) {
    case (null) { return [] };
    case (?node) { return node.children };
  };
};

  // Helper function that checks if a tag is present in a node's tags list
func contains_tag(node : Node, targetTag : Text) : Bool {
  return Array.find<Text>(node.tags, func(tag) { tag == targetTag }) != null;
};

// Function that takes a tag as an argument and lists nodes having at least one similar tag
public query func list_nodes_by_tag(tag : Text) : async [(NodeId, Node)] {
  return Array.filter(
    Iter.toArray(nodes.entries()),
    func((id : NodeId, node : Node)) : Bool { return contains_tag(node, tag); },
  );
};
};

