"""Run in TouchDesigner's Textport: exec(open('/path/to/genereti/integrations/touchdesigner/create_genereti.py').read())
Creates a new component, never replaces an existing network. Genereti must be running.
"""
import os

root=op('/project1') or op('/')
name='genereti'
index=1
while root.op(name) is not None:
    index+=1;name='genereti'+str(index)
component=root.create(baseCOMP,name)
component.nodeX=0;component.nodeY=-300
feed=component.create(webrenderTOP,'generated')
feed.par.url='http://127.0.0.1:8765/output'
feed.par.active=True
feed.par.updatewhenloaded=False
feed.par.alwayscook=True
feed.par.maxrenderrate=30
feed.par.outputresolution='custom'
feed.par.resolutionw=512;feed.par.resolutionh=512
feed.nodeX=-200
output=component.create(outTOP,'out1');output.inputConnectors[0].connect(feed);output.nodeX=50
info=component.create(textDAT,'README')
info.text='Start Genereti and press Start live. generated is the live AI texture. This network only consumes output; it does not trigger extra inference. Set generated URL to http://127.0.0.1:8765/p5 for the p5 stage.'
info.nodeY=-160
save_path=os.path.expanduser('~/Genereti.tox')
component.save(save_path)
print('Created',component.path,'and saved',save_path)
