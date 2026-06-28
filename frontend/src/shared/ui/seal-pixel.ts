/** SEAL Pixel Hackathon design tokens — shared class fragments */

export const SEAL_SHADOW_SM = "shadow-[4px_4px_0_0_#0c1228]";
export const SEAL_SHADOW_MD = "shadow-[6px_6px_0_0_#0c1228]";
export const SEAL_SHADOW_LG = "shadow-[8px_8px_0_0_#0c1228]";

export const SEAL_BORDER = "border-2 border-navy";

export const SEAL_CARD =
  `${SEAL_BORDER} bg-white ${SEAL_SHADOW_SM}`;

export const SEAL_CARD_LG =
  `${SEAL_BORDER} bg-white ${SEAL_SHADOW_MD}`;

export const SEAL_BUTTON_PRIMARY =
  "border-2 border-navy bg-seal-yellow text-navy font-mono font-bold " +
  `${SEAL_SHADOW_SM} ` +
  "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#0c1228] " +
  "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#0c1228] " +
  "disabled:pointer-events-none disabled:opacity-50";

export const SEAL_BUTTON_SECONDARY =
  "border-2 border-navy bg-white text-navy font-mono font-bold " +
  `${SEAL_SHADOW_SM} ` +
  "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#0c1228] " +
  "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#0c1228] " +
  "disabled:pointer-events-none disabled:opacity-50";

export const SEAL_BUTTON_GHOST =
  "border-2 border-transparent bg-transparent text-navy font-mono font-bold " +
  "hover:border-navy/20 hover:bg-white/80 " +
  "disabled:pointer-events-none disabled:opacity-50";

export const SEAL_BUTTON_DANGER =
  "border-2 border-navy bg-seal-error text-white font-mono font-bold " +
  `${SEAL_SHADOW_SM} ` +
  "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#0c1228] " +
  "active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#0c1228] " +
  "disabled:pointer-events-none disabled:opacity-50";

export const SEAL_INPUT =
  "block h-11 w-full border-2 border-navy bg-white px-4 font-sans text-sm text-seal-text " +
  "placeholder:text-seal-text-muted transition-colors duration-200 " +
  "hover:border-navy/80 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30";

export const SEAL_INPUT_ERROR =
  "border-seal-error focus:border-seal-error focus:ring-seal-error/30";

export const SEAL_TOPNAV = "border-b-2 border-navy/10 bg-white";

export const SEAL_SIDEBAR = "bg-navy text-white";

export const SEAL_PAGE_BG = "bg-seal-bg";

export const SEAL_TABLE_HEADER =
  "bg-seal-surface-sunken font-mono text-[10px] font-bold uppercase tracking-wider text-seal-text-muted";

export const SEAL_DIALOG = `${SEAL_BORDER} bg-white ${SEAL_SHADOW_LG}`;
