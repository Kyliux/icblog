<!-- Gallery.svelte -->
<script>
  import { onMount, afterUpdate } from 'svelte';
  import Packery from 'packery';
  import { tick } from 'svelte';
  import { initPackery, uploadFile, fetchMediaFiles, initActors, removeGridItem } from '../src/galleryUtils.js';
    import { init } from 'svelte/internal'


  let container;
  let packery;
  initPackery(container);


  let mediaFiles = []; 
  let mediaStyles = [];

  
  async function updateMediaFiles() {
  const result = await fetchMediaFiles();
  if (result.ok) {
    mediaFiles = result.ok;
    mediaStyles = await Promise.all(mediaFiles.map(file => getImageStyles(file)));
  } else {
    console.error("Error fetching media files:", result.err);
  }
}

  onMount(async () => {
  try {
    await initActors();
    await updateMediaFiles();
    const result = await fetchMediaFiles();
    if (result.ok) {
      mediaFiles = result.ok;
    } else {
      console.error("Error fetching media files:", result.err);
    }
  } catch (error) {
    console.error("Error initializing actors:", error);
  }
});
  
afterUpdate(() => {
    initPackery(container); // Call initPackery after the component updates
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
  fetchMediaFiles().then((result) => {
    if (result.ok) {
      mediaFiles = result.ok;
    } else {
      console.error("Error fetching media files:", result.err);
    }
  });
  await updateMediaFiles();
  initPackery(container);
}




async function getImageStyles(file) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = function() {
      let dimensions = { width: this.width, height: this.height };
      let width, height;

      const aspectRatio = dimensions.width / dimensions.height;

      if (aspectRatio > 1) {
        // Landscape image or square image
        width = "400px";
        height = "200px";
      } else if (aspectRatio < 1) {
        // Portrait image
        width = "200px";
        height = "400px";
      } else {
        // Square image
        width = "200px";
        height = "200px";
      }

      resolve(`width: ${width}; height: ${height};`);
    };
    img.onerror = function() {
      reject("Failed to load image");
    };
    img.src = file.url;
  });
}





</script>

<h1>Gallery</h1>

<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />

<div bind:this={container} class="packery-grid">
  {#each mediaFiles as file, i (file.id)}
    <div class="grid-item" >
        <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}" on:contextmenu="{() => removeGridItem(file.url, container)}" />
        <div class=name >
        
        </div>
    </div>
  {/each}
</div>

<style>
  .input-wrapper {
    width: 200px;
    height: 200px;
    margin-bottom: 10px;
  }

  .hidden {
    display: none;
  }

  .file-upload-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: lightgray;
    cursor: pointer;
    border: 1px solid darkgray;
  }

  .plus-symbol {
    font-size: 3rem;
    color: darkgray;
  }

  .packery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10px, 1fr));
    grid-gap: 1px;
  }

  .grid-item {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .grid-item img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  .grid-item:hover img {
    filter: brightness(70%);
  }

</style>