#!/usr/bin/env python

import json
import yaml

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

def area_data_json():
    with open('Ecosystem/AreaData.yml','r') as f:
        data = yaml.load(f, Loader=yaml.FullLoader)
    json.dump(data, open('area_data.json','w'))


def climate_data_json():
    with open('WorldMgr/normal.winfo.yml','r') as f:
        data = yaml.load(f, Loader=yaml.FullLoader)

    climate_data = {}

    z = list(range(0,1100,100))
    for name, val in data['param_root']['objects'].items():
        if not name.startswith('ClimateDefines'):
            continue

        day, night = [], []

        for v in z:
            day.append(val[f"ClimateTemperatureDay_{v:04}"])
            night.append(val[f"ClimateTemperatureNight_{v:04}"])
        climate_data[name] = {
            'Day': day,
            'Night': night,
            'height': z,
        }
        for key, value in val.items():
            if key == "FeatureColor":
                #print(val2[0].value)
                value = [v.value for v in value]
            climate_data[name][key] = value

    json.dump(climate_data, open('climate_data.json','w'))

area_data_json()
climate_data_json()
