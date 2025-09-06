<script setup lang="ts">
import type { ScriptDocument } from "@jigu/shared/schemas";

const { t } = useI18n();

const authStore = useAuthStore();
const { token } = storeToRefs(authStore);

const { data } = useFetch("/v1/scripts").get().json<ScriptDocument[]>();

watchEffect(() => {
  if (data.value) {
    consola.info(data.value);
  }
  if (!token.value) authStore.clearToken();
});
</script>

<template>
  <div class="flex gap-4 items-center">
    <UButton
      class="font-semibold cursor-pointer"
      icon="i-material-symbols:10k"
      @click="authStore.clearToken()"
    >
      {{ t("common.welcome") }}
    </UButton>

    <UInput
      v-model="token"
      placeholder="There is your token"
    />
  </div>
</template>
