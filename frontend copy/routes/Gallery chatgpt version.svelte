<script>
  import { useConnect, useCanister } from "@connect2ic/svelte";
  import { onMount } from 'svelte';
  import { HttpAgent } from '@dfinity/agent';
  import { Link } from "svelte-navigator";
import Packery from 'packery';

  import { Ed25519KeyIdentity } from "@dfinity/identity";
  import { getActor } from "./actor.js";
  import { updateChecksum }  from "../src/utils.js";

  import { tick } from 'svelte';


  let motoko_identity = Ed25519KeyIdentity.generate();

  // Import the necessary IDL files
  import { idlFactory as fileStorageIdlFactory } from "../../.dfx/local/canisters/file_storage/file_storage.did.js";
  import { idlFactory as fileScalingManagerIdlFactory } from "../../.dfx/local/canisters/file_scaling_manager/file_scaling_manager.did.js";

  // Import the canister IDs
  import canisterIds from "../../.dfx/local/canister_ids.json";

  let test = "default";
  let file_scaling_manager_actor;
  let file_storage_actor;
  let mediaFiles = [];
  let checksum = 0;
  let container;
  let gridItems = [];
  let packery;


  function initPackery() {
    if (packery) {
      packery.destroy();
    }
    packery = new Packery(container, {
      itemSelector: '.grid-item',
      // Additional options...
      
    });

    packery.getItemElements().forEach((item) => {
      item.querySelector('img').addEventListener('load', () => {
        packery.layout();
      });
    });
  }

    onMount(initPackery);

  onMount(async () => {
    // Create actors using the agent and IDL factories
    file_scaling_manager_actor = await getActor(
      canisterIds.file_scaling_manager.local,
      fileScalingManagerIdlFactory,
      motoko_identity
    );
    file_scaling_manager_actor.init();

    file_storage_actor = await getActor(
      test= await file_scaling_manager_actor.get_file_storage_canister_id(),
      fileStorageIdlFactory,
      motoko_identity
    );




    console.log("test  ", test);
    console.log("file_storage_actor  ", file_storage_actor);
    if (file_storage_actor) {
      // Fetch the media files from the file storage canister
      const result = await file_storage_actor.assets_list();
      if (result.ok) {
        mediaFiles = result.ok;
      } else {
        console.error("Error fetching media files:", result.err);
      }
    } else {
      console.error("Error creating file storage actor");
    }
  });

  async function uploadFile(file) {
  if (file_storage_actor) {
    // Convert the file to a Blob
    const blob = new Blob([file], { type: file.type });

    var batch_id = Math.random().toString(36).substring(2, 7);

    const uploadChunk = async ({ chunk, order }) => {
      return file_storage_actor.create_chunk(batch_id, chunk, order);
    };

    const asset_reader = new FileReader();

    asset_reader.onloadend = async () => {
      const asset_unit8Array = new Uint8Array(asset_reader.result);
      const promises = [];
      const chunkSize = 2000000;
      let checksum = 0;

      for (let start = 0, index = 0; start < asset_unit8Array.length; start += chunkSize, index++) {
        const chunk = asset_unit8Array.slice(start, start + chunkSize);

        checksum = updateChecksum(chunk, checksum);

        promises.push(uploadChunk({ chunk, order: index }));
      }

      const chunk_ids = await Promise.all(promises);

      const asset_filename = file.name;
      const asset_content_type = file.type;

      const { ok: asset_id } = await file_storage_actor.commit_batch(
        batch_id,
        chunk_ids,
        {
          filename: asset_filename,
          checksum: checksum,
          content_encoding: { Identity: null },
          content_type: asset_content_type,
        }

      );
      console.error("asset_filename : ", asset_filename);

      const { ok: asset } = await file_storage_actor.get(asset_id);

      // Perform further operations with asset or handle the upload completion
    };

    asset_reader.readAsArrayBuffer(file);
    console.error("readAsArrayBuffer assetreader", asset_reader);
  }
}


</script>

<h1>Gallery</h1>

<input type="file" on:change="{e => uploadFile(e.target.files[0])}" />

<div bind:this={container} class="packery-grid">
  {#each mediaFiles as file (file.id)}
    <div class=" grid-item" >
      <div class="image-container">
      <img src="{file.url}" alt="{file.filename}" width="30%" />
      </div>
    </div>
  {/each}
  </div>

<style>
 .packery-grid {
    display: grid;
    grid-gap: 16px;
  }

  .grid-item {
    position: relative;
    overflow: hidden;
    background-color: #f1f1f1;
    border-radius: 6px;
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 75%;
    overflow: hidden;
  }

  .image-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>

