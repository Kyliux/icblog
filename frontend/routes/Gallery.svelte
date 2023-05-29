<script>
  import { onMount, onDestroy } from 'svelte';
  import { useParams } from 'svelte-navigator';
  import { initActors, fetchMediaFiles, uploadFile, removeGridItem, updateMediaFiles, getImageStyles, initPackery } from '../src/galleryFunctions.js';
  import Loader from '../components/Loader.svelte';
  import bin from '../assets/bin.svg';
  import { tick } from 'svelte';

  
  let packery;
  let container;
  let mediaFiles = [];
  let mediaStyles = [];
  let loading = true;
  
  const params = useParams();
  export let id = params.id || '';

  export let id2 = params.id2 || '';

  console.error("let id = ", id);
  console.error("let id2 = ", id2);

  let currentpath = "/" + id + "/" + id2;

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


async function handleGridItemClick(url) {
  await removeGridItem(url, container, currentpath);
  await fetchData();
  if (packery) {
    // Reload items and layout
    packery.reloadItems();
    packery.layout();
  } else {
    // Initialize Packery
    packery = new Packery(container, { itemSelector: '.grid-item' });

    // Wait for Packery to initialize before reloading items and layout
    packery.on('layoutComplete', () => {
      packery.reloadItems();
      packery.layout();
    });
  }
}

  $: {
    if (mediaFiles.length > 0) {
      Promise.all(mediaFiles.map(file => getImageStyles(file)))
        .then(styles => {
          mediaStyles = styles;
        })
        .catch(error => {
          console.error("Error getting image styles:", error);
        });
    }
  }

  // Filter the mediaFiles based on the currentpath
  $: filteredMediaFiles = mediaFiles.filter(file => file.path === currentpath);
</script>

<h1>Gallery</h1>

<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />

<div bind:this={container} class="packery-grid">
  {#each filteredMediaFiles as file, i (file.id)}
    <div class="grid-item" on:click="{() => handleGridItemClick(file.url)}">
      <img src="{file.url}" alt="{file.filename}" style="{mediaStyles[i]}" />
      <div class="name"></div>
      <div class="zone zone-top-left"></div>
      <div class="zone zone-top-right" on:contextmenu>
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
    position: absolute;
    overflow: hidden;
    margin-left: 80px;
  }

  .grid-item {
    border: none;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    margin-bottom: -3px;
    padding-top: -3px;
  }

  .grid-item img {
    width: 100%;
    transition: filter 0.3s;
  }

  .grid-item:hover img {
    filter: brightness(70%);
  }

  .name {}

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
    position: center;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .zone-top-right:hover .trash-icon {
    opacity: 1;
    width: 30px;
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