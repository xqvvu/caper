<script setup lang="ts">
import { useCompletions } from "@/composables/use-completions";

const { answer, completion } = useCompletions();
</script>

<template>
  <div>
    <UButton
      class="text-emerald-600 cursor-pointer"
      color="neutral"
      @click="completion()"
    >
      HOME
    </UButton>

    <ExInput />

    <div class="text-white font-semibold text-lg">
      {{ answer }}
    </div>
  </div>
</template>
