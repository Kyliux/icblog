export const idlFactory = ({ IDL }) => {
  const ContentEncoding = IDL.Variant({
    'GZIP' : IDL.Null,
    'Identity' : IDL.Null,
  });
  const Asset = IDL.Record({
    'id' : IDL.Text,
    'url' : IDL.Text,
    'created' : IDL.Int,
    'content' : IDL.Opt(IDL.Vec(IDL.Vec(IDL.Nat8))),
    'owner' : IDL.Text,
    'path' : IDL.Text,
    'chunks_size' : IDL.Nat,
    'canister_id' : IDL.Text,
    'content_size' : IDL.Nat,
    'content_type' : IDL.Text,
    'filename' : IDL.Text,
    'content_encoding' : ContentEncoding,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Vec(Asset), 'err' : IDL.Text });
  const Chunk_ID = IDL.Nat;
  const AssetProperties = IDL.Record({
    'content_type' : IDL.Text,
    'filename' : IDL.Text,
    'checksum' : IDL.Nat32,
    'content_encoding' : ContentEncoding,
  });
  const Asset_ID = IDL.Text;
  const Result_3 = IDL.Variant({ 'ok' : Asset_ID, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : Asset, 'err' : IDL.Text });
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
  });
  const StreamingCallbackToken = IDL.Record({
    'chunk_index' : IDL.Nat,
    'asset_id' : IDL.Text,
    'content_encoding' : IDL.Text,
  });
  const StreamingStrategy = IDL.Variant({
    'Callback' : IDL.Record({
      'token' : StreamingCallbackToken,
      'callback' : IDL.Func([], [], []),
    }),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'streaming_strategy' : IDL.Opt(StreamingStrategy),
    'status_code' : IDL.Nat16,
  });
  const StreamingCallbackHttpResponse = IDL.Record({
    'token' : IDL.Opt(StreamingCallbackToken),
    'body' : IDL.Vec(IDL.Nat8),
  });
  const TimerId = IDL.Nat;
  const FileStorage = IDL.Service({
    'assets_list' : IDL.Func([], [Result_1], ['query']),
    'chunks_size' : IDL.Func([], [IDL.Nat], ['query']),
    'commit_batch' : IDL.Func(
        [IDL.Text, IDL.Vec(Chunk_ID), AssetProperties, IDL.Text],
        [Result_3],
        [],
      ),
    'create_chunk' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8), IDL.Nat],
        [IDL.Nat],
        [],
      ),
    'delete_asset' : IDL.Func([Asset_ID], [Result_2], []),
    'edit_asset_path' : IDL.Func([Asset_ID, IDL.Text], [Result_2], []),
    'filter_assets_list' : IDL.Func([IDL.Text], [Result_1], ['query']),
    'get' : IDL.Func([Asset_ID], [Result], ['query']),
    'haschildren' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'http_request_streaming_callback' : IDL.Func(
        [StreamingCallbackToken],
        [StreamingCallbackHttpResponse],
        ['query'],
      ),
    'is_full' : IDL.Func([], [IDL.Bool], ['query']),
    'start_clear_expired_chunks' : IDL.Func([], [TimerId], []),
    'stop_clear_expired_chunks' : IDL.Func([], [TimerId], []),
    'version' : IDL.Func([], [IDL.Nat], ['query']),
  });
  return FileStorage;
};
export const init = ({ IDL }) => { return []; };
