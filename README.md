# IC BLOG sample app


It is the icblog from @lukas_icp with some modification. This is very bad factorized and is the results of a few weeks of try and error after years of not touching it. So svelte and motoko arent in my skillset yet. If you are looking for clean code, well, you can help improving this one ;D

I am adding a Gallery section having the following characteristic :
- packery gallery
- Dynamic upload and delete, only possible when you are connected


### Backend

Image a stored on the ICP chain

### Requirements

This gallery is optimised with pictures having size assembled from block of 200px.


## Local deployment 

We assume that you have:
- [Dfnity SDK](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins) installed
- NodeJS installed

Once you have cloned the repository, follow this process in your terminal:

1. In your project directory, run this command to install JS dependencies:
```
$ npm install
```
2. Start local Internet Computer replica (or open a new terminal window and run it without the --background parameter):
```
$ dfx start --background 
```
3. Deploy your canisters locally:
```
$ dfx deploy
```
4. Run local dev server:
```
$ npm run dev
```
You should see a localhost URL looking like this "Local: http://localhost:3000/" in your terminal. Open this in your web browser and see the app running.

Canisters are working in anonymous mode for local development. In production, we want create/update/delete methods to be allowed only for not anonymous users. This happens automatically based on global env variable in the frontend:
```
const [blog] = process.env.NODE_ENV == "production" ? useCanister("blog") : useCanister("blog", { mode: "anonymous" })
```
In the backend, this part of code is currently commented for local development:
```
if(Principal.isAnonymous(msg.caller)){ // Only allows signed users to create a posts
    return #err(#UserNotAuthenticated); // If the caller is anonymous Principal "2vxsx-fae" then return an error
};
```
## Deploy to the mainnet

If you have working local development replica, you can deploy your project to the mainnet by running this command:
```
$ dfx deploy --network ic
```
You are going to need a cycles wallet. Go through [this tutorial](https://internetcomputer.org/docs/current/developer-docs/quickstart/network-quickstart) to make it working.

# Footnote

This project was created by Lukas Vozda, big Dfinity supporter. If you want to reach out to me and ask some qustion here are my social network handles:

- @lukas on Open Chat
- @lukas_icp on Twitter