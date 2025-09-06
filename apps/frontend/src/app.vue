<script setup lang="ts">
import type { Locale, Schema } from "@/plugins/i18n";
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n<Schema, Locale>();
</script>

<template>
  <UApp :locale="locales[locale]">
    <RouterView />
  </UApp>
</template>
