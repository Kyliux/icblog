
<script>
  import { useConnect, useCanister } from "@connect2ic/svelte"
  import { onMount } from 'svelte';
  import { Actor, HttpAgent } from '@dfinity/agent';
  import Masonry from './Masonry.svelte';
  import { Link } from "svelte-navigator";
  import { Ed25519KeyIdentity } from "@dfinity/identity";
  import test from "tape";




  const { isConnected, principal } = useConnect({
        onConnect: () => {
            console.log("Connected!")
            //list_posts(true) // List all posts for connected user
        },
        onDisconnect: () => {
            console.log("Disconnected!")
            //list_posts(false) // List only published posts for disconnected user
        }
    })

// import { idlFactory as fileScalingManagerIdl, canisterId as fileScalingManagerCanisterId } from "dfx-generated/FileScalingManager";
import { idlFactory as file_storage_interface } from "../../.dfx/local/canisters/file_storage/file_storage.did.js";
 import { idlFactory as fileScalingManagerCanisterId } from "../../.dfx/local/canisters/file_scaling_manager/file_scaling_manager.did.js";


// Canister Ids
import canister_ids from "../../.dfx/local/canister_ids.json";
const file_scaling_manager_id = canister_ids.file_scaling_manager.local;
const file_storage_canister_id = canister_ids.file_storage.local;

const agent = new HttpAgent();
const agent2 = new HttpAgent();


const FileScalingManager = Actor.createActor(fileScalingManagerCanisterId, {
    agent2,
    idlFactory: file_scaling_manager_id,
  });
 
  const [FileStorage] = useCanister("file_storage", { mode: "anonymous" });

    // function to test the canisterid value and print them in the console
        console.log("FileScalingManager : !", FileScalingManager);
        console.log("FileStorage : !", FileStorage);
    

  let mediaFiles = [];

  onMount(async () => {
    // Fetch the file storage canister ID
    const canisterIdResult = $FileScalingManager.get_file_storage_canister_id();
    console.log("canisterIdResult : !", canisterIdResult);

    if (canisterIdResult.ok) {
      const fileStorageCanisterId = canisterIdResult.ok;

      // Fetch the media files from the file storage canister
      const result = await FileStorage.assets_list();
      if (result.ok) {
        mediaFiles = result.ok;
      } else {
        console.error("Error fetching media files:", result.err);
      }
    } else {
      console.error("Error fetching file storage canister ID:", canisterIdResult.err);
    }
  });

  async function uploadFile(file) {
    // Convert the file to a Blob
    const blob = new Blob([file], { type: file.type });

    // Create a new chunk in the file storage canister
    const chunkIdResult = await $FileStorage.create_chunk("", blob, 0);
    if (chunkIdResult.ok) {
      const chunkId = chunkIdResult.ok;

      // Commit the batch and create the asset in the file storage canister
      const commitResult = await FileStorage.commit_batch("", [chunkId], {
        checksum: 0, // Provide the correct checksum
        content_encoding: "",
        content_type: file.type,
        filename: file.name
      });
      if (commitResult.ok) {
        // Asset creation successful, refresh the media files list
        const updatedResult = await FileStorage.assets_list();
        if (updatedResult.ok) {
          mediaFiles = updatedResult.ok;
        } else {
          console.error("Error fetching media files:", updatedResult.err);
        }
      } else {
        console.error("Error committing batch and creating asset:", commitResult.err);
      }
    } else {
      console.error("Error creating chunk:", chunkIdResult.err);
    }
  }
  </script>

<h1>Gallery</h1>

<input type="file" on:change="{e => uploadFile(e.target.files[0])}" />

<div class="masonry-grid">
  {#each mediaFiles as file (file.id)}
    <div class="grid-item">
      <img src="{file.url}" alt="{file.filename}" width="100%" />
    </div>
  {/each}
</div>

<style>
  /* Styles for the masonry grid */
  .masonry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 16px;
  }

  .grid-item {
    /* Style for each grid item */
    background-color: #f1f1f1;
    padding: 16px;
  }
</style>

