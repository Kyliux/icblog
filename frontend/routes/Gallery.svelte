<!-- Gallery.svelte -->
<script>
  import { onMount, afterUpdate } from 'svelte';
  import Packery from 'packery';
  import { tick } from 'svelte';
  import { initPackery, uploadFile, fetchMediaFiles, initActors, removeGridItem } from '../src/galleryUtils.js';


  let container;
  let packery;
  initPackery(container);


  let mediaFiles = []; 
  onMount(async () => {
  try {
    await initActors();

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
  

  async function handleFileUpload(files) {
  const filePromises = Array.from(files).map((file) => uploadFile(file));
  await Promise.all(filePromises);
  await tick();
  fetchMediaFiles().then((result) => {
    if (result.ok) {
      Array.from(files).forEach((file) => {
          console.log("This file was successfully uploaded:", file.name);
        });
      mediaFiles = result.ok;
    } else {
      console.error("Error fetching media files:", result.err);
    }
     // Call initPackery after updating mediaFiles
  });
}
</script>

<h1>Gallery</h1>

<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />

<div bind:this={container} class="packery-grid">
  {#each mediaFiles as file (file.id)}
    <div class="grid-item" >
        <img src="{file.url}" alt="{file.filename}" width="200px" on:contextmenu="{() => removeGridItem(file.url)}" />
        <div class=name >
        LOL
        </div>
    </div>
  {/each}
</div>

<style>
   .packery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: 10px;
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