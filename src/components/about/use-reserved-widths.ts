"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { wordWeight } from "@/components/about/teleprompter-engine";
import type { WordRole } from "@/components/about/statement-tokens";

/**
 * Pin every word's box to the width it will have when it is FOCUSED, so a
 * statement cannot re-wrap while the teleprompter animates it (spec §8).
 *
 * A heavier glyph is a WIDER glyph. The hook lerps each word 400 -> 440
 * (ambient) or 400 -> 780 (emphasis), and at this measure that grows a
 * statement by ~63px as it resolves — more than a short word — so the wrap
 * point walked backwards and words visibly dropped a line mid-scroll. The
 * prototype has the same fault for the same reason (its own words are flex
 * items in a wrapping row).
 *
 * Reserving the FOCUSED width, rather than the widest possible, is what makes
 * the statement being read pixel-exact: at focus the reservation equals the
 * text, so there is no slack where the eye is. The slack lands on the
 * statements at rest instead — about 1px per ambient word and ~11px after each
 * emphasis word — which is where the design is already blurring to 7px and
 * fading to 0.14.
 *
 * This is the whole reason `.word` is `display: inline-block`: a width does not
 * apply to an inline box. That in turn is why a link has to draw its own
 * underline — see `.link .word` in about.module.css.
 */
export function useReservedWidths(
  columnRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const column = columnRef.current;
    if (!active || !column) return;

    let cancelled = false;

    const reserve = () => {
      if (cancelled) return;
      const words = [...column.querySelectorAll<HTMLElement>("[data-word]")];
      if (words.length === 0) return;

      const saved = words.map((w) => w.style.fontVariationSettings);

      /* Write, then read, then write — never interleaved, or each word forces
         its own layout pass and this costs one reflow per word. */
      for (const w of words) {
        w.style.minWidth = "";
        const role = (w.dataset.word ?? "ambient") as WordRole;
        w.style.fontVariationSettings = `"wght" ${wordWeight(role, 1)}`;
      }

      /* One font-size for the lot: it is inherited from .statement, so reading
         it per word would be 300 reads of the same number. */
      const fontSize = parseFloat(getComputedStyle(words[0]).fontSize);
      const ems = words.map((w) => w.getBoundingClientRect().width / fontSize);

      words.forEach((w, i) => {
        w.style.fontVariationSettings = saved[i];
        /* em, not px. The statement's font-size is a clamp() on vw, so a px
           reservation would be wrong at every other viewport width and would
           need re-measuring on resize; an em one scales with the text for free.
           Rounded UP, so a reservation can never land a hair under the real
           focused width and re-wrap the thing it exists to pin. */
        w.style.minWidth = `${(Math.ceil(ems[i] * 1e4) / 1e4).toFixed(4)}em`;
      });
    };

    /* Metrics belong to the font, so this cannot run before the font has
       loaded: measured against the fallback the reservations would be wrong,
       and being wrong is worse than being absent. `fonts` is guarded because
       jsdom does not implement it. */
    void (document.fonts?.ready ?? Promise.resolve()).then(reserve);

    return () => {
      cancelled = true;
      for (const w of column.querySelectorAll<HTMLElement>("[data-word]")) {
        w.style.minWidth = "";
      }
    };
  }, [columnRef, active]);
}
