<script>
  import { onMount, onDestroy } from 'svelte';
  import { useParams, navigate } from 'svelte-navigator';
  import Packery from 'packery';
  import { useConnect, useCanister } from "@connect2ic/svelte"

  import { initActors, hasChildren, fetchMediaFiles, uploadFile, removeGridItem, updateMediaFiles, getImageStyles, initPackery } from '../src/galleryFunctions.js';
  import Loader from '../components/Loader.svelte';
  import bin from '../assets/bin.svg';
  import { tick } from 'svelte';
  import imagesLoaded from 'imagesloaded';

  const { isConnected, principal } = useConnect({
        onConnect: () => {
            console.log("Connected!")
        },
        onDisconnect: () => {
            console.log("Disconnected!")
        }
    })


  let packery;
  let container;
  let mediaFiles = [];
  let mediaStyles = [];
  let loading = true;
  
  const params = useParams();
  export let id1 = params.id1 || '';

  export let id2 = params.id2 || '';

  export let id3 = params.id3 || '';

  console.error("let id = ", id1);
  console.error("let id2 = ", id2);

  console.error("let id2 = ", id3);

  let currentpath = "";

if(id3) currentpath = "/" + id1 + "/" + id2 + "/" + id3;
else if (id2) currentpath = "/" + id1 + "/" + id2;
else if (id1) currentpath = "/" + id1;


  console.error("lcurrentpath = ", currentpath);

  onMount(async () => {
    window.addEventListener('resize', handleResize);

    try {
      await initActors();
      await fetchData();
      await initPackery(container);
    } catch (error) {
      console.error("Error initializing actors:", error);
    }
    
    loading = false;
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
  });

  async function fetchData() {
    const result = await fetchMediaFiles(currentpath);
    if (result.ok) {
      mediaFiles = result.ok;
      mediaStyles = await updateMediaFiles(mediaFiles,currentpath);
    } else {
      console.error("Error fetching media files:", result.err);
    }
  }

  function handleResize() {
    if (packery) {
      setTimeout(() => {
        packery.layout();
      }, 100);
    }
  }

  async function handleFileUpload(files) {
  for (const file of files) {
    try {
      await uploadFile(file, currentpath);
      console.log("This file was successfully uploaded:", file.name);
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
    }
  }

  await tick();
  const result = await fetchMediaFiles(currentpath);
  if (result.ok) {
    mediaFiles = [...mediaFiles, ...result.ok]; // Append newly uploaded files to mediaFiles
    await updateMediaFiles(mediaStyles, currentpath);

    await tick(); // Wait for Svelte to apply updates

    // Check if Packery has been initialized
    if (packery) {
      // If it has, reload items and layout
      packery.reloadItems();
      packery.layout();
    } else {
      // Otherwise, initialize Packery
      packery = new Packery(container, { itemSelector: '.grid-item' });
    }

    packery.getItemElements().forEach(gridItem => {
      imagesLoaded(gridItem, function () {
        console.log('Image loaded, laying out grid again...');
        packery.layout();
      });
    });

    console.log('Packery layout complete');

    // Force layout update after slight delay
    setTimeout(() => {
      console.log('Forcing Packery layout update...');
      packery.layout();
    }, 500);
  } else {
    console.error("Error fetching media files:", result.err);
  }
}

async function handleGridItemClick(file) {
 
    // Construct the subgallery URL based on the filename without the extension
    const subgalleryUrl = `/gallery${currentpath}/${getFileNameWithoutExtension(file.filename)}`;

    // Navigate to the subgallery URL
    navigate(subgalleryUrl);

}


function getFileNameWithoutExtension(filename) {
  const index = filename.lastIndexOf(".");
  return index !== -1 ? filename.substring(0, index) : filename;
}

function popCurrentPath(currentPath) {
  const pathParts =  currentPath.split('/');
  if (pathParts.length <= 1) {
    return '';
  }
  // Remove the last element from the pathParts array
  pathParts.pop();
  // Join the remaining parts back into a string
  const newPath = pathParts.join('/');
  return "/gallery"+newPath;
}

