# Qarticles
A lightweight and high performance JavaScript library for creating particles

![preview.gif](http://77wdm6.com1.z0.glb.clouddn.com/preview.gif)

## Live Demos

[click here](http://hilongjw.github.io/Qarticles/demo.html).

### Install

* base

your html

```html
<script src="src_to_qarticles.js"></script>

```

* npm

```bash
npm i qarticles --save
```

your app.js

```javascript

import Qarticles from 'qarticles'

```

### Usage

```
var canvas = document.getElementById('cov')
var qarticles = new Qarticles(canvas)

```


### Options

```javascript

var canvas = document.getElementById('cov')

var covColorFuc = function (dot, w, h) {
    return `rgba(${Math.floor(255 * (1 - dot.x / w))}, ${Math.floor(255 * (1 - dot.y / h))},${Math.floor(255 * (dot.speedArr[0]/ 100))}, 0.4)`
}

var lineColorFuc = function (dot, w, h) {
    return `rgba(${Math.floor(255 * (1 - dot.x / w))}, ${Math.floor(255 * (1 - dot.y / h))},${Math.floor(255 * (dot.speedArr[0]/ 100))}, 0.1)`
}

var covSpeedFuc = (speed) => {
    return  Math.random() * speed * (Math.random() * 10 > 5 ? -1 : 1)
}

var options = {
    lineLink: {
        count: 2,
        show: true
    },
    color: {
        dotColorFuc: covColorFuc,
        lineColorFuc: lineColorFuc,
    },
    dot: {
        physical: true,
        speed: speed,
        vxFuc: covSpeedFuc,
        vyFuc: covSpeedFuc,
        count: 80,
        size: {
            random: true,
            max: 20,
            min: 0
        }
    }
    
}

var qarticles = new Qarticles(canvas, options)

```

## License

This project is licensed under the terms of the **MIT** license.


