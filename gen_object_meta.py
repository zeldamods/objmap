#!/usr/bin/env python3

import os
import yaml
import json
import glob

def u_constrt(loader, node):
    return node.value
def io_constrt(loader, node):
    value = loader.construct_mapping(node)
    return value
def list_constrt(loader, node):
    value = loader.construct_mapping(node)
    return value
def obj_constrt(loader, node):
    value = loader.construct_mapping(node)
    return value
def str_constrt(loader, node):
    return node.value
def vec3_constrt(loader, node):
    return node.value
def color_constrt(loader, node):
    return node.value
yaml.add_constructor('!u', u_constrt)
yaml.add_constructor('!io', io_constrt)
yaml.add_constructor('!color', color_constrt)
yaml.add_constructor('!list', list_constrt)
yaml.add_constructor('!obj', obj_constrt)
yaml.add_constructor('!str64', str_constrt)
yaml.add_constructor('!str32', str_constrt)
yaml.add_constructor('!str256', str_constrt)
yaml.add_constructor('!vec3', vec3_constrt)

meta = {}
def add_meta(name, key, value):
    if not name in meta:
        meta[name] = {}
    meta[name][key] = value

def is_npc(name):
    return name.startswith('Npc_')
def is_obj(name):
    return name.startswith('Obj_')
def is_item(name):
    return name.startswith('Item_')
def is_horse(name):
    return name.startswith('GameRomHorse')
def is_dummy(name):
    return name == 'Dummy'
def is_tree(name):
    return name.startswith('Tree')
def is_remain_wind(name):
    return name.startswith('RemainsWind')

def is_skip(name):
    return is_npc(name) or is_obj(name) or is_horse(name) or is_dummy(name) or is_tree(name) or is_remain_wind(name)


def get_value(data, names):
    v = data
    for name in names:
        if name in v:
            v = v[name]
        else :
            return None
    return v
for file in glob.glob(f'Actor/ActorLink/*.yml'):
    #print(file)
    with open(file,'r') as f:
        bdata = yaml.load(f, Loader=yaml.FullLoader)


    name = os.path.basename(file).replace('.yml','')

    gpar = get_value(bdata, ['param_root', 'objects', 'LinkTarget', 'GParamUser'])
    if gpar == 'Dummy' or gpar == 'MessageOnly':
        continue
    with open(f"Actor/GeneralParamList/{gpar}.gparamlist.yml", 'r') as f:
        data = yaml.load(f, Loader=yaml.FullLoader)

    enemy = get_value(data, ['param_root','objects','Enemy'])
    weapon = get_value(data, ['param_root','objects','WeaponCommon'])
    if not enemy and not weapon:
        continue
    aname = get_value(data, ['param_root', 'objects','System','SameGroupActorName'])
    #if aname and aname != '':
    #    name = aname
        #print(aname)
    if is_skip(name):
        continue
    life = get_value(data, ['param_root', 'objects', 'General','Life'])
    if life:
        add_meta(name, 'life', life)
    attack = get_value(data, ['param_root', 'objects', 'Attack','Power'])
    if attack:
        add_meta(name, 'attack', attack)
    #print(name, life, attack, file)
json.dump(meta, open('object_meta.json','w'))
