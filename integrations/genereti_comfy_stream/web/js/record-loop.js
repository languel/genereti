// State machine for capturing exactly one project-loop pass, subject to browser timer latency.
export class LoopCapture {
 constructor(snapshot){if(!snapshot?.playing||!snapshot.loop?.enabled||snapshot.loop.end<=snapshot.loop.start)throw Error('Play the project transport with a valid loop enabled first');this.epoch=snapshot.epoch;this.iteration=snapshot.iteration;this.loop=JSON.stringify(snapshot.loop);this.phase='armed';}
 update(s){if(!s?.playing||s.epoch!==this.epoch||JSON.stringify(s.loop)!==this.loop){this.phase='cancelled';return 'cancel';}if(s.iteration<this.iteration){this.phase='cancelled';return 'cancel';}if(this.phase==='armed'&&s.iteration>this.iteration){if(s.iteration!==this.iteration+1){this.phase='cancelled';return 'cancel';}this.iteration=s.iteration;this.phase='recording';return 'start';}if(this.phase==='recording'&&s.iteration>this.iteration){this.phase='done';return 'stop';}return null;}
}
