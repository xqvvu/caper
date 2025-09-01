<script setup lang="ts">
import { uuidv7 } from "@caper/shared";
import consola from "consola";

consola.success(uuidv7());
</script>

<template>
  <div>
    <UButton
      class="text-emerald-600 cursor-pointer"
      color="neutral"
    >
      HOME
    </UButton>

    <ExInput />
  </div>
</template>
