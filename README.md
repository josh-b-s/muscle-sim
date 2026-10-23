# Muscle fibre fatigue

Open `index.html` in a browser. No build step or server needed.

Files: config (constants), fibre (state, metabolism, ionic fatigue), layout
(geometry), units (motor units, rate coding), controller (static-hold force
matching), dynamics (force-velocity, rep movement, drive selection),
tension (recruited fibres, time under high tension, effective reps), weeks (multi-week size projection), doseplot (its chart), provenance and provtable (where each parameter comes from), damage (per-fibre damage proxy), recovery (next-day projection), plot (projection chart), totals (session means), presets (presets and scenarios), sets (saved-sets table), panel (builds one muscle's DOM), lane (one muscle: controls, set tracking, update), muscle (time stepping, true-1RM
calibration, CNS/central fatigue), colours (fibre colour per view mode), view3d (3D view), trace
(force/raw-capacity/target/drive plot), ui (controls).

## CNS (central) fatigue

Separate from everything else tracked per-fibre, `Muscle.cns` is a
whole-muscle property representing reduced voluntary drive capacity
from the nervous system itself, not the muscle tissue. It builds with
the square of relative effort (near-max efforts cost disproportionately
more) and clears slowly - deliberately slower than local energy stores,
so it survives "Rest + refuel" and shows up as reduced performance
across successive sets even when local PCr/glycogen have refilled.
Only "Reshuffle" (a new muscle/new session) clears it. Tuned so it
stays negligible within a single set (protecting the rep-count
calibration below) but visibly accumulates across multiple sets with
short rest - roughly a 10-25% rep-count drop by the third heavy set in
a row with a minute of rest between, in informal testing.

## Calibration status

"100% load" is defined by actually simulating a fresh one-rep-max attempt
(binary search for the heaviest load a fresh muscle can carry through the
full range of motion) rather than an idealised, independently-fresh
snapshot at each point in the ROM. The earlier snapshot approach
understated real difficulty, because a real single does arrive at its
sticking point having already spent some PCr getting there rather than
teleporting to it fresh - accounting for that fixed nearly the whole
heavy-load gap in one change, more than any of the energetics tuning
below did on its own. This calibration runs once per muscle build (on
load and on "Reshuffle"), taking on the order of 100ms.

Dynamic reps at a fixed cadence were then checked against approximate
%1RM-to-reps tables (Brzycki/Epley-style; these vary by source and lift,
so treat them as a rough target, not ground truth). Current fit, run
headlessly against 220 fibres at 50% fast-twitch share:

| Load | Model reps | Reference reps (approx) |
|---|---|---|
| 95% | 1 | ~2 |
| 85% | 4 | ~6 |
| 70% | 10 | ~12 |
| 60% | 16 | ~17 |
| 50% | 22 | ~22 |
| 30% | 46 | ~45 |

As always: this is a teaching proxy tuned to reproduce the right shape
and rough magnitude, not a validated model of any specific person or
lift. Treat relative comparisons (this rep scheme vs that one, in this
sim) as more meaningful than any absolute number.


## Eccentric transition spike

The force trace shows a transient spike right at the concentric-to-eccentric
switch. Root cause: the neural drive signal and fibre activation are both
lagging signals chasing a moving target, and when the target load drops
suddenly at the phase switch, two cascaded lags overshoot before settling -
a standard control-systems effect, not a bug in the arithmetic. Fixed
partially by letting drive fall faster than it rises (`muscle.js`, the
`tau` in the drive-smoothing step), which cut the spike from ~1.68x down
to ~1.33x pre-transition force with no cost to the rep-count calibration
above. Tried reducing the eccentric force-velocity ceiling further (from
1.8x toward 1.3x) to shrink it more, but that traded away real calibration
accuracy (the energetics tuning implicitly relies on eccentric's "free"
recovery window) for only marginal further spike reduction - not a good
trade, so the ceiling was only nudged to 1.6x. A further reduction of the
residual spike would need the rep cycle to anticipate the turnaround
(easing effort down before reaching the top of the rep, the way a real
lifter does) rather than reacting to it after the fact - a bigger
structural change than a parameter tweak.


## Damage and next-day projection

Tension exposure and damage are session totals: they add up across sets and only "Reshuffle" clears them ("Rest + refuel" keeps them, like CNS fatigue).

`damage.js` accumulates per-fibre damage from fibre tension, mostly during the eccentric phase, scaled by load squared, muscle length (longer is worse), fast-fibre susceptibility and current fatigue. It does not feed back into force, so rep calibration is unchanged. Headless check at 50% fast share, one set to failure: mean damage is about 6% at 30% load, 15% at 50%, 19% at 70%, 20% at 85% and 11% for a single at 95% (few eccentrics).

`recovery.js` projects 0-96h assuming local energy is refuelled. Strength deficit = damage (recovers with a ~48h time constant) combined with leftover CNS fatigue (clears in hours). Soreness is delayed and peaks near 29h. Time constants are round-number picks in the range reported for DOMS studies, not fitted values, so use the curves for shape and comparisons, not absolute predictions.


## Compare mode, presets and the set log

