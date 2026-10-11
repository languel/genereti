# perception.events

Define named events over a global perception stream. Edit rows or the version-1
JSON document; import/export shares the same portable format. Start ▶ explicitly.
Each step has a feature, comparison, threshold, hold milliseconds. Add steps for
a sequence, with overall timeout and cooldown. Live progress shows recognition.
The feature picker lists observed numeric signals. For point proximity, use
`distance:hands.0.thumb_tip,hands.0.index_tip`; distances use image-height units.

Entry emits once after completion. Release the first condition to emit exit and
rearm; cooldown prevents rapid re-entry. Missing/stale data resets recognition.
CHOP gives active state, entry count and valid. DAT holds the last event batch;
watch count or subscribe to events to distinguish a new trigger from held data.
Livecode: `__.events.on('your.name', e => { if(e.phase==='entry') ... })`.
Rules never execute app commands or start inference/capture automatically.

Multiple named streams can be combined in a rule. Feed pose and hands providers
from the **same IMAGE source**, then use qualified names, for example
`distance:body::pose.nose,finger::pointer`. Here `finger` is a feature selection
stream whose first selected point is the index fingertip. Confirm its anatomical
side using observed handedness and the feature viewer; hand array order is not a
persistent left/right identity.

All required streams must be fresh, match source and image geometry, and have
frame timestamps within 150 ms. The slower timestamp drives holds, so one frozen
provider cannot complete a gesture. Missing or low-confidence landmarks reset
recognition. The feature picker also lists qualified signals from other streams.
