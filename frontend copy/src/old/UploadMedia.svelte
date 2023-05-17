<script>
    import { onMount } from "svelte";
    import { uploadImage } from "../index";
  
    let fileInput;
  
    onMount(() => {
      fileInput.addEventListener("change", async (event) => {
        const files = event.target.files;
        for (const file of files) {
          await uploadImage(file);
        }
      });
    });
  </script>
  
  <input
    type="file"
    multiple
    accept="image/*"
    bind:this="{fileInput}"
    style="display:none"
    id="fileInput"
  />
  <label for="fileInput" class="button">Upload Images</label>