<script>
import Masonry from './Masonry.svelte'
import ImageCard from "../ImageCard.svelte";
import UploadMedia from "../UploadMedia.svelte";

export let images = [];
  </script>
  
  <UploadMedia />
  
  <Masonry>
    {#each images as image}
      <ImageCard {image} />
    {/each}
  </Masonry>