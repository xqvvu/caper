import type { Ref } from "vue";
import { defineStore } from "pinia";
import { ref } from "vue";

interface State {
  token: Ref<string | undefined>;
}

interface Action {
  clearToken: () => void;
  updateToken: (t: string) => void;
}

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>();
    const updateToken = (t: string) => {
      token.value = t;
    };
    const clearToken = () => {
      token.value = undefined;
    };

    const states: State = {
      token,
    };

    const actions: Action = {
      clearToken,
      updateToken,
    };

    return {
      ...states,
      ...actions,
    };
  },
  {

  },
);
