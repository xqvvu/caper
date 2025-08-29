<script setup lang="ts">
import { uuidv7 } from "@extodo/shared";
import consola from "consola";
import qs from "qs";
import { ref } from "vue";
import useFetch from "@/composables/use-fetch";
import { endpoints } from "@/constants/endpoints";

consola.success(uuidv7());

const signInUrl = ref(`${endpoints.auth["sign-in"]}?${qs.stringify({ ts: Date.now() })}`);
useFetch(signInUrl).post({ username: "xqvvu" }).json();
</script>

<template>
  <div class="text-lg text-emerald-500 flex h-screen h-screen items-center justify-center">
    HOME
  </div>
</template>
