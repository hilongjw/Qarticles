(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) : (global.Qarticles = factory());
}(this, function () {
    'use strict';
    let cacheArr = []

    const concatArr = function(targetArr) {
        let arr
        for (let i = 1; i < arguments.length; i++) {
            arr = arguments[i];
            Array.prototype.push.apply(targetArr, arr);
        }
    }

    const spliceArr = function(arr, index, num) {
        let i, len
        for (i = index + num, len = arr.length; i < len; i++) {
            arr[i - num] = arr[i]
        }
        arr.length = len - num
        i = len = null
    }

    class Qtree {
        constructor(bounds, level = 0, parent = null) {
            this.objects = []
            this.nodes = []
            this.level = level
            this.bounds = bounds
            this.parent = parent
            this.MAX_OBJECTS = 10
            this.MAX_LEVELS = 5
            this.INDEX_TMP_TOP = 0
            this.INDEX_TMP_BOTTOM = 0
            this.INDEX_TMP_LEFT = 0
            this.INDEX_TMP_RIGHT = 0
        }

        clear () {
            this.objects.length = 0
            while (this.nodes.length) {
                let subnode = this.nodes.shift()
                subnode.clear()
            }
        }

        split () {
            let x = this.bounds.x
            let y = this.bounds.y
            let sWidth = this.bounds.sWidth
            let sHeight = this.bounds.sHeight

            this.nodes.push(
                new Qtree(new Rect(this.bounds.cX, y, sWidth, sHeight), this.level + 1, this),
                new Qtree(new Rect(x, y, sWidth, sHeight), this.level + 1, this),
                new Qtree(new Rect(x, this.bounds.cY, sWidth, sHeight), this.level + 1, this),
                new Qtree(new Rect(this.bounds.cX, this.bounds.cY, sWidth, sHeight), this.level + 1, this)
            )

            x
            = y 
            = sWidth 
            = sHeight = null
        }

        getIndex (rect, checkIsInner) {
            this.INDEX_TMP_TOP      = rect.y + rect.h <=  this.bounds.cY
            this.INDEX_TMP_BOTTOM   = rect.y >= this.bounds.cY
            this.INDEX_TMP_LEFT     = rect.x + rect.w <= this.bounds.cX
            this.INDEX_TMP_RIGHT    = rect.x >= this.bounds.cX

            if (checkIsInner &&
                (Math.abs(rect.cX - this.bounds.cX) + rect.sWidth > this.bounds.sWidth ||
                Math.abs(rect.cY - this.bounds.cY) + rect.sHeight > this.bounds.sHeight)) {
                return -1
            }

            if (this.INDEX_TMP_TOP) {
                if (this.INDEX_TMP_RIGHT) {
                    return 0
                } else if (this.INDEX_TMP_LEFT) {
                    return 1
                }
            } else if (this.INDEX_TMP_BOTTOM) {
                if (this.INDEX_TMP_LEFT) {
                    return 2
                } else if (this.INDEX_TMP_RIGHT) {
                    return 3
                }
            }

            return -1
        }

        insert (item) {
            let index
            let tmpitem
            if (this.nodes.length) {
                let index = this.getIndex(item)
                if (index !== -1) {
                    this.nodes[index].insert(item)
                    return
                }
            }
            this.objects.push(item)

            if (!this.nodes.length &&
                this.objects.length > this.MAX_OBJECTS &&
                this.level < this.MAX_LEVELS) {

                this.split()

                for (let i = this.objects.length - 1; i >= 0; i--) {
                    index = this.getIndex(this.objects[i]);
                    if (index !== -1) {
                        tmpitem = this.objects[i]
                        spliceArr(this.objects, i, 1)
                        this.nodes[index].insert(tmpitem)
                    }
                }
            }
            index = null
            tmpitem = null
        }

        refresh (scope) {
            let index, item
            scope = scope || this

            for (let i = this.objects.length - 1; i >= 0; i--) {
                index = this.getIndex(this.objects[i], true)
                if (index === -1) {
                    if (this.parent) {
                        item = this.objects[i]
                        spliceArr(this.objects, i, 1)
                        this.parent.insert(item)
                    }
                } else if (this.nodes.length) {
                    item = this.objects[i]
                    spliceArr(this.objects, i, 1)
                    this.nodes[index].insert(item)
                }
            }

            for (let i = 0, len = this.nodes.length; i < len; i++) {
                this.nodes[i].refresh(scope);
            }

            index = null
            item = null
        }

        retrieve (rect) {
            let result = cacheArr
            let index
            if (this.level === 0) result.length = 0;

            concatArr(result, this.objects);

            if (this.nodes.length) {
                index = this.getIndex(rect);
                if (index !== -1) {
                    this.nodes[index].retrieve(rect);
                } else {
                    let arr = rect.carve(this.bounds.cX, this.bounds.cY);
                    for (let i = arr.length - 1; i >= 0; i--) {
                        index = this.getIndex(arr[i]);
                        this.nodes[index].retrieve(rect);
                    }
                }
            }

            index = null

            return result
        }
    }

    class Rect {
        constructor(x, y, width, height, speedArr = {0: 20, 1: 20}) {
            this.speedArr = speedArr
            this.nextSpeedArr = {0: this.speedArr[0], 1: this.speedArr[1]}
            this.resize(width, height)
            this.moveTo(x, y)
        }

        moveTo (x, y) {
            this.x = x
            this.y = y
            this.cX = x + this.sWidth
            this.cY = y + this.sHeight
        }

        resize (width, height) {
            this.w = width
            this.h = height
            this.sWidth = width / 2
            this.sHeight = height / 2
        }

        draw (cxt) {
            cxt.save()
            cxt.beginPath()
            cxt.rect(this.x, this.y, this.w, this.h)
            cxt.closePath()
            cxt.restore()
        }

        run () {
            this.speedArr[0] = this.nextSpeedArr[0]
            this.speedArr[1] = this.nextSpeedArr[1]

            this.moveTo(
                this.x + this.speedArr[0] * 0.016,
                this.y + this.speedArr[1] * 0.016
            )
        }

        copy (rect) {
            this.resize(rect.w, rect.h)
            this.moveTo(rect.x, rect.y)
            this.nextSpeedArr[0] = rect.speedArr[0]
            this.nextSpeedArr[1] = rect.speedArr[1]
        }

        init (x, y, w, h, speedArr) {
            this.resize(w, h)
            this.moveTo(x, y)
        }

        collide (rect, isInner) {
            let tRect1 = tempRectArr[0], 
                tRect2 = tempRectArr[1],
                thisRect, sWidthSum, sHeightSum, dWidth, dHeight,
                onHorizontal, onVertical, focusPoint

            if (!isInner) {

                tRect1.copy(this)
                tRect2.copy(rect)

                sWidthSum = tRect1.sWidth + tRect2.sWidth
                sHeightSum = tRect1.sHeight + tRect2.sHeight
                dWidth = sWidthSum - Math.abs(tRect1.cX - tRect2.cX)
                dHeight = sHeightSum - Math.abs(tRect1.cY - tRect2.cY)

                while (dWidth > 0 && dHeight > 0) {
                    tRect1.run(-16)
                    tRect2.run(-16)
                    dWidth = sWidthSum - Math.abs(tRect1.cX - tRect2.cX)
                    dHeight = sHeightSum - Math.abs(tRect1.cY - tRect2.cY)
                }

                onHorizontal = dWidth <= 0
                onVertical = dHeight <= 0

                // 改变方向
                if (onHorizontal) {
                    focusPoint = this.cX > rect.cX ? 1 : -1
                    this.nextSpeedArr[0] = focusPoint * 
                        (Math.abs(this.nextSpeedArr[0]) + Math.abs(rect.speedArr[0])) / 2
                }

                if (onVertical) {
                    focusPoint = tRect1.cY > tRect2.cY ? 1 : -1
                    this.nextSpeedArr[1] = focusPoint * 
                        (Math.abs(this.nextSpeedArr[1]) + Math.abs(rect.speedArr[1])) / 2
                }

            } else {
                if (Math.abs(this.cX - rect.cX) + this.sWidth > rect.sWidth) {
                    this.nextSpeedArr[0] = -(this.nextSpeedArr[0] || this.speedArr[0])
                    this.moveTo(this.cX > rect.cX ? 
                        rect.x + rect.w - this.w : rect.x, this.y)
                }
                if (Math.abs(this.cY - rect.cY) + this.sHeight > rect.sHeight) {
                    this.nextSpeedArr[1] = -(this.nextSpeedArr[1] || this.speedArr[1])
                    this.moveTo(this.x, this.cY > rect.cY ? 
                        rect.y + rect.h - this.h : rect.y)
                }
            }

            tRect1
             = tRect2
             = thisRect
             = sWidthSum
             = sHeightSum
             = dWidth
             = dHeight
             = onHorizontal
             = onVertical
             = focusPoint = null
        }

        carve (cX, cY) {
            let result = [],
                temp = [],
                dX = cX - this.x,
                dY = cY - this.y,
                carveX = dX > 0 && dX < this.w,
                carveY = dY > 0 && dY < this.h

            if (carveX && carveY) {
                temp = this.carve(cX, this.y);
                while (temp.length) {
                    result = result.concat(temp.shift().carve(this.x, cY));
                }

            } else if (carveX) {
                result.push(
                    new Rect(this.x, this.y, dX, this.h),
                    new Rect(cX, this.y, this.w - dX, this.h)
                )
            
            } else if (carveY) {
                result.push(
                    new Rect(this.x, this.y, this.w, dY),
                    new Rect(this.x, cY, this.w, this.h - dY)
                )
            }

            temp.length = 0
            dX
            = dY
            = carveX
            = carveY = null

            return result
        }

        isApproach (rect1, rect2) {
            let tRect1 = tempRectArr[0]
            let tRect2 = tempRectArr[1]

            tRect1.copy(rect1)
            tRect2.copy(rect2)

            tRect1.run();
            tRect2.run();

            return +(Math.pow(rect1.cX - rect2.cX, 2) - Math.pow(tRect1.cX - tRect2.cX, 2) +
                Math.pow(rect1.cY - rect2.cY, 2) - Math.pow(tRect1.cY - tRect2.cY, 2)).toFixed(6) > 0 ?
                true : false;
        }

        isCollide (rect1, rect2) {
            if (Math.abs(rect1.cX - rect2.cX) < rect1.sWidth + rect2.sWidth &&
                Math.abs(rect1.cY - rect2.cY) < rect1.sHeight + rect2.sHeight &&
                this.isApproach(rect1, rect2)) {

                rect1.collide(rect2);
                rect2.collide(rect1);
            }
        }
    }

    class Dot extends Rect {
        constructor(x, y, width, height, speedArr = {0:10, 1: 10}, linkCount, dotColorFuc, lineColorFuc) {
            super(x, y, width, height, speedArr)
            this.x = x
            this.y = y
            this.radius = width * .5
            this.width = width
            this.height = height
            this.speedArr = speedArr
            this.nextSpeedArr = {0: this.speedArr[0], 1: this.speedArr[1]}
            this.linkCount = linkCount
            this.dotColorFuc = dotColorFuc
            this.lineColorFuc = lineColorFuc
            this.dotColor = '#ccc'
            this.lineColor = '#ccc'
            this.linkingCount = 0
            this.updateColor()
        }

        updateColor (screenWidth, screenHeight) {
            this.dotColor = this.dotColorFuc(this, screenWidth, screenHeight)
            this.lineColor = this.lineColorFuc(this, screenWidth, screenHeight)
        }

        run (screenWidth, screenHeight) {
            this.limit(screenWidth, screenHeight)
            this.speedArr[0] = this.nextSpeedArr[0]
            this.speedArr[1] = this.nextSpeedArr[1]

            this.moveTo(
                this.x + this.speedArr[0] * 0.016,
                this.y + this.speedArr[1] * 0.016
            )
            this.updateColor(screenWidth, screenHeight)
        }

        draw (cxt) {
            cxt.fillStyle = this.dotColor
            cxt.save()
            cxt.beginPath()
            cxt.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
            cxt.fill()
            cxt.restore()
            this.linkingCount = 0
        }

        limit (width, height) {
            if ((this.x + this.sWidth) >= width || (this.x - this.sWidth) <= 0) {
                this.nextSpeedArr[0] = -this.nextSpeedArr[0]
            }

            if ((this.y + this.sHeight) >= height || (this.y - this.sHeight) <= 0) {
                this.nextSpeedArr[1] = -this.nextSpeedArr[1]
            }
        }

        linkWith (item, cxt) {
            cxt.strokeStyle = this.lineColor
            cxt.lineWidth = .4
            cxt.beginPath()
            cxt.moveTo(this.x, this.y)
            cxt.lineTo(item.x, item.y)
            cxt.stroke()
            cxt.closePath()
            cxt.save()
            item.linkingCount++
        }

        canLink (dots, cxt) {
            dots.forEach(dot => {
                if (dot.linkingCount < dot.linkCount) {
                    this.linkWith(dot, cxt)
                }
            })
        }

        isCollide (item1, item2) {
            if (Math.pow(item1.x - item2.x, 2) + Math.pow(item1.y - item2.y, 2) < Math.pow(item1.radius + item2.radius, 2) && this.isApproach(item1, item2)) {
                item1.collide(item2)
                item2.collide(item1)
            }
        }

    }
    
    let tempRectArr = []
    tempRectArr.push(
        new Rect(0, 0, 0, 0),
        new Rect(0, 0, 0, 0)
    )

    const defaultScreenWidth = window.innerWidth
    const defaultScreenHeight = window.innerHeight - 10

    const covColorFuc = (dot, w, h) => {
        return `rgb(${Math.floor(255 * (1 - dot.x / w))}, ${Math.floor(255 * (1 - dot.y / h))},${Math.floor(255 * (dot.speedArr[0]/ 100))})`
    }

    const covSpeedFuc = (m) => {
        return  Math.random() * m * (Math.random() * 2 - 1)
    }

    const sizeFuc = (sizeOption = {}) => {
        let min = sizeOption.min || 0
        let max = sizeOption.max || 20
        let random = sizeOption.random || true
        let size = sizeOption.size || 10
        if (random) {
            if (sizeOption.size) {
                return () => {return Math.random() * size}
            }
            return () => {return Math.random() * (max - min) + min}
        } else {
            return () => { return size }
        }
    }

    const lineLinkFuc =  (lineLink = {}) => {
        let count = lineLink.count || 4
        let show = lineLink.show === undefined ? true : lineLink.show

        return {
            count: count,
            show: show
        }
    }

    const dotFuc = (dot = {}) => {
        const physical = dot.physical === undefined ? true : dot.physical

        return {
            physical: physical,
            speed: dot.speed || 20,
            vxFuc: dot.vxFuc || covSpeedFuc,
            vyFuc: dot.vyFuc || covSpeedFuc,
            count: dot.count || 64,
            size: sizeFuc(dot.size)
        }
    }

    const colorFuc = (color = {}) => {
        return {
            dotColorFuc: color.dotColorFuc ||  covColorFuc,
            lineColorFuc: color.lineColorFuc ||  covColorFuc
        }
    }

    class Qarticles {
        constructor(canvas, options = {}) {
            this.dot = dotFuc(options.dot)
            this.lineLink = lineLinkFuc(options.lineLink)
            this.color = colorFuc(options.color)
            this.screenWidth = options.screenWidth || defaultScreenWidth
            this.screenHeight = options.screenHeight || defaultScreenHeight
            this.dotArr = []
            this.tree
            this.setCanvas(canvas)
            this.init()
            this.loop()
            this.DRAW_INDEX = 0
            this.DRAW_LEN = 0
            this.DRAW_J = 0
            this.DRAW_TMP_LEN = 0
            this.DRAW_TMP_RECT = []
        }

        setCanvas (canvas) {
            if (!canvas)  return console.error('canvas is must be requried')
            this.canvas = canvas
            canvas.height = this.screenHeight
            canvas.width = this.screenWidth
            canvas.setAttribute('style', `height: ${this.screenHeight}px; width: ${this.screenWidth}px`)
            this.cxt = this.canvas.getContext('2d')
        }

        init () {
            let size
            let dot
            this.dotArr.length = 0
            this.tree = new Qtree(new Rect(0, 0, this.screenWidth, this.screenHeight))
            for (let i = 0; i < this.dot.count; i++) {
                size = this.dot.size()
                dot = new Dot(
                        Math.floor(Math.random() * (this.screenWidth - 20)), 
                        Math.floor(Math.random() * (this.screenHeight - 20)), 
                        size, 
                        size, 
                        {0: this.dot.vxFuc(this.dot.speed), 1: this.dot.vyFuc(this.dot.speed)},
                        this.lineLink.count,
                        this.color.dotColorFuc,
                        this.color.lineColorFuc
                        )
                this.dotArr.push(dot)
                this.tree.insert(dot)
            }

        }

        draw () {
            this.DRAW_TMP_RECT.length = 0

            this.cxt.clearRect(0, 0, this.screenWidth, this.screenHeight)

            this.tree.refresh()

            for (this.DRAW_INDEX = 0, this.DRAW_LEN = this.dotArr.length; this.DRAW_INDEX < this.DRAW_LEN; this.DRAW_INDEX++) {
                this.DRAW_TMP_RECT.length = 0
                this.DRAW_TMP_RECT = this.tree.retrieve(this.dotArr[this.DRAW_INDEX])

                if (this.lineLink.show) {
                    this.dotArr[this.DRAW_INDEX].canLink(this.DRAW_TMP_RECT, this.cxt)
                }

                if (this.dot.physical) {
                    for (this.DRAW_J = 0, this.DRAW_TMP_LEN = this.DRAW_TMP_RECT.length; this.DRAW_J < this.DRAW_TMP_LEN; this.DRAW_J++) {
                        this.dotArr[this.DRAW_INDEX].isCollide(this.dotArr[this.DRAW_INDEX], this.DRAW_TMP_RECT[this.DRAW_J])
                    }
                }

                this.dotArr[this.DRAW_INDEX].run(this.screenWidth, this.screenHeight)
                this.dotArr[this.DRAW_INDEX].draw(this.cxt)
            }

            requestAnimationFrame(this.draw.bind(this))
        }

        loop () {
            requestAnimationFrame(this.draw.bind(this))
        }
    }
    
    return Qarticles
}));