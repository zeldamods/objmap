#!/usr/bin/env python3

from collections import defaultdict
from itertools import chain
import json
from pathlib import Path
import typing

Point = typing.Tuple[float, float]
class LocationMarkerBase:
    def __init__(self, l):
        self.l = l
    def get_message_id(self) -> str:
        return self.l.get('MessageID', '')
    def get_xz(self) -> Point:
        return (self.l['Translate']['X'], self.l['Translate']['Z'])

class LocationMarker(LocationMarkerBase):
    def get_save_flag(self) -> str:
        return self.l['SaveFlag']
    def get_icon(self) -> str:
        return self.l['Icon']

class LocationPointer(LocationMarkerBase):
    def get_show_level(self) -> int:
        return self.l['ShowLevel']
    def get_type(self) -> int:
        return self.l.get('PointerType', self.l['Type'])

data: dict = {}

root = Path(__file__).parent.parent
game_files_dir = root / 'public' / 'game_files'
map_dir = game_files_dir / 'map'

mainfield_static = json.load(open(map_dir/'MainField'/'Static.json', 'r'))
mainfield_location = json.load(open(map_dir/'MainField'/'Location.json', 'r'))
korok_data = json.load(open('korok_ids.json', 'r'))

mainfield_markers: defaultdict = defaultdict(list)
for l in mainfield_static['LocationMarker']:
    if 'Icon' not in l:
        continue
    mainfield_markers[l['Icon']].append(l)

def make_markers(entries, need_message_id=False):
    markers = []
    for l in entries:
        lm = LocationMarkerBase(l)
        if need_message_id and not lm.get_message_id():
            continue
        markers.append(l)
    return markers

data['markers'] = dict()
data['markers']['Location'] = make_markers(chain(mainfield_location, mainfield_static['LocationPointer']), need_message_id=True)
data['markers']['Dungeon'] = make_markers(mainfield_markers['Dungeon'])
data['markers']['Place'] = make_markers(chain(*(mainfield_markers[x] for x in ('Village', 'Hatago', 'Castle', 'CheckPoint'))))
data['markers']['Tower'] = make_markers(mainfield_markers['Tower'])
data['markers']['Labo'] = make_markers(mainfield_markers['Labo'])
data['markers']['Shop'] = make_markers(chain(*(mainfield_markers[x] for x in ('ShopBougu', 'ShopColor', 'ShopJewel', 'ShopYadoya', 'ShopYorozu'))))
data['markers']['Korok'] = korok_data

with open(game_files_dir / 'map_summary' / 'MainField' / 'static.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)
