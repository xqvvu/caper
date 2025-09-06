import type en from "#/en.json";
import { DefineLocaleMessage } from "vue-i18n";

type Messages = typeof en;

declare module "vue-i18n" {
  export interface DefineLocaleMessage extends Messages {}
}
