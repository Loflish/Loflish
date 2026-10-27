# Mémoire de Claude sur Nos Mots Mémoriaux (copie du 27 octobre 2026)

Copie intégrale des notes de travail avant la remise à zéro de l'environnement Claude.


**Nos mots mémoriaux** — musée virtuel de « traces » (dernières volontés, paroles, mémoires de défunts),
explorées comme une constellation de bulles d'aquarelle.

**La seule version qui compte : https://github.com/Loflish/Loflish** (public, branche par défaut
`claude/practical-newton-r1t0oq`, repo = repo de profil GitHub). Clone local :
`C:\Users\tombl\Desktop\Claude Code\Loflish`. Site React 18 + Vite 5 (prototype autonome `npm run dev`,
mode en ligne `--mode en-ligne`), serveur `server/` Fastify + PostgreSQL. Lancement : launch.json `loflish`
(port 5174). Built with Claude **and ChatGPT/Codex** before → docs can be mixed/contradictory.

L'ancienne version SvelteKit (dossier `nos-mots-memoriaux/` + emotion corpora) a été **supprimée
définitivement le 2026-10-21 à la demande de Tom** (« ancienne version nulle »). Ne jamais la relancer ni s'y référer.

Références : cahiers des charges dans `C:\Users\tombl\Downloads\` — `..._Cahier_des_charges_Maitre_EXHAUSTIF_v0.6.md`
(dernier) + `..._Dossier_Maitre_Bloc9_Bloc10_DECISIONS_FINALES.md`. Point de reprise :
`Loflish/design/suivi/2026-10-19/README.md` (fond à 90 %, mouvements plus amples, matières préférées 00/81/95).

Direction artistique : couleurs GRIS uniquement, Monet, Nabis, Ruth Rae ; bulles aquarelle, broderie au
point avant, fil bordeaux réservé au logo, Newsreader seule police. Matières HD générées avec Higgsfield
(payant, crédits : toujours demander avant de dépenser).

**Why:** Tom loves the current progression and wants to reach "la perfection" with Claude.
**How to apply:** first milestone = démo famille et amis (priority order chosen 2026-10-21: démo d'abord,
puis lancement public). Audit complet livré le 2026-10-21 en Claude Doc :
https://claude.ai/artifact/Gw6A2xmXAjTSDyucDrbUdW (4 choix ouverts à trancher : constellation derrière les pages,
carte mondiale retirée, liste des références artistiques, respiration des bulles). Next: charte courte + custom DA skill.


Decisions given on **2026-10-21** (see [[nos-mots-memoriaux]]):
- **Figures historiques** (idée 4) : only long-dead, public-domain people with sourced real quotes and free images,
  labelled as deposited by the museum. Shown as **étoiles** (star shape) with bubble materials and GRIS colours drawn
  **at random**; Tom adds them little by little from /admin after launch (~100 to start).
- **Œuvre commune** (idée 2) : each stroke starts at the end of the previous person's stroke, free direction,
  **same length for everyone**, one continuous line, canvas grows without limit.
- **Higgsfield** : use all credits, but **by validated batches** (announce cost, Tom approves, generate, Tom picks).
- **Fond derrière les pages** : Tom doesn't know — show 2–3 rendered options inspired by GRIS colours, Monet, Nabis
  (joyful, lively, modern and traditional at once) and let him choose by seeing them.
- Other ideas: 1 mosaic-like strokes from a church, animated over the background (needs his photos);
  3 EU compliance; 5 big-data storage + cost; 6 Pinterest-like photo wall (consented images only);
  7 Se perdre format choice (200 chars / by sense / by photo); 8 he rewrites every text himself;
  9 progress timeline with checkpoints + generated illustrations on Le projet; 10 donation pages.
- His 5 reasons go into Le projet « Pourquoi ce musée »; reason 5 says « pour toujours », which the brief forbids (§1.4) — flagged.

**Palerme (2026-10-21)** : Tom sent 9 photos (Cappella Palatina, Monreale, Baroque marble-inlay chapels), kept locally in
`Desktop\Claude Code\.claude\nmm-inspiration\palerme\` (bystanders visible → never commit to the public repo). Measured palette:
or vif #daa441, or profond #98753b, ocre #d38618, rouge jaspe #691e2b, rose brèche #a58476, vert antique #546562,
bleu lapis #587288, bleu ciel #90b7df, ivoire #e2e3dc, gris-bleu #a6acb2, brun rinceaux #251c14 (const PALERME in
`src/engine/ornements.ts`). Motifs → site: 8-point star friezes (idea 1 « traits »), gold tesserae (Klimt), muqarnas stars
(historical-figure stars), arches/niches (profile frame), marble inlay (page backgrounds), golden light rays.
Klimt proposed as addition (went to Ravenna 1903 — Klimt-Foundation); Beksiński advised against (morbid vs DA §50.1).
Prototype behind URL flag `?palerme=1|bandes|or` (default site unchanged). Higgsfield: Plus plan, 574 credits on 9 Oct,
monthly credits **expire at renewal 29 Oct 2026**; Tom is logged into higgsfield.ai in the built-in browser (no connector yet).

**Lot 2 Higgsfield done (2026-10-21, 0 credit, Seedream 4.5 Unlimited 4K/5K)**: originals in
`.claude/nmm-inspiration/higgsfield/2026-10-21/` (frise-or/palatine/marbres, etoile-tesselles, page-marbre, fond-A/D-mosaique;
B/C rejected = flowers). Web versions in `public/hd/palerme/` via `design/hd/palerme/preparer.cjs` (browser-based, no Python).
Variants to compare (Tom must choose): `?palerme=1` (current bg + painted friezes + gold tesserae), `?fond=A|D` (new 5K bg,
video off), `?pages=marbre`. Tom's guardrail: he loves the current version — Palermo = touches, not a redesign.
Pending: Tom's choice; Higgsfield batch 2 = Kling video to animate the chosen bg (≈30 credits/5 s 4K as of 9 Oct, verify);
claude.ai copy of global instructions not updated (claude.ai session in built-in browser needs Tom to sign in).

**Tom's verdict on lot 2 (2026-10-21)**: friezes/« traits » = too maximalist → dropped (code kept, not shown). He wants
the background as before (only colored stains) + at most a subtle **Klimt touch** consistent with his inspirations.
Code variant `?klimt=1` = sparse gold squares/spirals/circles placed inside the most colored stains, glued to the painting.
Order he set: **background first (Higgsfield), then bubbles** — for bubbles he wants to SEE ALL of them to explain his vision
and review each (plan: a review board with per-bubble keep/refine/remove + note). Higgsfield edit of the current background
needs a reference upload: Tom must drag `public/hd/fond-16x9.webp` into Higgsfield → References → Uploads (the original 4K
background is not in his Higgsfield history, which starts 30 Sept).

**Fond, suite (2026-10-21 après-midi)** : Tom wants more joy/colour/warmth (Klimt = colour and warmth only, NO gold),
natural look kept, 5K, stains moving like **calm water**; compare code water (`?eau=1`, `src/engine/eau.ts`) vs Kling video.
Seedream drifts to figurative flowers (and "cauliflower edges" → literal cauliflowers: never use that term). Only abstract hit:
`hf_20261021_142042_305d479f-…` (n°5, dense round stains); at full strength bubbles get lost, at ~0.42 opacity it reads well.
Options shown: A actuel, B actuel réchauffé (CSS saturate 2.1 sepia .12), C n°5 adouci.
Tom's answer: **a mix of n°5 + current**, very high res, **embroidery running-stitch details (« petits pointillés »)**,
very lively animation; Kling 3.0 approved (30 credits). Seedream edits from n°5 (0 credit, ~8 min queue): m1 `hf_20261021_143540_daad226d…`,
**m2 `hf_20261021_143557_367ebefb…` (discreet stitches, my pick)**, m3 `hf_20261021_143600_3971f555…` (more threads). Mix = m-image
at 0.55 opacity over the current painting (in-situ test looked right). n°5 PNG downloaded to `.claude/nmm-inspiration/higgsfield/2026-10-21/`.
Tom validated m2 but wanted **more discreet stitches** → edit b `hf_20261021_145633_30a6e300…` chosen (`fond-m2-discret.png`);
mix baked by `design/hd/essais/melanger.cjs` → `public/hd/essais/fond-m2-16x9|9x16.webp`, flag `?fond=m2` (FOND_ESSAI in hd.ts).
eau.ts now adds warm light veil, faint vignette, parallax depth (follows constellation cam, returns in 3 s); 60 fps verified.
Bubble legibility ΔE (30 GRIS colours vs bg): mean 43.9 → 40.8, worst o5 18.3 → 12.8 (light oranges on orange stains).
**Tom liked the rumjahn "$10k cinematic website" method** (keyframes → Kling bridges with start/end frames); agreed plan:
background loop (Kling 3.0, start=end=m2b, 5 s 4K, 30 credits, launched) + **signature intro** (blank paper → drops bloom →
wet stains → stitches being sewn → final background), keyframes at 0 credit, Tom validates, then 4 bridges (~120 credits, OK to pay).
Higgsfield MCP: per official help, Unlimited does NOT apply via MCP (credits on every image) → keep web UI for images.
Gotcha: raising the image count above 1 silently turns Unlimited OFF (button shows credits).
**Kling result (30 credits spent)**: start=end frame + "static camera" → almost frozen video (mean pixel diff 0.7/255, seam jump),
`hf_20261021_150742_8b4d70ef…` saved as `public/hd/essais/fond-m2-kling-4k.mp4`. Code water: 1.86 diff after 1 s, loop seam 0.01 → code wins.
Kling 3.0 4K price = 6 credits/s (3 s = 18, 5 s = 30, 15 s = 90), duration 3–15 s. No ffmpeg on the machine.
Intro keyframes (from m2b ref): K1 blank `151820_21272ebb`, K3 fresh stains `151826_03b993bc`, K4 sewing `150841_c30c307d`, K5 = m2b;
K2 retried twice (words "bloom/blooms" give FLOWERS — never use them; also avoid "drops" → glossy 3D beads).
K2 final = `152817_866bcfe7` ("round spots of ink on damp blotting paper"). **Intro done (2026-10-21 evening)**: 4 Kling 3.0 bridges,
3 s 4K, 18 credits each (72 total), `public/hd/essais/entree-1..4.mp4` (18.6 MB total — must be re-encoded with ffmpeg before
publishing; ffmpeg not installed, ask Tom). Seams measured 2.7–3.0/255, end vs background 3.4. Player `src/components/Entree.tsx`
behind `?entree=1` (once per visit) / `?entree=toujours`; skipped on phones (LEGER), reduced motion, pause; speed ×1.4 ≈ 8.7 s.
Re-encoded with ffmpeg (1920×1080 H.264 CRF 21, faststart, no audio): 18.6 → 4.3 MB, seams unchanged; 4K originals moved to
`.claude/nmm-inspiration/higgsfield/2026-10-21/entree-4k/`. Next agreed step: **bubble workshop** (`/#/atelier/bulles`).
**Tom's feedback on intro (21 Oct night)**: too raw vs the soft constellation, needle unnatural, stutters; wants both worlds
blended (warmth + softness), finer transitions, 5K look, same softness when entering the constellation; bg water animation
"superbe" → slightly more alive/autonomous "comme des bulles"; asked which colours could be added (council).
Done: intro now lives INSIDE `.fond-peint.fond-explorer` (Entree rendered in Backdrop FondsPeints): current painting + video at
MELANGE=0.62 (hd.ts), bridges 1–2 only (needle bridges dropped), slowed ×1.15 + minterpolate 60 fps (24 fps ×1.4 caused judder),
files `entree-N-2560|1920.mp4`, then 2.6 s crossfade to the baked mix; bubbles/UI hidden via html.entree-en-cours then fade in.
Baked mix re-done at 0.62 (ΔE mean 40.6, worst o5 12.3). eau.ts: large drift `flotte` 1.3 (motion ×2 at 5 s, seam 0.01),
ampleur 0.034, `eclore()` bloom 3.2 s on entering explorer. Colour variants (0 credit, ref m2b): A Monet blues
`194933_d1410a7e` (too cold), **B Nabis sage greens `194945_0e6a5f23` (my pick)**, C blues+greens+light `194948_1ec938fe` (olive muddy) — Tom to choose.
Python on this PC hangs (Store alias) → use Edit tool, not python heredocs.
Intro v2 encodes: soft watercolour pass (curves lift darks, sat .85, gblur .8; bridge 2 fades back to original over 3.3 s),
2560 = 4.1 MB, 1920 = 2.4 MB; seam PSNR 37.6 dB; intro layer scaled 1/(1-MARGE) to match the shader crop. Not yet seen live
(Claude window was hidden → no rAF). Remaining flaw: small glossy highlights on bridge-1 ink drops (Kling) — fix = regenerate
bridge 1 with a matte prompt (18 credits, ask Tom). Bubble ΔE per colour variant: m2 40.6/12.4, A 41.6/14.6, B 41.3/12.0, C 38.6/8.3.
**Tom chose palette B** → `fond-m2-verts-nabis.png` baked as `essais/fond-m2-*` at 0.62 (ΔE 41.2, worst o5 11.5).
**Tom approved matte bridge 1 (18 credits)** → same endpoints K1→K2, matte prompt: `hf_20261021_204007_a7bd8b30` (no shine);
glossy original kept as `entree-4k/entree-1-4k-brillant.mp4`. Video credits spent 21 Oct: 30 + 72 + 18 = 120.
**Tom (late 21 Oct)**: stains appearing then crossfading = not natural → wants DROPS that deposit EXACTLY the constellation
surface, which then starts moving. Done in code (no video): eau.ts `apparaitre(7.4 s)` — 12 drops placed at chroma maxima of the
painting (`lirePeinture`), each spreads with irregular edge + pigment rim + wet core, final wash fills, then `vie` ramps the water;
Entree.tsx only hides bubbles/UI (class set in useState initializer to avoid flash) + skip (accelerates ×5). Kling intro videos
moved to `entree-4k/encodages-v2/` (unused). GPU cost on Tom's AMD Radeon iGPU: 4.8 ms/frame during intro, 4.1 ms after.
Also: flotte 1.6, ampleur 0.036, new `melange` 0.8 (wet regions blend neighbours), `vivacite` 1.12.
He also wants a RAWER fabric (current `.lin-hd` = lin.webp tiled 900px, multiply .13, over everything) like raw canvas;
references: Ruth Rae (stitched words/poems on fabric, "Layered, Tattered and Stitched"), Helen Frankenthaler soak-stain on raw
unprimed canvas (NGA). Higgsfield 0-credit tests queued: raw cotton duck, raw linen-jute, vivid soak-stain variant, vivid wet-in-wet.
Results: **Vif 1 (soak-stain on raw canvas) `hf_20261021_210906_ec42991c` applied as `?fond=m2`** (colour +45 %, bubble ΔE same
41.3/11.5); Vif 2 wet-in-wet rejected (worst bubble 6.9); palette B kept as `?fond=m2b`. **Raw canvas `?toile=1`** = cotton duck
`210756_34753daa` → neutral grey high-pass seamless tile (weave period measured 344×124 px, crop 12×20 periods, edge blend 128 px)
`essais/toile-1.webp` 768 px, CSS soft-light .85 at 384 px (~16 px/thread), over bubbles too, explorer only; `?toile=2` jute (too coarse).
Intro paper = page colour (#ECE9E2) and vignette only on painted parts (fixed grey corner). Test URL:
`?fond=m2&eau=1&toile=1&entree=toujours`. Remaining Higgsfield credits ≈ 454 (estimate: 574 − 120; balance not readable on site).
**Tom's credit rule (21 Oct night)**: no plan yet — reserve credits mainly for the BUBBLES, a little for the rest; warn him
when credits run low. **Weave over bubbles: keep (everywhere).** **Cotton-duck "osier" weave REJECTED** (too visible) →
wants fabric like Ruth Rae's (rawer, less conspicuous): she uses unbleached muslin + translucent organza, burns/tears/stains
fabric (Interweave video page). Muslin + muslin/gauze textures queued (0 credit).
**Done 22 Oct morning**: `toile-1.webp` = unbleached muslin `hf_20261021_213754_cd20413d` (high-pass σ10, gain 1.3, 2400 px
crop, 224 px edge blend, 1400 px tile) shown at 900 px, soft-light opacity .5; `toile-2.webp` = muslin + torn gauze
`213757_e29c14bf` (rawer option). Rejected cotton-duck/jute tiles moved to `2026-10-21/toiles-refusees/`.
Higgsfield login is lost every time the browser pane reopens — ask Tom to log in (never type passwords).
**22 Oct requests**: (1) intro left blank areas → now 20 drops (12 at chroma maxima + farthest-point fill), radii ×1.05,
keep spreading (+.05/s after 2.5 s), downward drips, masks advected by flow (vie .5 during intro), DUREE 8 s; coverage
measured 99 % at 5.5 s. (2) more alive: flotte 2, ampleur .04, 2nd drift layer (k=2) → motion after 5 s 10.9 (was 6.1),
seam .01, 3.9 ms/frame; whites: new `colore` .75 (cream paper = lum>.86 & chroma<.1) → white area 13 % → ~8 %.
(3) colour council: 0-credit variant ochre/tea-stain + plum/ink accents launched (ref vivid). (4) hook intro <20–30 s on
first visit(s) — frequency + texts to confirm (Tom rewrites all texts). (6) Seedance 2.5 prices read: 1080p 16 cr/s
(5 s 80, 10 s 160, 15 s 240), 720p 5 s 35, durations 4–30 s, max 1080p (no 4K).
Tom's answers: hook at visits 1 & 2 then drops only (localStorage `nmm:visites`, counted once per session); I draft
hook texts (provisional, he rewrites); Seedance: 35-credit test first, "don't skimp if good", wants "7K" quality (told him
Seedance caps at 1080p; mix video with the 2560 painting rather than replace); keep some credits for bubbles.
Hook built (Entree.tsx): drops 8 s with 2 phrases synced to drop time, then bubbles appear + 2 phrases, a centre bubble
opens (engine.select) and closes, UI arrives at 17 s; italic Newsreader + bordeaux running-stitch underline (#64303d
sampled from logo). Flags: `?entree=1` normal rule, `toujours` = hook, `gouttes` = drops only.
Colour council: ochre/plum variant `081837_d32266ff` REJECTED (dark dots look like flower centres, bubble o5 9.1).
Seedance test launched: 720p 5 s, @Image 1 = vivid bg, 35 credits.
Higgsfield gotchas: login can be lost when the pane reopens (Tom logs in himself); a promo aside with an invisible full-size
"Claim discount" button can catch synthetic clicks → click picker tiles via `button[aria-label="Select <uuid>"]` only.

Lot order agreed: 1 textes (+ audit fixes) → 2 visuel (mosaïque, fond 90 %) → 3 œuvre commune → 4 étoiles, Se perdre,
mur photos → 5 Le projet (frise, illustrations, dons) → 6 stockage/coûts, conformité → coherence pass.
Texts doc for rewriting: https://claude.ai/artifact/PtoCDvzFCH9DsFvTcEsYp5 (773 texts, IDs A001…J106; index + scripts in
`Desktop\Claude Code\.claude\nmm-textes\`). Branch `refonte-octobre` (committed + pushed to GitHub 27/10, 769769b) holds the audit fixes
(contrast token, tab titles, motion pause button, landmarks; 12 pages 0 axe violations).
**22 Oct late morning (verified on screen)**: credits 419/1000 (Plus plan €49/mo, renews & monthly credits reset Oct 29).
CORRECTION: Seedance 2.0 (not 2.5) DOES output 4K: 8 s = 176 cr, 10 s = 220 cr (22 cr/s, 4–15 s); Seedance 2.5 max 1080p
(5 s 80, 15 s 240). Wan 3.0 + Wan 3.0 Prime UNLIMITED (0 cr, 1080p, 2–30 s, start+end frames) until Oct 23; only ONE
unlimited generation at a time (2nd is refused, not charged). Model list also has Kling 4.0 1080p, FLUX.3 Video 4K,
Gemini Omni Flash 4K, Genjutsu Lite FREE 1080p. Wan Prime 15 s test (start=end=Vif 1) REJECTED: a big magenta "flower"
blooms in the centre (too eventful behind bubbles). Seedance test integrated (`?video=essai`, any `?video=<name>` →
essais/fond-video-<name>.mp4): video frozen at frame 0 during the drops, plays after; GPU 4.5 ms (720p) / 5.3 ms (1080p),
0 dropped frames. Colour grade raw Vif 1 → validated m2 = per-channel val*0.644+83.4 / 0.624+85.1 / 0.607+84.7 (err 2.9).
Built-in pane rAF throttles to ~2 fps when unfocused → intro looks slow in tests (not a site bug).
**Tom 22 Oct midday**: PREFERS the code water ("comme avant") as main background; video only if MINIMALIST (Seedance 2.5
test "trop maximaliste"); motion, autonomy and white space still matter; natural, motions going "joliment dans tous les
sens". Keep both versions (code water + video flag). Hook kept as is EXCEPT the bubble card with words + close cross
("bizarre") → now `engine.montrer(id)`: bubble swells 1.14 + name label (cartel), no card. Credits: approved "test 36
then 4K 10 s (220)" — show Tom the 36 test before spending 220. Higgsfield "Enhance prompt" toggle (input
name=enhancePrompt) was ON for all earlier video tests → likely cause of maximalism; turn it OFF. Wan Prime 30 s test
(enhance on) REJECTED: glossy orange jelly blob + shiny ribbons.
**26 Oct**: 4K Seedance 2.0 12 s done (`hf_20261022_095415_2005621a`, HEVC 3840×2160 24 fps) → loop `?video=4k`
(×1.3, 14.6 s, 1080p 10.9 MB; 1440p variant 22 MB). Motion calibration (simulated-second metric): base code 13.6, first
Seedance "trop maximaliste" 26.3, 4K + full flow 22.8 → `fluxVideo` default 0.5 → 17.2. Logo legible: painting is masked
around the logo (`.fond-peint` radial mask), min contrast 6.8–7.2. Bubbles ΔE same as still. Striped-shirt fabric
(`?toile=3`, full-frame `toile-pleine`) REJECTED by Tom. Tom wants WET-FELTED WOOL like his felt photos (merino base,
translucent dyed wool wisps, curly silk locks, knots) "le plus fidèle et naturel possible"; free draft first, final PAID
for quality. Drafts: white felt texture (Seedream, too fluffy/3D + shiny ribbon, rejected by me); felted painting from
Vif 1 (`hf_20261026_114820_33ca30f1`) → `?fond=feutre` (border cropped 4.5 %, gamma .62 + sat 1.25 to match m2,
lin hidden). Prices: Nano Banana 2.1 4K = 3 cr/image; Seedance 2.0 1080p = 12 cr/s (9 s = 108). Credits 119, reset to
1 000 on Oct 29 (monthly credits expire then). Higgsfield cookie banner: always "Rejeter les cookies non essentiels".
**26 Oct, felt chosen**: Tom likes the felted painting ("j'aime beaucoup") but not the big white curly lock (bottom right).
FINAL (paid, Nano Banana 2.1 4K, Thinking High, 3 cr each, 2 passes = 6 cr): `hf_20261026_121044_76f936a3` (5504×3072;
lock, frame lines, specks removed) → `public/hd/essais/fond-feutre-16x9|9x16.webp` (crop 16:9, grade r.72 g.63 b.67
gamma + sat 1.12 → 201/187/167 chroma 43.5 vs m2 209/194/172/45). Draft kept in scratchpad + originals in
`.claude/nmm-inspiration/higgsfield/2026-10-26/`. Bubbles ΔE 15.3/40.4 (m2 16.9/41.9); logo contrast in site 7.0–7.6.
Video for felt: Seedance 2.0 4K 12 s (264 cr) APPROVED for Oct 29 when credits reset (prompt: flow, enhance OFF,
@Image 1 = felt final). Credits after today ≈ 113. Main presentation URL: `?fond=feutre&eau=1&entree=toujours`.
**26 Oct afternoon (Tom: "j'aime énormément")**: logo — NO white halo: `.fond-peint` mask now only lightens to 80 %
(ellipse 30 %×18 %), logo img gets a tight light outline (drop-shadow .6px/1.4px/4px paper colour); mean contrast
behind logo 4.4–5.7. Colours more autonomous/mixing/vibrant/organic but a bit slower: shader adds curl-noise
"tourbillon" layer; defaults periode 44 (was 30), ampleur .046, melange 1.05, vivacite 1.1, humide .34–.70; felt metric
per-second 24.8 → 22.8, excursion over 35 s 34.2 → 45.3, GPU 4.25 ms. Bubbles: soft centred warm "creux" under each
bubble (constellation.ts, `?creux=0` to compare) — no offset shadow, no light halo. Next: Tom reviews the welcome
animation, then the bubbles board (atelier).
**26 Oct late**: Tom: even more organic/autonomous → shader adds "souffle" (gradient-of-noise breathing) + stronger
tourbillon (.18); defaults ampleur .05, periode 48 (per-second 23.4, excursion 46.4). Bubbles: Tom REJECTS any dark
shadow/creux AND "autant d'effet" (coloured aura removed too): "mets-les en beauté comme elles sont, plus visibles" →
constellation only: D 42 (small 37, was 38/34) + `embellir()` baked once per sprite (saturate 1.12, brightness 1.06,
contrast 1.02 → chroma +21 %, lightness +6 %); `?eclat=0` = before. Sprite design untouched (Tom reviews the board next).
**26 Oct end**: Tom: "c'est parfait". Hook: the bubble shown at the end no longer shows its name (`montrer` no longer
calls setHover; shown bubble held still); hover names KEPT (Tom likes them). Verified: no name 13.3–17.3 s, UI 17.7 s.
I advised spending his remaining session on the bubble board rather than more polish → atelier opened
(`/#/atelier/bulles`, choices in localStorage `nmm:atelier-bulles` of the built-in pane; read them when he says "c'est fait").
**26 Oct atelier**: Tom asked for ONE number per bubble: its mean resemblance % with all others + difference %
(he rejected top-3 "proches" and a compare mode as too much). `src/lib/ressemblance.ts` (design only: same grey + same
seed, rotation-invariant: radial profile, density histogram, grain fine/large, contour irregularity, coverage; z-scored;
100 % = identical, 0 % = 95th-percentile distance). Mean 41.9 %, range 1 % (n°00, cousue) to 57 %.
**26 Oct palettes B/C DONE**: resemblance number removed (Tom: "Retire le chiffre"). Palette B = 100 "éléments de la
vie" (101–200, `public/hd/taches-vie/vie-NN.webp`, 512 px), palette C = 30 DA + 2 extra Palermo (rinceaux, arcs de
Monreale) (201–232, `taches-da/da-NN.webp`). Made with Nano Banana 2.1 4K, 4 stains per 2×2 sheet (3 cr each, 33 sheets
= 99 cr); originals `.claude/nmm-inspiration/higgsfield/2026-10-26/bulles-vie/planche-BNN|CNN.png`; cutter
`design/hd/taches_vie.cjs` (paper detection for dark-bordered sheets, centre band with gap 6). Credits left 14/1000
(verified) until renewal 29 Oct. Atelier persists choices to `design/atelier-bulles.json` (vite dev plugin). Next: Tom
composes his 100 from A/B/C in the atelier; read the json when he says "c'est fait".
**26 Oct, palette C → 100 (ON HOLD)**: Tom wants C extended by 68 to reach 100, "toute ma DA": églises 14 (vitraux,
voûtes, rosaces, Palerme, Monreale), broderies + Ruth Rae 14, Klimt 8, Monet 8, Nabis 8, Beksiński 6 (HIS MATTER ONLY:
bone-lace textures, powdery mists, organic cathedral-like structures, light grey, no figures/skulls/funeral — Tom chose
this), GRIS + feutre 6, Palerme ornaments 4. "in the spirit of", never a copy (C25 Klimt tree too close). Tom: "si tu
n'as plus rien..." then: "épuise les dernières intelligemment, je ne veux PAS de gratuit" → NO free/Unlimited for
bubbles (quality first). Spent the last 14 cr: 4 sheets 4K (3 cr) + 1 sheet 2K (2 cr) = C33–C52 (names in
palettesNoms.ts / bulles-vie.md); PALETTES.C fin 252. Credits 0/1000 (verified). Remaining 48 (C53–C100) after the
29 Oct renewal, NB 2.1 4K (36 cr), same balanced split minus what's done.
**26 Oct, coupe des bulles**: Tom picks his 100 by DUELS only (2 choices at a time, "après je me perds"). Page
`/#/atelier/coupe` (dev only, CoupeBulles.tsx, data src/data/coupeBulles.ts): 253 bubbles (A0–A100, B1–100, C1–52),
round 1 = 126 duels of look-alike "jumelles" hand-paired by family (A0 aquarelle cousue exempt), round 2 = 27 duels
between winners of the closest pairs → 100. Same tint for both bubbles; undo; saved to design/coupe-bulles.json
({choix, finale}). Quotas: none (Tom: libre). The 48 future C (after 29 Oct) will each duel their nearest kept bubble.
Read the json when Tom says "c'est fait".
