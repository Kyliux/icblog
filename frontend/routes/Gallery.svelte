<script>
  import { onMount, afterUpdate } from 'svelte';
  import { tick } from 'svelte';
  import { initPackery, uploadFile, updateMediaFiles, fetchMediaFiles, getImageStyles, initActors, removeGridItem } from '../src/galleryFunctions.js';
  import imagesLoaded from 'imagesloaded';
  import Packery from 'packery';
  import Loader from "../components/Loader.svelte"
  import bin from "../assets/bin.svg"

  let packery;
  let container;
  let mediaFiles = []; 
  let mediaStyles = [];
  let loading = true;

  onMount(async () => {

  try {
    await initActors();
    const result = await fetchMediaFiles();
    if (result.ok) {
      mediaFiles = result.ok;
      mediaStyles = await updateMediaFiles();
      setTimeout(() => {
        packery = new Packery(container, { itemSelector: '.grid-item' });

packery.getItemElements().forEach(gridItem => {
  imagesLoaded(gridItem, function() {
    packery.layout();
  });
});
   }, 1); // Delay of 1 second

    } else {
      console.error("Error fetching media files:", result.err);
    }
    
  } catch (error) {
    console.error("Error initializing actors:", error);
  }
  loading = false;
});

  afterUpdate(() => {
    if(packery){
        packery.reloadItems(); // Reload all item elements in the packery instance
        packery.layout(); // Layout all item elements again
    }
    });

    async function handleFileUpload(files) {
  for (const file of files) {
    try {
      await uploadFile(file);
      console.log("This file was successfully uploaded:", file.name);
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
    }
  }

  await tick();
  fetchMediaFiles().then(async (result) => {
    if (result.ok) {
      mediaFiles = result.ok;
      mediaStyles = await updateMediaFiles();

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
        imagesLoaded(gridItem, function() {
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
  });
}




  // Whenever mediaFiles is updated, update mediaStyles as well
  $: mediaStyles = mediaFiles.map(file => getImageStyles(file));
</script>


<h1>Gallery</h1>

<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />

<div bind:this={container} class="packery-grid">
  {#each mediaFiles as file, i (file.id)}
    <div class="grid-item">
        <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}"  />
        <div class="name"></div>
        <div class="zone zone-top-left"></div>
        <div class="zone zone-top-right on:contextmenu=" on:click="{() => removeGridItem(file.url, container)}">
          <img src={bin} alt="trash logo" class="trash-icon" />
        </div>
        <div class="zone zone-bottom-left"></div>
        <div class="zone zone-bottom-right"></div>
    </div>
  {/each}
</div>
<Loader loading={loading} />
<style>
  .packery-grid {
    position: relative;
    max-width: 90vw; /* You can change this to suit your design */
    margin: 0 auto; /* This centers the grid horizontally */
    display: block; /* You may not need this line if your grid is a block-level element by default */
   
  }

  .grid-item {
    margin: 0px;
    position: relative;
  }

  .grid-item img {
   
    transition: filter 0.3s;
  }

  .grid-item:hover img {
    filter: brightness(70%);
  }

  .name {
  
  }


  .grid-item .zone {
    position: absolute;
    width: 50%;
    height: 50%;
    transition: filter 0.3s;
    pointer-events: auto;
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
    position: center;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.3s;
}

  .zone-top-right:hover .trash-icon {
    opacity: 1;
    width:30px;
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
