import { LoggerManager } from "./LoggerManager";
import { AnsiStyle, Colors, ILogger } from "./Logging/index";

export let AppLogger = LoggerManager.current.registerLogger("App", AnsiStyle.create().foreground(Colors.magenta));