Tick "Compare with muscle B" to add a second muscle. B starts as a copy of A's fibre layout with fresh state, then every control is independent. One Contract button and one Rest + refuel button drive both. "Copy A's fibres" on B re-clones A. Presets (per muscle) set load, cadence and mode. Scenarios (top bar) set up both muscles for a comparison and start a fresh session on each: heavy vs light to failure, fast vs slow tempo, slow vs fast twitch dominant.

Every finished set (failure or Relax) adds a row to the Saved sets table: load, reps, end reason, time, fibres recruited, high-tension time, effective reps (slow / fast, with the change from that set), damage, the cumulative 24h deficit and the setup. Static holds have no failure rule, so they end when you relax.

Behaviour changes from the single-muscle version: a new set starts from the bottom of the range with reps at 0, and the fibre and fast-twitch sliders rebuild on release instead of on every input.

## Store size by fibre type

Fast fibres get larger PCr and glycogen pools than slow ones (`cfg.pcrBoost` 0.3 and `cfg.glyBoost` 0.2 for the fastest fibre, scaled by type; 0 gives equal pools). Pools are in demand units, so a bigger pool drains more slowly as a fraction. Headless check with equal fibre count and equal total capacity: raising the boosts from 0 to 0.6 / 0.4 moved reps at 70% from 11.1 to 11.9 (20% fast) and 7.0 to 8.0 (80% fast), so the gap barely closes. In the model, fast-fibre fatigue is limited by H+ and ionic build-up more than by running out of fuel. The default nudges mixed-muscle reps at 70% from about 9 to 10 and at 85% from about 3.7 to 4.

## Cost per unit force and clearance switches

`cfg.fastEconomy` is the energy cost per unit force of the fastest fibre relative to the slowest (2.05 by default, which reproduces the old 5x cost per fibre; 1 means equal economy). `cfg.clearPerf` (0 to 1, default 0) makes H+ clearance drop with blood-flow occlusion at high force. Headless checks (equal fibre count and capacity, same absolute load, reps for 20% vs 80% fast): at 70%, default 11.4 vs 7.8; fastEconomy 1 gives 13.0 vs 11.0; clearPerf 1 gives 11.1 vs 7.6. Economy explains most of the fibre-type endurance gap; occlusion-limited clearance barely matters within a set, because H+ is limited by how fast it is produced, not how fast it is removed.

## Load mode for muscle B

By default each muscle's load is a percentage of its own 1RM. Tick "Same absolute load as A" on B and B's load slider locks to A's weight: B lifts A's load percent times A's 1RM, shown as a percentage of B's own 1RM (the "Load (own 1RM)" stat). Each panel also shows its 1RM in force units. Picking a preset or scenario on B switches back to its own percentage. The log's Load column records the effective percentage of that muscle's own 1RM, and the setup column notes "same weight as A".

## Size match for muscle B

"Match A's total strength (same size)" scales every fibre in B so its total force capacity equals A's, keeping B's fibre count and mix, then recalibrates B's 1RM. Unticking restores B's natural size. If A is rebuilt, B re-matches. The "Slow vs fast twitch dominant" scenario ticks both this and "Same absolute load as A"; both can be unticked by hand afterwards. Other scenarios and presets clear these boxes. Headless check (8 muscles per group, equal capacity): 1RMs were 189 / 185 / 184 for 20 / 50 / 80% fast, and at 70% of the 20%-fast 1RM reps were 11.1 / 8.1 / 7.0.


## Tension exposure (replaces the growth score)

The old blended stimulus score is gone. The model now reports three raw quantities per fibre type and does not combine them: fibres recruited, time above 30% of a fibre's max force, and effective reps (reps where the fibre spent at least half the rep above that threshold). The 30% threshold and the half-rep share are guesses.

## Weekly layer

`weeks.js` turns the current session into a size projection over 4-24 weeks. Hard sets (failure at 30% load or more) are counted per session, spread over the chosen sessions per week, and fed through a square-root dose-response: slope 0.24% per set at 12.25 weekly sets (Pelland 2024 preprint, sportrxiv.org), read as a 12 week study (median in Schoenfeld, Ogborn and Krieger 2017, which found about 0.37% per set, linear up to about 12 sets). Frequency has no effect of its own, matching Pelland. Damage left from the previous session reduces the next session's dose; that link is an assumption. Not modelled: slowing of gains over months, tendon, hormones, individual variation.

## Parameter sources

The page lists every parameter as literature, fitted or guess (`provenance.js`). None is measured on people. Update that file when a number changes source.

## Tests

`node --test "test/*.test.js"` (Node 18+, no dependencies, about 80 s). It pins the rep-to-load table, the 70% / 90 s rest drop (about 9 / 5 / 3), light vs heavy recruitment at failure, size-principle order, damage shape, and the weekly layer's literature anchors. Fibre layouts use a seeded random generator.


## 3D view

The muscle is drawn as a short length of muscle cut crosswise, cut face toward you. The face is the cross-section with every fibre, coloured by the selected view. The body behind it shortens and bulges with muscle length (constant volume) and narrows toward the far end. Drag to orbit, double-click to reset. It is a schematic of one pooled muscle: no pennation, tendon or joint is modelled. It replaces the old 2D cross-section canvas and needs WebGL.

Three.js r149 (`vendor/three.min.js`, MIT, licence in `vendor/three.LICENSE`) is vendored because later releases ship only as ES modules, which browsers refuse to load from `file://`.
