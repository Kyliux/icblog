// galleryUtils.js

import { uploadFile, fetchMediaFiles, updateMediaFiles, removeGridItem, initActors, initPackery } from './galleryFunctions';

let mediaFiles = []; 
let mediaStyles = [];



async function handleFileUpload(files, path) {
  const newFiles = [];
  for (const file of files) {
    try {
      const uploadedFile = await uploadFile(path, file);
      console.log("This file was successfully uploaded:", file.name, "with current path : ", path );
      newFiles.push(uploadedFile);
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
    }
  }
  await tick();
  fetchMediaFiles(path).then(async (result) => {
    if (result.ok) {
      mediaFiles = result.ok;
      await updateMediaFiles(mediaStyles,path);

      await tick(); // Wait for Svelte to apply updates

      // Check if Packery has been initialized
      if (packery) {
        // If it has, reload items and layout
        packery.reloadItems();
        packery.layout();

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
        // Otherwise, initialize Packery
        packery = new Packery(container, { itemSelector: '.grid-item' });
      }
    } else {
      console.error("Error fetching media files:", result.err);
    }
  });
} 



async function initializeGallery(container, path) {
  try {
    await initActors();
    await updateMediaFiles(mediaStyles, path);
    initPackery(container);
  } catch (error) {
    console.error("Error initializing gallery:", error);
  }
}

export { handleFileUpload, initializeGallery, removeGridItem };
