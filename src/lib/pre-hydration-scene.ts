import { SCENE_KEYFRAMES } from "@/lib/scene-config";

/**
 * Inline first-paint script (spec §14 punch list): before hydration, SSR
 * would otherwise paint the Midnight token defaults — a black flash for
 * daytime visitors. This tiny script (rendered into the document by
 * layout.tsx) computes the five gradient/ink vars from the visitor's clock
 * using the SAME keyframe data and smoothstep blend as the engine. The
 * table is serialized from SCENE_KEYFRAMES at build time — single source
 * of truth, no manual sync.
 */
const TABLE = SCENE_KEYFRAMES.map((k) => [k.h, k.top, k.mid, k.hor, k.ink, k.sub]);

export const preHydrationSceneScript = `(function(){try{
var T=${JSON.stringify(TABLE)};
var d=new Date(),h=d.getHours()+d.getMinutes()/60;
var a=T[T.length-1],b=T[0],i;
for(i=0;i<T.length;i++){if(T[i][0]<=h){a=T[i];b=T[(i+1)%T.length];}}
var span=(b[0]-a[0]+24)%24||24,t=(((h-a[0])+24)%24)/span;t=t*t*(3-2*t);
function px(s,o){return parseInt(s.slice(o,o+2),16)}
function m(x,y){var out="#",o,c;for(o=1;o<7;o+=2){c=Math.round(px(x,o)+(px(y,o)-px(x,o))*t).toString(16);out+=c.length<2?"0"+c:c}return out}
var e=document.documentElement.style,N=["--sky-top","--sky-mid","--sky-hor","--ink","--sub"],j;
for(j=0;j<5;j++){e.setProperty(N[j],m(a[j+1],b[j+1]))}
}catch(err){}})();`;
