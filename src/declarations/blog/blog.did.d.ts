import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type CreatePostError = { 'UserNotAuthenticated' : null } |
  { 'EmptyTitle' : null } |
  { 'PostNotFound' : null };
export type DeletePostError = { 'UserNotAuthenticated' : null };
export type GetPostError = { 'PostNotFound' : null };
export interface Post {
  'time_created' : Time,
  'title' : string,
  'content' : string,
  'published' : boolean,
  'tags' : Array<string>,
  'description' : string,
  'author' : Principal,
  'time_updated' : Time,
}
export type PostId = bigint;
export type Result = { 'ok' : null } |
  { 'err' : UpdatePostError };
export type Result_1 = { 'ok' : Post } |
  { 'err' : GetPostError };
export type Result_2 = { 'ok' : null } |
  { 'err' : DeletePostError };
export type Result_3 = { 'ok' : null } |
  { 'err' : CreatePostError };
export type Time = bigint;
export type UpdatePostError = { 'UserNotAuthenticated' : null } |
  { 'EmptyTitle' : null } |
  { 'PostNotFound' : null };
export interface _SERVICE {
  'create' : ActorMethod<
    [
      {
        'title' : string,
        'content' : string,
        'published' : boolean,
        'tags' : Array<string>,
        'description' : string,
      },
    ],
    Result_3
  >,
  'delete' : ActorMethod<[PostId], Result_2>,
  'get' : ActorMethod<[PostId], Result_1>,
  'list_all' : ActorMethod<[], Array<[PostId, Post]>>,
  'list_published' : ActorMethod<[], Array<[PostId, Post]>>,
  'update' : ActorMethod<
    [
      PostId,
      {
        'title' : string,
        'content' : string,
        'published' : boolean,
        'tags' : Array<string>,
        'description' : string,
      },
    ],
    Result
  >,
}
