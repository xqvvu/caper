export const useAuthStore = defineStore("auth", {
  persist: true,

  state: () => ({
    token: undefined as string | undefined,
    userInfo: undefined as unknown | undefined,
  }),

  actions: {
    updateToken(token: string | undefined) {
      this.token = token;
    },

    clearToken() {
      this.token = undefined;
    },
  },
});
