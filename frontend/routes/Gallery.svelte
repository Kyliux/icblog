<script>
  import { onMount, onDestroy } from 'svelte';
  import { useParams, navigate } from 'svelte-navigator';
  import Packery from 'packery';
  import { useConnect, useCanister } from "@connect2ic/svelte"

  import {  initActors, haschildren, getFileNameWithoutExtension, fetchMediaFiles, uploadFile, removeGridItem, updateMediaFiles, getImageStyles } from '../src/galleryFunctions.js';
  import {initializeGallery } from "../src/galleryUtils.js"
  import Loader from '../components/Loader.svelte';
  import bin from '../assets/bin.svg';
  import enter from '../assets/enter.svg';
  import gallery from '../assets/gallery.svg';
  import { tick } from 'svelte';
  import imagesLoaded from 'imagesloaded';
  import Swiper, { Navigation, Pagination } from 'swiper';


  import { register } from 'swiper/element/bundle';
  register();



  const { isConnected, principal } = useConnect({
    onConnect: async () => {
      console.log("Connected!");
      window.removeEventListener('resize', handleResize);

      packery.destroy();
      packery=false;
      await fetchData();
      initPackery(container);

    },
    onDisconnect: async () => {
      console.log("Disconnected!")
      window.removeEventListener('resize', handleResize);

      packery.destroy();
      packery=false;

      await fetchData();
      initPackery(container);

    }
  })

  let packery;

  let container;
  let mediaFiles = [];
  let mediaStyles = [];
  let loading = true;
  let packeryInitialized = false;
  let actorinitisalised = false;
  let swiper; // Variable to hold the swiper instance
  let showSwiper = false; // Flag to control the visibility of the swiper
  let initialSlide = 0; // Index of the initially selected slide



  function initSwiper(index) {

    // swiper element
   swiper = document.querySelector('swiper-container');
   console.log('INIT SWIPER WITH INDEX : ', index);

// swiper parameters
const swiperParams = {
  initialSlide: index,
  slidesPerView: 1,
  breakpoints: {
    640: {
      slidesPerView: 1,
    },
    1024: {
      slidesPerView: 1,
    },
  },
  on: {
    init() {
      // ...
    },
  },
};

// now we need to assign all parameters to Swiper element
Object.assign(swiper, swiperParams);

// and now initialize it
swiper.initialize();

  }

  function destroySwiper() {
    if (swiper) {
      swiper.destroy();
      swiper = null;
    }
  }

  function openSwiper(index) {
    showSwiper = true;
    initialSlide = index; // Set the initial slide index to the clicked image index
    destroySwiper(); // Destroy the existing swiper instance
    initSwiper(initialSlide);
  }

  function closeSwiper() {
    showSwiper = false;
    destroySwiper();
  }

  
  async function layoutPackery() {
    await tick(); // Wait for Svelte to apply updates

    if (packeryInitialized) {
      packery.reloadItems();
      packery.layout();
    } else {
      packery = new Packery(container, { itemSelector: '.grid-item' });
      packeryInitialized = true;
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
  }

  const params = useParams();
  export let id1 = params.id1 || '';
  export let id2 = params.id2 || '';
  export let id3 = params.id3 || '';


  export let currentpath = "";
  if (id3) currentpath = "/" + id1 + "/" + id2 + "/" + id3;
  else if (id2) currentpath = "/" + id1 + "/" + id2;
  else if (id1) currentpath = "/" + id1;

  console.log("id 1 : ", id1,"id 2 : ", id2,"id 3 : ", id3, "currentpath : ", currentpath);


  onMount(async () => {
    window.addEventListener('resize', handleResize);

    try {
      actorinitisalised = await initializeGallery();
      //await initPackery(container);


    } catch (error) {
      console.error("Error initializing actors:", error);
    }

    await fetchData();
    loading = false;
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    packery.destroy();
  });

  async function fetchData() {
    let result;
    console.log("We want to fetchdata from : ", currentpath,  "but is actorinitisalised ? --> :" , actorinitisalised);
    if(actorinitisalised) {
       result = await fetchMediaFiles(currentpath);
    
    if (result.ok) {
      mediaFiles = result.ok;
      mediaStyles = await updateMediaFiles(mediaFiles, currentpath);
    } else {
      console.error("Error fetching media files:", result.err);
    }
  }
    setTimeout(() => {
      if (container) {
        initPackery(container);
      }
    }, 800);
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
        initPackery(container);
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

  async function handleGridItemClick(file, index) {
    const subgalleryUrl = `/gallery${currentpath}/${getFileNameWithoutExtension(file.filename)}`;
    if (await file.haschildren) {
      // Navigate to the subgallery URL
      navigate(subgalleryUrl);
    } else {
      openSwiper(index);
    }
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
    return "/gallery" + newPath;
  }
   // Check if Packery has been initialized



  async function initPackery(container) {
    if (packery) {
        // If it has, reload items and layout
        packery.reloadItems();
        packery.layout();
      
      } else {

    if (container) {
      packery = new Packery(container, { itemSelector: '.grid-item' });

      packery.getItemElements().forEach((gridItem) => {
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
      }, 100);

      packeryInitialized = true;
    } else {
      console.error('Error getting container for initPackery.');
    }
  } }

  // Filter the mediaFiles based on the currentpath
  $: filteredMediaFiles = mediaFiles.filter(file => file.path === currentpath);
</script>

<h1>Gallery</h1>
{#if $isConnected}
<input type="file" multiple on:change="{e => handleFileUpload(e.target.files)}" />
{/if}

<div bind:this={container} class="packery-grid">
  {#if currentpath !== "/index"}
  <div class="grid-item">
    <img src="/frontend/assets/return.svg" on:click="{() => navigate(popCurrentPath(currentpath))}" alt="none" style="width: 200px; height: 200px;" />
  </div>
{/if}

  {#if $isConnected}
  {#each filteredMediaFiles as file, i (file.id)}
    <div class="grid-item">
      <img src="{file.url}" alt="{file.url}" style="{mediaStyles[i]}" />
      {#await file.haschildren}
      
    {:then hasChildrenValue}
      {#if hasChildrenValue}
        <div class="name" class:editing="{file.editing}">
          <span on:dblclick={() => startEditing(file)}>{getFileNameWithoutExtension(file.filename)}</span>
        </div>
      {/if}
    {:catch error}
      <!-- Handle error if needed -->
    {/await}
      <div class="zone zone-top-left" on:click={() => handleGridItemClick(file)}>
        <img src={enter} alt="enter logo" class="enter-icon" />
      </div>
      <div class="zone zone-top-right" on:click={() => removeGridItem(file.url, container, currentpath)}>
        <img src={bin} alt="trash logo" class="trash-icon" />
      </div>
      <div class="zone zone-bottom-left"></div>
      <div class="zone zone-bottom-right" on:click={() => openSwiper(i)}>
        <img src={gallery} alt="gallery logo" class="gallery-icon" />
      </div>
    </div>
  {/each}
  {:else}
  {#each filteredMediaFiles as file, i (file.id)}
    <div class="grid-item" on:click={() => handleGridItemClick(file,i)}>
      <img src="{file.url}" alt="{file.url}" style="{mediaStyles[i]}" />
      {#await file.haschildren}
      
      {:then hasChildrenValue}
        {#if hasChildrenValue}
          <div class="name" class:editing="{file.editing}">
            <span on:dblclick={() => startEditing(file)}>{getFileNameWithoutExtension(file.filename)}</span>
          </div>
        {/if}
      {:catch error}
        <!-- Handle error if needed -->
      {/await}
    </div>
  {/each}
  {/if}
  <Loader loading={loading} />
</div>

{#if showSwiper}
  <div class="swiper-overlay">
    <div class="swiper-close" on:click={closeSwiper}>&times;</div>
    <swiper-container slides-per-view="1" navigation="true" pagination="true" scrollbar="true">
        {#each filteredMediaFiles as file, i (file.id)}
          <swiper-slide>
            <img src="{file.url}" alt="{file.filename}" />
          </swiper-slide>
        {/each}
    </swiper-container>
  </div>
{/if}

<style>
.swiper-container {
    width: 100%;
    height: 100%;
    background: #000;
  }

  swiper-slide {
    display: flex;
    align-items: center;
    height:auto;
    justify-content: center;
  }

  .swiper-slide img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }


  .swiper-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swiper-close {
    position: absolute;
    top: 20px;
    right: 20px;
    color: #fff;
    font-size: 30px;
    cursor: pointer;
    z-index: 1000;
  }

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
    filter: brightness(40%);
  }

  .name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 24px;
    pointer-events: none;
    text-transform: uppercase;
    font-weight: bold;

  }

  .name.editing {
  }

  .grid-item .zone {
    position: absolute;
    width: 50%;
    height: 50%;
    transition: filter 0.3s;
    pointer-events: auto;
    box-sizing: border-box;
  }


.grid-item:hover .name {

  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  width: 100%;
  height: 100%;
  top: -5%;
  left: 0%;
  transition: background-color 0.3s, opacity 0.3s, transform 0.3s;
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


  .zone-top-left {
  display: flex;
  align-items: center;
  justify-content: center;
}

.zone-bottom-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.enter-icon,
.gallery-icon {
  width: 30px;
  height: 30px;
  opacity: 0;
  transition: opacity 0.3s;
}

.zone-top-left:hover .enter-icon,
.zone-bottom-right:hover .gallery-icon {
  opacity: 1;
}







</style>
