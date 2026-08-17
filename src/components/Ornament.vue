<template>
  <div class="ornament"><div class="dot" /></div>
</template>

<style scoped>
.ornament {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-30);
}
.ornament::before,
.ornament::after {
  content: '';
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.4;
}
.dot {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
}
</style>
