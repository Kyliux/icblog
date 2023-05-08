
<script>
import Masonry from "react-masonry-css";

import { createClient } from "@connect2ic/core";
import { defaultProviders } from "@connect2ic/core/providers";
import { ConnectButton, ConnectDialog, Connect2ICProvider } from "@connect2ic/svelte";
import "@connect2ic/core/style.css";

import { onMount } from "svelte";
import { useConnect, useCanister } from "@connect2ic/svelte";
import logo from "../assets/dfinity.svg"

import {Ed25519KeyIdentity} from '@dfinity/identity';
import {HttpAgent} from '@dfinity/agent';
import {AssetManager} from '@dfinity/assets';
import {useEffect, useState} from "react";


import { Link } from "svelte-navigator";

const [gallery ] = useCanister("gallery", { mode: "anonymous" })

let loading = true

const { isConnected, principal } = useConnect({
    onConnect: () => {
        console.log("Connected!")
        list_gallery(true) // List all posts for connected user
    },
    onDisconnect: () => {
        console.log("Disconnected!")
        list_gallery(false) // List only published posts for disconnected user
    }
})

let galleries = []




const list_gallery = async (connected) => {
        let res;
        if (connected || $isConnected) {
            res = await $gallery.list_all() // List all posts
        } else {
            // List only published posts
            // We are doing this in the front end only as data are not sensitive, for 100 % security, we should verify principal in the backend too
            res = await $gallery.list_published()
        }
        galleries = res
        loading = false
        return galleries
}


    // Function that converts unix timestamp to readable date
    function getDate(timestamp) {
        var converted = Number(timestamp) / 1000000;
        var date = new Date(converted);
        var year = date.getFullYear();
        var month = ("0" + (date.getMonth() + 1)).substr(-2);
        var day = ("0" + date.getDate()).substr(-2);


        return year + "-" + month + "-" + day;
    }

    onMount(list_gallery)


    //lots of BS before script tag

    // Get file name, width and height from key
const detailsFromKey = (key) => {
    const fileName = key.split('/').slice(-1)[0];
    const width = parseInt(fileName.split('.').slice(-3)[0]);
    const height = parseInt(fileName.split('.').slice(-2)[0]);
    return {key, fileName, width, height}

}

// Get file name, width and height from file
const detailsFromFile = async (file) => {
    const src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    })
    const [width, height] = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
        img.src = src;
    })
    const name = file.name.split('.');
    const extension = name.pop();
    const fileName = [name, width, height, extension].join('.');
    return {fileName, width, height}
}

const identity = "rsjvk-ewghd-bspjq-u2bdu-5v7h2-ik2ba-7hrz4-r2pm5-fqwom-tzpvz-cqe";
const isLocal = !window.location.host.endsWith('ic0.app');
const agent = new HttpAgent({
    host: isLocal ? `http://127.0.0.1:${window.location.port}` : 'https://ic0.app', identity,
});
if (isLocal) {
    agent.fetchRootKey();
}

// Create asset manager instance for above asset canister
const assetManager = new AssetManager("si2b5-pyaaa-aaaaa-aaaja-cai", { agent});

let  avatar, fileinput;
	
	const onFileSelected =(e)=>{
  let image = e.target.files[0];
            let reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onload = e => {
                 avatar = e.target.result
            };
}


    const uploadPhotos =  () => {

    const [uploads, setUploads] = useState([]);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        assetManager.list()
            .then(assets => assets
                .filter(asset => asset.key.startsWith('/uploads/'))
                .sort((a, b) => Number(b.encodings[0].modified - a.encodings[0].modified))
                .map(({key}) => detailsFromKey(key)))
            .then(setUploads);
    }, []);
    alert("LOL");

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async () => {
            setProgress(0);
            try {
                const batch = assetManager.batch();
                const items = await Promise.all(Array.from(input.files).map(async (file) => {
                    const {fileName, width, height} = await detailsFromFile(file);
                    const key = await batch.store(file, {path: '/uploads', fileName});
                    return {key, fileName, width, height};
                }));
                await batch.commit({onProgress: ({current, total}) => setProgress(current / total)});
                setUploads(prevState => [...items, ...prevState])
            } catch (e) {
                if (e.message.includes('Caller is not authorized')) {
                    alert("Caller is not authorized, follow Authorization instructions in README");
                } else {
                    throw e;
                }
            }
            setProgress(null)
        };
        input.click();
    }




</script>


<!-- rewrite and correct the following block -->







<h1>Gallery Page</h1>

   <p> pure awesomeness</p>
   {#if $isConnected}
   <p>Wallet principal: <span style="font-size: 0.7em">{$principal}</span></p>
   <Link to="/add_gallery" class="add_gallery">Create a gallery</Link> <!-- TODO Only authenticated user can create a post -->
   <button class={'App-upload'} on:click={uploadPhotos}>📂 Upload photo</button>
   
{:else}
   <p class="example-disabled">Connect with a wallet to add a gallery.<br> You are able to see only published gallery now.</p>
{/if}


   <div class="gallery">
    {#each galleries as gallery } <!-- Loop through each post -->
    <div class="gallery">
        <Link to="/gallery/{gallery[0]}"><h2 class="gallery-title">{gallery[1].title}</h2></Link>
        <div class="gallery-description">
            {gallery[1].src}
            <img src={gallery[1].data} alt={gallery[1].title} loading={'lazy'}/>

        </div>
        <p> pure awesomeness</p>
        <div class="date">Last updated: {getDate(gallery[1].time_updated)}</div>
        <div class="tags">
            {#each gallery[1].tags as tag}
                <span class="tag">#{tag}</span>
            {/each}
        </div>
        {#if gallery[1].published}
            <div class="published">Published</div>
        {:else}
            <div class="draft">Draft</div>
        {/if}
    </div>
    {/each}
</div>



<style>
    .gallery {
        text-align: center;
        width: 500px;
        float: none;
        margin-left: auto;
        margin-right: auto;
        margin-top: 100px;
        line-height: 150%;
    }
   
   



    .App-wrapper {
    padding: 10px 10px 0 10px;
}

.App-masonry {
    display: flex;
    margin-left: -10px;
    width: auto;
}

.App-masonry-column {
    padding-left: 10px;
    background-clip: padding-box;
}

.App-upload {
    background: #222222;
    color: #ffffff;
    font-family: sans-serif;
    font-weight: 600;
    width: 100%;
    height: 200px;
    margin-bottom: 10px;
    cursor: pointer;
}

.App-upload:hover {
    background: #333333;
}

.App-image {
    margin-bottom: 10px;
    background: #eeeeee;
}

.App-image img {
    display: block;
    width: 100%;
}

.App-progress {
    position: fixed;
    top: 50%;
    left: 50%;
    margin: -30px 0 0 -50px;
    width: 100px;
    height: 60px;
    background: #222222;
    font-family: sans-serif;
    text-align: center;
    line-height: 60px;
    font-weight: 600;
    color: #ffffff;
    box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.8);
}
</style>