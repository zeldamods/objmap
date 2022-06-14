/*
  BSD 2-Clause License

  Copyright (c) 2022, Brian Savage <savage13@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  1. Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

  2. Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
  DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
  OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


import * as L from 'leaflet';

export type ColorScaleOptions = {
  min: number;
  max: number;
  palettes?: { [key: number]: any };
  name?: string;
};

export class ColorScale extends L.Control {
  min: number
  max: number
  max_ticks: number;
  nice_min: number;
  nice_max: number;
  tick_spacing: number;
  palettes: any;
  name: string;

  constructor(opt: ColorScaleOptions, options?: L.ControlOptions) {
    super(options)
    this.name = opt.name || "viridis";
    this.palettes = Object.assign({}, this.base_palettes, opt.palettes);
    this.min = opt.min;
    this.max = opt.max;
    this.max_ticks = 5;
    this.nice_min = this.min;
    this.nice_max = this.max;
    this.tick_spacing = (this.max - this.min) / this.max_ticks;
    if (!(this.name in this.palettes)) {
      this.name = Object.keys(this.palettes)[0];
    }
    this._calculate();
  }

  base_palettes: any = {
    gist_rainbow: {
      0.0: '#ff0028',
      0.06666666666666667: '#ff3200',
      0.13333333333333333: '#ff8e00',
      0.2: '#ffea00',
      0.26666666666666666: '#b7ff00',
      0.3333333333333333: '#5bff00',
      0.4: '#00ff00',
      0.4666666666666667: '#00ff5b',
      0.5333333333333333: '#00ffb6',
      0.6: '#00ebff',
      0.6666666666666666: '#008fff',
      0.7333333333333333: '#0032ff',
      0.8: '#2900ff',
      0.8666666666666667: '#8500ff',
      0.9333333333333333: '#e200ff',
      1.0: '#ff00bf',
    },
    viridis: {
      0.0: '#440154',
      0.14285714285714285: '#46317e',
      0.2857142857142857: '#365b8c',
      0.42857142857142855: '#277e8e',
      0.5714285714285714: '#1fa187',
      0.7142857142857143: '#49c16d',
      0.8571428571428571: '#9fd938',
      1.0: '#fde724',
    },
    terrain: {
      0.000: '#ddf892',
      0.125: '#eee98f',
      0.250: '#ccbd7d',
      0.375: '#aa926b',
      0.500: '#886658',
      0.625: '#997c76',
      0.750: '#bba7a3',
      0.875: '#ddd3d1',
      1.000: '#ffffff',
    },
    grays: { 0.0: 'black', 1.0: 'white' },
  };

  createPicker() {
    let div = L.DomUtil.create('div', 'colorscale-picker');
    let title = L.DomUtil.create('div', 'colorscale-picker-title');
    title.textContent = "Change Color Scheme";
    div.appendChild(title);
    for (const name of Object.keys(this.palettes)) {
      let cmap = this.palettes[name];
      let link = L.DomUtil.create('a');
      link.href = "#";
      link.title = `Use ${name} colormap`;
      link.addEventListener('click', (event: any) => {
        this.updateColorScaleByName(name);
        event.stopPropagation();
        // @ts-ignore
        this._map.fire('ColorScale:change', {
          name: name,
          palette: this.palettes[name],
          min: this.min,
          max: this.max,
        });
      });
      let line = this.createColorBar(cmap);
      line.classList.add('colorscale-picker-sample');
      line.style.margin = '5px';
      link.appendChild(line);
      div.appendChild(link);
    }

    return div;
  }

  createColorBar(palette: any) {
    let div = L.DomUtil.create('div', 'colorscale-bar');
    this.setColorScale(div, palette);
    return div;
  }

  setColorScale(scale: HTMLElement, palette: any) {
    let stops = Object.keys(palette).sort()
      .map((v: any) => `${palette[v]} ${v * 100}%`).join(", ");
    scale.style.background = `linear-gradient(to right, ${stops})`;
  }
  updateColorScale(palette: any) {
    let div = L.DomUtil.get('colorscale-bar-id');
    if (div) {
      this.setColorScale(div, palette);
    }
  }
  updateColorScaleByName(name: string) {
    if (name in this.palettes) {
      this.updateColorScale(this.palettes[name]);
    }
  }


  createScale(parent: any) {
    let title = L.DomUtil.create('div', 'colorscale-title');
    title.innerHTML = 'Height (m)';
    parent.appendChild(title);

    let div = L.DomUtil.create('div', 'colorscale-bar');
    this.setColorScale(div, this.palettes[this.name]);
    div.id = 'colorscale-bar-id'
    parent.appendChild(div);

    div = L.DomUtil.create('div', 'colorscale-labelbox');

    let i = 0;
    let tick = this.nice_min + i * this.tick_spacing;
    let scale = Math.floor(Math.log10(this.tick_spacing));
    scale = (scale < 0) ? Math.abs(scale) : 0;

    while (tick <= this.nice_max) {
      let tag = L.DomUtil.create('div', 'colorscale-label');
      tag.innerHTML = `${tick.toFixed(scale)}`;
      let pct = this._valToNorm(tick);
      tag.style.left = `${pct * 100}% `;
      div.appendChild(tag);
      i += 1;
      tick = this.nice_min + i * this.tick_spacing;
    }
    parent.appendChild(div);
    parent.appendChild(this.createPicker());
    return parent;
  }

  updateScale() {
    let parent: any = L.DomUtil.get('colorscale-id');
    L.DomUtil.empty(parent);
    this.createScale(parent);
  }

  onAdd(map: L.Map) {
    let parent = L.DomUtil.create('div', 'colorscale');
    parent.id = "colorscale-id";
    return this.createScale(parent);
  }

  minmax(min: number, max: number) {
    this.min = min;
    this.max = max;
    this._calculate();
    this.updateScale();
  }

  palette(): any {
    return this.palettes[this.name];
  }

  _calculate() {
    let range = this._niceNum(this.max - this.min, false);
    this.tick_spacing = this._niceNum(range / (this.max_ticks - 1), true);
    this.nice_min = Math.ceil(this.min / this.tick_spacing) * this.tick_spacing;
    this.nice_max = Math.floor(this.max / this.tick_spacing) * this.tick_spacing;
  }


  _niceNum(range: number, round: boolean): number {
    let exponent = Math.floor(Math.log10(range));
    let fraction = range / Math.pow(10, exponent);

    let nice_fraction = 1.0;
    if (round) {
      if (fraction < 1.5) {
        nice_fraction = 1;
      } else if (fraction < 3) {
        nice_fraction = 2;
      } else if (fraction < 7) {
        nice_fraction = 5;
      } else {
        nice_fraction = 10;
      }
    } else {
      if (fraction <= 1) {
        nice_fraction = 1;
      } else if (fraction <= 2) {
        nice_fraction = 2;
      } else if (fraction <= 5) {
        nice_fraction = 5;
      } else {
        nice_fraction = 10;
      }
    }
    return nice_fraction * Math.pow(10, exponent);
  }

  _valToNorm(x: number): number {
    return (x - this.min) / (this.max - this.min);
  }
  _normToValue(x: number): number {
    return this.min + (this.max - this.min) * x;
  }

}