let packeryInitialized = false;

$: {
  
    Promise.all(mediaFiles.map(file => getImageStyles(file)))
      .then(styles => {
        mediaStyles = styles;
      })
      .catch(error => {
        console.error("Error getting image styles:", error);
      });

    setTimeout(() => {
      if (container) {
        packery = new Packery(container, {
          itemSelector: '.grid-item',
          gutter: 3
        });

        imagesLoaded(container, () => {
          packery.layout();
        });

        packeryInitialized = true;
      }
    }, 800);
  
}

  // Filter the mediaFiles based on the currentpath
  $: filteredMediaFiles = mediaFiles.filter(file => file.path === currentpath);
</script>

<h1>Gallery</h1>

{#if $isConnected}
<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />

<div bind:this={container} class="packery-grid">
  <div class="grid-item">
    <img src="/frontend/assets/return.svg" on:contextmenu on:click={navigate(popCurrentPath(currentpath))} alt="none" style="width: 200px; height: 200px;" />
  </div>
  {#each filteredMediaFiles as file, i (file.id)}
    <div class="grid-item">
      <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}" />
      <div class="name" class:editing="{file.editing}">
          <span on:dblclick={() => startEditing(file)}>{getFileNameWithoutExtension(file.filename)}</span>
      </div>
      <div class="zone zone-top-left" on:contextmenu on:click={() => handleGridItemClick(file)} ></div>
        <div class="zone zone-top-right" on:contextmenu on:click={() => removeGridItem(file.url, container, currentpath)}>
          <img src={bin} alt="trash logo" class="trash-icon" />
        </div>
      <div class="zone zone-bottom-left">{ hasChildren(currentpath)}</div>
      <div class="zone zone-bottom-right"></div>
    </div>
  {/each}
</div>

<Loader loading={loading} />

{:else}

<div bind:this={container} class="packery-grid">
  <div class="grid-item">
    <img src="/frontend/assets/return.svg" on:contextmenu on:click={navigate(popCurrentPath(currentpath))} alt="none" style="width: 200px; height: 200px;" />
  </div>
  {#each filteredMediaFiles as file, i (file.id)}
    <div class="grid-item" on:contextmenu on:click={() => handleGridItemClick(file)}>
      <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}" />
      <div class="name">
          <span>{getFileNameWithoutExtension(file.filename)}</span>
      </div>
    </div>
  {/each}
</div>

<Loader loading={loading} />

{/if}
<style>
  .packery-grid {
    position: absolute;
    overflow: hidden;
    margin-left: 80px;
  }

  .grid-item {
    border: none;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;

  }

  .grid-item img {
    width: 100%;
    transition: filter 0.3s;
  }

  .grid-item:hover img {
    filter: brightness(70%);
  }

  .name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  pointer-events: none;
  transition: opacity 0.3s;
}

.name.editing {
  opacity: 0;
}

  .grid-item .zone {
    position: absolute;
    width: 50%;
    height: 50%;
    transition: filter 0.3s;
    pointer-events: auto;
    box-sizing: border-box;
  }

  .grid-item .zone-top-left {
    top: 0;
    left: 0;
  }

  .grid-item .zone-top-right {
    top: 0;
    right: 0;
  }

  .trash-icon {
  position: absolute;
  top: 30%;
  right: 0%;
  width: 30px;
  height: 30px;
  opacity: 0;
  transition: opacity 0.3s;
}

.zone-top-right:hover .trash-icon {
  opacity: 1;
}

  .grid-item .zone-bottom-left {
    bottom: 0;
    left: 0;
  }

  .grid-item .zone-bottom-right {
    bottom: 0;
    right: 0;
  }

  .grid-item .zone:hover {
    background-color: rgba(255, 255, 255, 0.5); /* Semi-transparent white */
  }
</style>