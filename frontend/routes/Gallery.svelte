<script>
  import { onMount, afterUpdate } from 'svelte';
  import { tick } from 'svelte';
  import { initPackery, uploadFile, updateMediaFiles, fetchMediaFiles, getImageStyles, initActors, removeGridItem } from '../src/galleryFunctions.js';
  import imagesLoaded from 'imagesloaded';
  import Packery from 'packery';


  let packery;
  let container;
  let mediaFiles = []; 
  let mediaStyles = [];

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
        <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}" on:contextmenu="{() => removeGridItem(file.url, container)}" />
        <div class="name"></div>
    </div>
  {/each}
</div>

<style>
  .packery-grid {
    position:relative;
  width:100%;
  margin:0 auto;
  background-color:#fdd;
  }

  .grid-item {
    margin: 0px;
  }

  .grid-item img {
   
    transition: filter 0.3s;
  }

  .grid-item:hover img {
    filter: brightness(70%);
  }

  .name {
  
  }
</style>
