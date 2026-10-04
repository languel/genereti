import json,time,urllib.request
# Local, model-free smoke check. Requires the texture and stream packs.
base='http://127.0.0.1:8000'
def get(path): return json.load(urllib.request.urlopen(base+path))
prompt={
'1':{'class_type':'EmptyImage','inputs':{'width':128,'height':128,'batch_size':2,'color':8453952}},
'2':{'class_type':'GeneretiTextureMath','inputs':{'image':['1',0],'operation':'multiply','value':.5}},
'3':{'class_type':'GeneretiTextureFilter','inputs':{'image':['2',0],'operation':'invert','amount':.25}},
'4':{'class_type':'GeneretiTextureTransform','inputs':{'image':['3',0],'translate_x':.1,'translate_y':0,'scale':1,'rotate':5,'flip_x':False,'flip_y':False}},
'5':{'class_type':'GeneretiTextureCrop','inputs':{'image':['4',0],'left':.1,'top':.1,'right':.9,'bottom':.9}},
'6':{'class_type':'GeneretiTextureCornerPin','inputs':{'image':['5',0], 'tl_x':.05,'tl_y':.1,'tr_x':.95,'tr_y':.05,'br_x':.85,'br_y':.95,'bl_x':.1,'bl_y':.8}},
'7':{'class_type':'GeneretiTextureFeedback','inputs':{'image':['6',0],'decay':.95,'translate_x':0,'translate_y':0,'scale':1,'rotate':0}},
'8':{'class_type':'EmptyImage','inputs':{'width':64,'height':64,'batch_size':1,'color':255}},
'9':{'class_type':'GeneretiTextureComposite','inputs':{'image':['7',0],'background':['8',0],'operation':'screen','opacity':.8}},
'10':{'class_type':'GeneretiLiveImagePreview','inputs':{'image':['9',0],'preview_size':128}}
}
response=json.load(urllib.request.urlopen(urllib.request.Request(base+'/prompt',data=json.dumps({'prompt':prompt,'client_id':'genereti-texture-queue-test'}).encode(),headers={'Content-Type':'application/json'})))
for _ in range(100):
    history=get('/history/'+response['prompt_id'])
    if history: break
    time.sleep(.1)
if not history:
    raise TimeoutError('Comfy did not complete the texture queue check within ten seconds')
entry=history[response['prompt_id']]
print(json.dumps({'status':entry['status'],'output_nodes':list(entry['outputs'])},indent=2))
assert entry['status']['status_str']=='success',entry['status']
assert '10' in entry['outputs']
