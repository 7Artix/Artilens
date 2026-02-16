<script setup lang="ts">
</script>

<template>
  <div class="slash-background-container">
    <div class="slash-frame"></div>
  </div>
</template>

<style scoped>
.slash-background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;

  --line-color: rgba(0, 0, 0, 0.02);
  --line-spacing: 10px;
  --line-thickness: 2px;
}

.slash-frame {
  width: 100%;
  height: 100%;
  
  background-image: repeating-linear-gradient(
    -45deg,
    var(--line-color) 0,
    var(--line-color) var(--line-thickness),
    transparent var(--line-thickness),
    transparent var(--line-spacing)
  );
}

@media (max-width: 768px) {
  .slash-background-container {
    --line-spacing: 6px;
    --line-thickness: 2px;
  }
}
</style>