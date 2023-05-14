<script>
    export let image;
  </script>
  
  <style>
    .card {
      position: relative;
      overflow: hidden;
    }
    .card img {
      width: 100%;
      object-fit: cover;
    }
    .label {
      position: absolute;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      width: 100%;
      padding: 5px;
      text-align: center;
    }
  </style>
  
  <div class="card">
    <img src={image.url} alt={image.title} />
    {#if image.label}
      <div class="label">{image.label}</div>
    {/if}
  </div>