// galleryUtils.js

import { uploadFile, fetchMediaFiles, removeGridItem, getImageStyles, initActors, initPackery } from './galleryFunctions';

let mediaFiles = []; 
let mediaStyles = [];

export async function updateMediaFiles() {
  const result = await fetchMediaFiles();
  if (result.ok) {
    mediaFiles = result.ok;
    mediaStyles = await Promise.all(mediaFiles.map(file => getImageStyles(file)));
  } else {
    console.error("Error fetching media files:", result.err);
  }
}

async function handleFileUpload(files) {
  const newFiles = [];
  for (const file of files) {
    try {
      const uploadedFile = await uploadFile(file);
      console.log("This file was successfully uploaded:", file.name);
      newFiles.push(uploadedFile);
    } catch (error) {
      console.error("Error uploading file:", file.name, error);
    }
  }
  mediaFiles = [...mediaFiles, ...newFiles];
  mediaStyles = await updateMediaFiles();
  packery.layout(); // refresh Packery layout
}




async function initializeGallery(container) {
  try {
    await initActors();
    await updateMediaFiles(mediaStyles);
    initPackery(container);
  } catch (error) {
    console.error("Error initializing gallery:", error);
  }
}

export { handleFileUpload, initializeGallery, removeGridItem };
