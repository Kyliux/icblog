# IC BLOG sample app
This project was created as a sample app for the Internet Computer so new developers to the ecosystem have some working examples to learn from.

You can try running version of this project on this link: [https://gaqra-oqaaa-aaaah-qc4qa-cai.ic0.app](https://gaqra-oqaaa-aaaah-qc4qa-cai.ic0.app)

### Backend
The project consist of a backend written in Motoko programming language, that has been designed specifically for writing smart contracts on the Internet Computer Protocol. You can find backend code in the cansiters/blog/main.mo file.

Backend defines a Post type, HashMap database and methods for CRUD interace. There are also functions for filtering only published posts and sorting posts in the right order.

### Frontend
The front-end is written using the Svelte framework. There are Routes for Create, Read, Update, Delete, List posts. You can find it in the frontend/routes directory.

It should give a quick start to anyone thinking about starting it's own blog site on the Internet Computer or just want to learn how to create a simple dapp.

I use Svelte starter app created by @miamaruq, he also created [starter apps for React, Vue or TS](https://github.com/MioQuispe/create-ic-app). If you want to use different framework, you can follow his repository. This starter app also utilizes the [Connect2IC toolkit](https://github.com/Connect2IC/connect2ic) that simplifies the process of wallet connection for different wallet providers.

## Local deployment 

We assume that you have:
- [Dfnity SDK](https://internetcomputer.org/docs/current/developer-docs/quickstart/hello10mins) installed
- NodeJS installed

Once you have cloned the repository, follow this process in your terminal:

```
run npm install (installs JS dependencies)
dfx start --background (or run it in separate terminal window)
dfx deploy (deploy your canister locally)
npm run dev (run local dev server)
```
Canisters are loaded in anonymous mode for local development. On production, we want create/update/delete methods to be allowed only for not anonymous users. This happens automatically based on global env variable:
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
dfx deploy --network ic
```
You are going to need a cycles wallet. Go through [this tutorial](https://internetcomputer.org/docs/current/developer-docs/quickstart/network-quickstart) to make it working.

# Footnote

This project was created by Lukas Vozda, big Dfinity supporter. If you want to reach out to me and ask some qustion here are my social network handles:

- @lukas on Open Chat
- @lukas_icp on Twitter