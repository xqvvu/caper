import { logService } from "@/services/logs";
import { scriptsService } from "@/services/scripts";

export { BaseService } from "@/services/base";
export { LogService, logService } from "@/services/logs";
export { ScriptsService, scriptsService } from "@/services/scripts";

export const services = {
  scripts: scriptsService,
  logs: logService,
} as const;
