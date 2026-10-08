import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from engine import Engine,ROOT
from PIL import Image,ImageDraw
import numpy as np
eng=Engine(256,control=False)
image=Image.open(ROOT/'artifacts/coreml-text-512.png')
for strength in [.65,.85,.95,1.]:
 out,metrics=eng.generate('a colorful ceramic toy robot, pink clay, intricate sculpture',image,mode='image',strength=strength)
 out.save(ROOT/'artifacts'/f'img-strength-{strength}.png')
 print(strength,metrics,flush=True)
