<!-- <script setup lang="ts">
import { ref } from 'vue';
import Color from 'colorjs.io';

// Okhsl 선언
const color = new Color('okhsl', [30, 0.5, 0.6]);
console.log(color);

const value = ref(color.toString()); //
const srgb = color.to('srgb').coords.map(v => Math.round(v * 255));
const srgbString = ref(`rgb(${srgb.join(', ')})`);
const hex = ref(color.to('srgb').toString({format: 'rgb'})); // "#f5a161"
</script>


<template>
  <div class="p-4 space-y-2">
    <div><strong>CSS okhsl():</strong> {{ value }}</div>
    <div><strong>sRGB:</strong> {{ srgbString }}</div>
    <div><strong>Hex:</strong> {{ hex }}</div>
    <div
      class="w-20 h-10 border"
      :style="{ backgroundColor: hex }"
    ></div>
  </div>
</template> -->

<template>
  aaa
</template>
