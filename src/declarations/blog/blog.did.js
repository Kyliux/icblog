export const idlFactory = ({ IDL }) => {
  const CreatePostError = IDL.Variant({
    'UserNotAuthenticated' : IDL.Null,
    'EmptyTitle' : IDL.Null,
    'PostNotFound' : IDL.Null,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Null, 'err' : CreatePostError });
  const PostId = IDL.Nat;
  const DeletePostError = IDL.Variant({ 'UserNotAuthenticated' : IDL.Null });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : DeletePostError });
  const Time = IDL.Int;
  const Post = IDL.Record({
    'time_created' : Time,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'published' : IDL.Bool,
    'tags' : IDL.Vec(IDL.Text),
    'description' : IDL.Text,
    'author' : IDL.Principal,
    'time_updated' : Time,
  });
  const GetPostError = IDL.Variant({ 'PostNotFound' : IDL.Null });
  const Result_1 = IDL.Variant({ 'ok' : Post, 'err' : GetPostError });
  const UpdatePostError = IDL.Variant({
    'UserNotAuthenticated' : IDL.Null,
    'EmptyTitle' : IDL.Null,
    'PostNotFound' : IDL.Null,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : UpdatePostError });
  return IDL.Service({
    'create' : IDL.Func(
        [
          IDL.Record({
            'title' : IDL.Text,
            'content' : IDL.Text,
            'published' : IDL.Bool,
            'tags' : IDL.Vec(IDL.Text),
            'description' : IDL.Text,
          }),
        ],
        [Result_3],
        [],
      ),
    'delete' : IDL.Func([PostId], [Result_2], []),
    'get' : IDL.Func([PostId], [Result_1], ['query']),
    'list_all' : IDL.Func([], [IDL.Vec(IDL.Tuple(PostId, Post))], ['query']),
    'list_published' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(PostId, Post))],
        ['query'],
      ),
    'update' : IDL.Func(
        [
          PostId,
          IDL.Record({
            'title' : IDL.Text,
            'content' : IDL.Text,
            'published' : IDL.Bool,
            'tags' : IDL.Vec(IDL.Text),
            'description' : IDL.Text,
          }),
        ],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
