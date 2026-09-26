# Good Garden — scroll-grown plant experience (v3)

A static marketing site for goodgarden.store. No build step, no CDN dependencies.

## Run it locally
```
npx serve .          # or: python3 -m http.server 8080
```
Open http://localhost:3000 (or :8080). Opening index.html directly from disk also works in most browsers.

## Structure
```
index.html      all sections and UX copy
styles.css      design tokens, layout, responsive rules (1200/1024/900/380 + short-height), reduced motion
app.js          scroll-grown SVG plant, interactions, cart
vendor/         gsap 3.13, ScrollTrigger, lenis 1.3 (vendored, no CDN)
fonts/          Fraunces (display) + Albert Sans (body), self-hosted woff2
assets/         optimised webp images (~1.5 MB total, down from 51 MB)
```

## Sections
1. **Watch it grow** (#grow) – pinned scroll scene. The plant is drawn in SVG and grows with the scroll: seed → roots → stem and leaves → branches → pest shield → bloom. Each stage swaps the product card, bottle and rail. Leaves react to the cursor/touch, the flower bursts pollen when tapped, butterfly and bee arrive at bloom.
2. **Formula** – word-by-word reveal, facts, parallax leaves, velocity marquee.
3. **Plant finder** – pick a symptom, get the right bottle with an add-to-cart button.
4. **Ritual** – Measure / Mix / Feed, with a tap-the-bottle mixer (3 drops is the right dose).
5. **Shop** – kit + 5 products (horizontal swipe on mobile).
6. **Gallery**, **Reviews** (autoplay, swipe), **FAQ**, **Closing** (roots draw underground).

## Cart and checkout
- Cart lives in `localStorage` (`gg-cart`).
- Checkout builds a Shopify cart permalink: `https://goodgarden.store/cart/VARIANT:QTY,...`.
- Variant IDs are in each `.product` via `data-variant`.
- **Kit variant ID is missing.** Add it to `data-variant=""` on `<article class="kit">` in index.html. Until then, a kit in the cart sends people to the kit product page.
- **Plant Protect** is not on the live store yet, so its button is "Notify me" and opens WhatsApp (+91 95185 57729).

## Bugs fixed from v2
- Menu links were unclickable (pointer-events:none); added aria, Escape and focus handling.
- Loader could hang forever (waited for 51 MB of images and a CDN Three.js import). Loader removed; libraries vendored.
- Three WebGL scenes rendered continuously offscreen; replaced with one lightweight SVG scene.
- Growth plant grew from the wrong origin and ignored line widths; rebuilt so roots grow down and the stem grows up from the soil line.
- `/cart/add.js` always failed outside Shopify; replaced with local cart + cart permalink.
- Plant Protect had an empty variant; now a notify flow.
- GSAP rotation fought CSS translate on the hero orbit; ScrollTrigger refreshed on every mobile address-bar resize.
- Product grid overflowed at mid widths; horizontal page overflow on mobile.
- Heavy blur filters scrubbed on mobile; unrelated coconut images in the story section.
- No focus styles, no skip link, deprecated Lenis options.

## Accessibility
Skip link, visible focus rings, keyboard-operable tabs, chips, reviews and drawer, `prefers-reduced-motion` support (plant still grows, but without smooth scroll and decorative motion).
