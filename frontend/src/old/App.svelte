<script>
    import Gallery from "./Gallery.svelte";
    import { fetchAllImages } from "../index.js";
    import { onMount } from "svelte";
  
    let images = [];
  
    onMount(async () => {
      images = await fetchAllImages();
    });
  </script>
  
  <Gallery {images} />
