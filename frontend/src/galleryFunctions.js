import { Ed25519KeyIdentity } from "@dfinity/identity";
import { getActor } from "./actor";
import { updateChecksum } from "./utils";
import Packery from 'packery';
import imagesLoaded from 'imagesloaded';


import {
  idlFactory as fileStorageIdlFactory
} from "../../.dfx/local/canisters/file_storage/file_storage.did.js";

import {
  idlFactory as fileScalingManagerIdlFactory
} from "../../.dfx/local/canisters/file_scaling_manager/file_scaling_manager.did.js";

import canisterIds from "../../.dfx/local/canister_ids.json";

let motoko_identity = Ed25519KeyIdentity.generate();
let fileScalingManagerActor;
let fileStorageActor;
let mediaFiles = [];
let packery;
export async function initActors() {
  fileScalingManagerActor = await getActor(
    canisterIds.file_scaling_manager.local,
    fileScalingManagerIdlFactory,
    motoko_identity
  );

  fileScalingManagerActor.init();

  fileStorageActor = await getActor(
    await fileScalingManagerActor.get_file_storage_canister_id(),
    fileStorageIdlFactory,
    motoko_identity
  );

  return true;
}

export async function fetchMediaFiles(currentpath) {
  try {
    const result = await fileStorageActor.filter_assets_list(currentpath);
    if (result.ok) {
      return { ok: result.ok };
    } else {
      console.error("Error fetching media files:", result.err);
      return { err: result.err };
    }
  } catch (error) {
    console.error("Error in fetchMediaFiles:", error);
    return { err: error };
  }
}

export async function hasChildren(path) {
  let lol = false;
  try {
    lol = await fileStorageActor.haschildrenn(path);
    console.error("has Children :", lol);

    return lol;
  } catch (error) {
    console.error("hasChildren", error);
    return { err: error };
  }
}

 export function uploadFile(file, path) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([file], { type: file.type });
    const batch_id = Math.random().toString(36).substring(2, 7);
    const uploadChunk = async ({ chunk, order }) => {
      return fileStorageActor.create_chunk(batch_id, chunk, order);
    };

    const asset_reader = new FileReader();
    asset_reader.onload = async () => {
      const asset_unit8Array = new Uint8Array(asset_reader.result);
      const promises = [];
      const chunkSize = 2000000;
      let checksum = 0;

      for (
        let start = 0, index = 0;
        start < asset_unit8Array.length;
        start += chunkSize, index++
      ) {
        const chunk = asset_unit8Array.slice(start, start + chunkSize);
        checksum = updateChecksum(chunk, checksum);
        promises.push(uploadChunk({ chunk, order: index }));
      }

      const chunk_ids = await Promise.all(promises);
      const asset_filename = file.name;
      const asset_content_type = file.type;

      const { ok: asset_id } = await fileStorageActor.commit_batch(batch_id, chunk_ids, {
        filename: asset_filename,
        checksum: checksum,
        content_encoding: { Identity: null },
        content_type: asset_content_type,
      }, path );


      const { ok: asset } = await fileStorageActor.get(asset_id);

      // Perform further operations with asset or handle the upload completion
      resolve(asset);

      console.error("asset_filename : ", asset_filename, "asset path", asset.path );

    };

    asset_reader.onerror = (error) => {
      reject(error);
    };

    asset_reader.readAsArrayBuffer(file);
  });
}







export async function removeGridItem(url, container, currentpath) {
      const confirmation = confirm("Are you sure you want to delete this image?");
    if (!confirmation) {
        return;  // The user clicked 'Cancel', so we exit the function.
    }
  try {
    console.log("Removing grid item with URL:", url);
    const assetId = getAssetId(url);

    console.log("Removing grid item with Asset ID:", assetId);

    const delete_result = await fileStorageActor.delete_asset(assetId);
    console.log("Removing grid item with delete_result:", delete_result);

    if (delete_result.ok) {
      const result = await fetchMediaFiles(currentpath);
      if (result.ok) {
        mediaFiles = result.ok;

        // Remove the grid item from the packery instance
        const gridItem = Array.from(container.querySelectorAll('.grid-item')).find((item) => {
          const img = item.querySelector('img');
          return img && img.src === url;
        });
        if (gridItem) {
          container.removeChild(gridItem);
        }

        // Trigger the layout update
        const packery = new Packery(container, {
          itemSelector: '.grid-item',
          gutter: 1
        });
        packery.layout();
      } else {
        console.error("Error fetching media files:", result.err);
      }
    } else {
      console.error("Error deleting grid item:", delete_result.err);
    }

    const asset_list = await fileStorageActor.assets_list();
    let deleted_asset = null;
    for (let i = 0; i < asset_list.length; i++) {
      if (asset_list[i].url === url) {
        deleted_asset = asset_list[i];
        break;
      }
    }
    console.log("Check if deleted_asset is still here:", deleted_asset);
  } catch (error) {
    console.error("Error removing grid item:", error);
  }
}

function getAssetId(url) {
  const parts = url.split('/');
  const assetId = parts[parts.length - 1];
  return assetId;
}

export async function updateMediaFiles(mediaStyles, path) {
  const result = await fetchMediaFiles(path);
  if (result.ok) {
    mediaFiles = result.ok;
    mediaStyles = await Promise.all(mediaFiles.map(file => getImageStyles(file)));
    return mediaStyles;
  } else {
    console.error("Error fetching media files:", result.err);
  }
}

export async function getImageStyles(file) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = function() {
      const unit = 200; // Size unit
      const aspectRatio = this.width / this.height;

      let width, height;

      if (aspectRatio >= 1) {
        // Landscape image or square image
        width = Math.round(unit * aspectRatio) + "px";
        height = unit + "px";
      } else {
        // Portrait image
        width = unit + "px";
        height = Math.round(unit / aspectRatio) + "px";
      }

      const styles = `width: ${width}; height: ${height};`;
      resolve(styles);
    };
    img.onerror = function() {
      reject("Failed to load image");
    };
    img.src = file.url;
  });
}






export async function initPackery(container) {
  try {
    if (container) {
      if (!packery) {
        packery = new Packery(container, {
          itemSelector: '.grid-item',
          gutter: 3,
        });

        imagesLoaded(container, () => {
          packery.layout();
        });
      }
    } else {
      console.error("Error getting container for initPackery.");
    }
  } catch (error) {
    console.error("Error initializing Packery:", error);
  }
}

