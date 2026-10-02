# ꘇ Comfy themes

Four separate palettes match the current Livecode collection's slate, mono, paper and transparent colors. They are based on Comfy's exported palette format; the original Desktop `dark.json` and Comfy's built-in themes are unchanged.

| Theme | Appearance | Matching Livecode editor palette |
| --- | --- | --- |
| ꘇ Dark | Slate/charcoal, muted sage accent, restrained colored wires | Dark |
| ꘇ Mono | Neutral gray backgrounds, grayscale wires and accents | Mono dark |
| ꘇ Light | Warm paper, dark sage accent | Paper |
| ꘇ Transparent | Clear canvas/page, dark glass panels, grayscale accents | Transparent dark |

Refresh Comfy after installing the Genereti assistant pack. **Settings → Appearance → Color palette** lists these choices. The extension registers them without switching your active theme or overwriting user-customized palettes. The initial generated button colors receive a small contrast correction on reload; custom button colors are preserved. Editor themes remain independent so each code node can keep its own presentation style.

If Desktop reports `Color palette genereti-mono not found`, reload with the updated extension: it now registers saved custom palettes before Comfy loads the active ID. This startup fix was verified with a saved Mono palette in the web frontend; the native Desktop recheck remains outstanding.

JSON exports are in `integrations/genereti_comfy_agent/web/themes/`. Use Comfy's Import color palette button for manual import into another installation. The accompanying `web/js/themes.js` supplies the page transparency rules and resets modern UI accent overrides when you switch back to a built-in palette. Run-button normal and hover colors use distinct subdued backgrounds with readable labels. Modern Comfy/PrimeVue accent variables are included alongside the exported legacy graph colors.

## Performance overlay

Select **ꘇ Transparent** and open Comfy's local URL in a browser that supports transparent windows. The page, canvas background and default grid are transparent; panels retain an 86% dark background so labels remain readable. Both graph canvas layers were checked for zero alpha in their empty areas, along with the ancestor DOM backgrounds. Rendered images and canvas artwork retain their authored backgrounds; a theme cannot remove an opaque image/sketch background.

An opaque browser or Desktop window still supplies an opaque surface behind a transparent page. This theme does not change Electron's native window configuration, Comfy Desktop's separate instance-manager window, or enable click-through. OS-level transparency needs support in the browser/window host. The theme was tested in Comfy's web frontend; compositing over another application's window still needs testing in your transparent browser.

Keep Comfy's global node opacity at **1** for readable text and previews; the translucent palette changes background colors rather than dimming whole nodes. Return to Dark, Mono, Light or a built-in theme to leave overlay mode.
