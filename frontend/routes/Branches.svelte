<script>
  import Gallery from './Gallery.svelte';
  import { useConnect, useCanister } from "@connect2ic/svelte"
  import { onMount } from "svelte"
  import { Link } from "svelte-navigator";
  import Loader from "../components/Loader.svelte"
  import logo from "../assets/dfinity.svg"

  const [galleryActor] = useCanister("gallery", { mode: "anonymous" })

  let currentpath = "";
  let loading = true;
  let message = "";
  let status = "";

  const { isConnected, principal } = useConnect({
    onConnect: () => {
      console.log("Connected!")
      listGalleries(true); // List all galleries for the connected user
    },
    onDisconnect: () => {
      console.log("Disconnected!")
      listGalleries(false); // List only published galleries for the disconnected user
    }
  });

  let galleries = [];

  const listGalleries = async (connected) => {
    let res;
    if (connected || isConnected) {
      res = await galleryActor.getGallery(currentpath); // List all galleries
    } else {
      // List only published galleries
      // Note: This is done on the frontend only as data may not be sensitive. For complete security, principal verification should be done on the backend as well.
      // res = await galleryActor.list_published();
    }
    galleries = res;
    loading = false;
    return galleries;
  };

  onMount(listGalleries);

  const createGallery = async () => {
    loading = true;
    const res = await galleryActor.addGallery(currentpath, galleries); // Create a gallery
    if ("ok" in res) {
      // Gallery creation succeeded
      message = "Gallery was successfully created!";
      status = "ok";
    } else {
      // Gallery creation failed
      message = "Gallery couldn't be created: " + Object.keys(res.err)[0];
      status = "err";
    }
    loading = false;
  };
  let centerButton = "center-button";

</script>

<div>{Gallery.path}</div>
<Gallery {galleries} {currentpath} />

<div class={centerButton}>
  <button on:click="{createGallery}">Create Gallery</button>
</div>

<p>{message}</p>
<Loader {loading} />


<style>
  .center-button {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
</style>