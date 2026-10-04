"""Model-free queue check; explicit local URL, no device/audio I/O."""
import json,sys,time,urllib.request
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8000'
prompt={
'1':{'class_type':'EmptyImage','inputs':{'width':64,'height':64,'batch_size':2,'color':8453952}},
'2':{'class_type':'GeneretiConvertTopToChop','inputs':{'image':['1',0],'sample_width':8,'sample_height':4,'sample_rate':2,'batch_index':1}},
'3':{'class_type':'GeneretiConvertChopToTop','inputs':{'input':['2',0],'layout':'rgba','width':8}},
'4':{'class_type':'GeneretiConvertTopToDat','inputs':{'image':['3',0],'sample_width':8,'sample_height':4,'sample_rate':2,'batch_index':0}},
'5':{'class_type':'GeneretiDatToChop','inputs':{'input':['4',0],'sample_rate':2,'header':True}},
'6':{'class_type':'GeneretiDatFromChop','inputs':{'input':['5',0]}},
'7':{'class_type':'GeneretiConvertDatToTop','inputs':{'input':['6',0],'header':True}},
'8':{'class_type':'PreviewImage','inputs':{'images':['7',0]}},
'9':{'class_type':'GeneretiMusicSequencer','inputs':{'notes':'60 64 - 67','bpm':120,'division':2,'gate':.5,'velocity':.7,'samples':8,'sample_rate':8,'time':0}},
'10':{'class_type':'GeneretiChopMidiOut','inputs':{'input':['9',0],'device':'','message':'note','channel':1,'number':60}},
'11':{'class_type':'GeneretiMusicSynth','inputs':{'input':['9',0],'voice':'sine','level':.15,'attack':.02,'decay':.15,'sustain':.7,'release':.25,'cutoff':1800,'resonance':.7,'glide':.02,'vibrato':0,'vibrato_rate':5}},
'12':{'class_type':'GeneretiMusicDrumKit','inputs':{'input':['9',0],'level':.15,'decay':.2,'tone':1}}}
r=json.load(urllib.request.urlopen(urllib.request.Request(base+'/prompt',data=json.dumps({'prompt':prompt,'client_id':'opentouch-queue-test'}).encode(),headers={'Content-Type':'application/json'})))
for _ in range(100):
 h=json.load(urllib.request.urlopen(base+'/history/'+r['prompt_id']))
 if h:break
 time.sleep(.1)
else:raise TimeoutError('Comfy did not complete within ten seconds')
entry=h[r['prompt_id']];assert entry['status']['status_str']=='success',entry['status'];assert '8' in entry['outputs'];print('Six family conversions + MIDI/synth/drum Queue pass-through: success (no I/O)')
