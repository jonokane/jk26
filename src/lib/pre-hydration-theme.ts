import { DARK_QUERY, THEME_STORAGE_KEY } from "@/lib/theme-engine";

/**
 * Inline first-paint script (spec §4). Before hydration, SSR would otherwise
 * paint the light palette — a white flash for every dark-mode visitor. This
 * resolves the theme with the SAME precedence as `resolveTheme`: an explicit
 * stored choice wins, otherwise the OS decides. A test pins the two together.
 *
 * Because it mutates <html> before React hydrates, <html> carries
 * suppressHydrationWarning.
 */
export const preHydrationThemeScript = `(function(){try{
var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(c!=="light"&&c!=="dark"){c=matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light"}
document.documentElement.dataset.theme=c;
}catch(e){}})();`;
