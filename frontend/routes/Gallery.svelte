<script>
  import { useConnect, useCanister } from "@connect2ic/svelte";
  import { onMount } from 'svelte';
  import { HttpAgent } from '@dfinity/agent';
  import Masonry from './Masonry.svelte';
  import { Link } from "svelte-navigator";

  import { Ed25519KeyIdentity } from "@dfinity/identity";
  import { getActor } from "./actor.js";


  let motoko_identity = Ed25519KeyIdentity.generate();

  // Import the necessary IDL files
  import { idlFactory as fileStorageIdlFactory } from "../../.dfx/local/canisters/file_storage/file_storage.did.js";
  import { idlFactory as fileScalingManagerIdlFactory } from "../../.dfx/local/canisters/file_scaling_manager/file_scaling_manager.did.js";

  // Import the canister IDs
  import canisterIds from "../../.dfx/local/canister_ids.json";


    const testok = false ;
  // Create an HTTP agent
  const agent = new HttpAgent();
  const canister_id2="";
  let file_scaling_manager_actors = {};
let file_storage_actors = {};

  // Create actors using the agent and IDL factories
  async function test()  {
  file_scaling_manager_actors.motoko = await getActor(
    canisterIds.file_scaling_manager.local,
    fileScalingManagerIdlFactory,
    motoko_identity
  );

  const response = await file_scaling_manager_actors.motoko.init()
  console.log("response init scaling manager : !", response);

  canister_id2 = await file_scaling_manager_actors.motoko.get_file_storage_canister_id()

};

// Create actors using the agent and IDL factories
async function test2()  {
  file_storage_actors.motoko = await getActor(
    canister_id2,
    fileStorageIdlFactory,
    motoko_identity
  );
   response = await file_storage_actors.motoko.version();

  console.log("response storage actor version: !", response);
  return true;
};

  let mediaFiles = [];

  onMount(async () => {
    test();
    testok = test2();
    if (testok) {

      // Fetch the media files from the file storage canister
      const result = await file_storage_actors.motoko.assets_list();
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

    if (testok) {

    // Create a new chunk in the file storage canister
    const chunkIdResult = await file_storage_actors.motoko.create_chunk("", blob, 0);
    if (chunkIdResult.ok) {
      const chunkId = chunkIdResult.ok;

      // Commit the batch and create the asset in the file storage canister
      const commitResult = await file_storage_actors.motoko.commit_batch("", [chunkId], {
        checksum: 0, // Provide the correct checksum
        content_encoding: "",
        content_type: file.type,
        filename: file.name
      });
      if (commitResult.ok) {
        // Asset creation successful, refresh the media files list
        const updatedResult = await file_storage_actors.motoko.assets_list();
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
  }}
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

