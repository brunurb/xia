//   This program is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//   You should have received a copy of the GNU General Public License
//   along with this program.  If not, see <http://www.gnu.org/licenses/>
//
//
// @author : pascal.fautrero@gmail.com

/*
 *
 */
class XiaDetail {
  constructor (parent, detail, idText) {
    this.parent = parent
    this.detail = detail
    if ('minX' in this.detail) {
      this.detail.minX = parseFloat(this.detail.minX)
      this.detail.maxX = parseFloat(this.detail.maxX)
      this.detail.minY = parseFloat(this.detail.minY)
      this.detail.maxY = parseFloat(this.detail.maxY)
    }
    if (!('id' in this.detail)) {
      this.detail.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0
          var v = (c === 'x') ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
    }
    this.detail.x = ('x' in this.detail) ? parseFloat(this.detail.x) : 0
    this.detail.y = ('y' in this.detail) ? parseFloat(this.detail.y) : 0
    if ('width' in this.detail) {
      this.detail.height = parseFloat(this.detail.height)
      this.detail.width = parseFloat(this.detail.width)
    }
    this.idText = idText
    this.title = this.parent.jsonSource.title
    this.desc = this.parent.jsonSource.desc
    this.path = ''
    this.kineticElement = null
    this.persistent = ''
    this.backgroundImage = null
    this.tooltip = null
    this.options = ('options' in this.parent.jsonSource) ? this.parent.jsonSource.options : ''
    this.click = (this.options.includes('disable-click')) ? 'off' : 'on'
    this.zoomable = ('fill' in this.parent.jsonSource) && (this.parent.jsonSource.fill !== '#000000') || !('fill' in this.parent.jsonSource)
    this.originalX = 0
    this.originalY = 0
    this.tween = null
    this.type= null
  }

  mouseover () {
    if ('mouseover' in this.parent.myhooks) {
      var result = this.parent.myhooks.mouseover(this)
      if ((typeof result !== 'undefined') && (result === false)) return
    }

    var zoomed = (this.parent.iaScene.cursorState.includes('ZoomOut.cur'))
    var focused_zoomable = (this.parent.iaScene.cursorState.includes('ZoomIn.cur'))
    var focused_unzoomable = (this.parent.iaScene.cursorState.includes('ZoomFocus.cur'))
    var overflown = (this.parent.iaScene.cursorState.includes('HandPointer.cur'))

    if (zoomed || focused_zoomable || focused_unzoomable || overflown) return

    document.body.style.cursor = 'pointer'
    this.parent.iaScene.cursorState = 'url(img/HandPointer.cur),auto'

    var cacheBackground = true
    for (let i in this.parent.xiaDetail) {
      var xiaDetail = this.parent.xiaDetail[i]
      var kineticElement = xiaDetail.kineticElement
      var objectType = kineticElement.getClassName()
      if (objectType === 'Sprite') {
        kineticElement.animation('idle')
        //kineticElement.frameIndex(0)
        kineticElement.setAttrs({ opacity: 0 })
        kineticElement.to({ opacity: 1 })
      } else if (objectType === 'Image') {
        if (xiaDetail.persistent === 'on') cacheBackground = false
        kineticElement.setImage(kineticElement.backgroundImage)
        kineticElement.setAttrs({ opacity: 0 })
        kineticElement.to({ opacity: 1 })
      } else {
        kineticElement.fillPriority('pattern')
        kineticElement.fillPatternScaleX(kineticElement.backgroundImageOwnScaleX)
        kineticElement.fillPatternScaleY(kineticElement.backgroundImageOwnScaleY)
        kineticElement.fillPatternImage(kineticElement.backgroundImage)
        kineticElement.stroke(xiaDetail.stroke)
        kineticElement.strokeWidth(xiaDetail.strokeWidth)
        kineticElement.setAttrs({ opacity: 0 })
        kineticElement.to({ opacity: 1 })
      }
    }
    if (cacheBackground === true) {
      this.parent.backgroundCache_layer.moveToTop()
      this.parent.backgroundCache_layer.to({ opacity: 1 })
    }
    this.parent.layer.moveToTop()
    this.parent.layer.draw()
    this.parent.parent.focusedObj = this.parent.index
  }

  zoom () {
    if ('zoom' in this.parent.myhooks) {
      var result = this.parent.myhooks.zoom(this)
      if ((typeof result !== 'undefined') && (result === false)) return
    }
    let delta = {"x": 0, "y":0}
    if (this.type == "sprite") {
      delta.x = (-1) * (this.kineticElement.x() - this.parent.minX) * (this.parent.agrandissement)
      delta.y = (-1) * (this.kineticElement.y() - this.parent.minY) * (this.parent.agrandissement)
      this.kineticElement.stop()
    }
    document.body.style.cursor = 'zoom-out'
    this.parent.iaScene.cursorState = 'url(img/ZoomOut.cur),auto'
    this.parent.iaScene.zoomActive = 1
    this.parent.group.zoomActive = 1
    this.parent.layer.moveToTop()
    this.parent.group.moveToTop()
    this.originalX = this.parent.group.x()
    this.originalY = this.parent.group.y()
    this.alpha = 0
    this.step = 0.1
    var newStrokeWidth = parseFloat(this.strokeWidth / this.parent.agrandissement)
    for (let i in this.parent.xiaDetail) {
      this.parent.xiaDetail[i].kineticElement.setStrokeWidth(newStrokeWidth)
    }
    this.parent.layer.draw()
    var currentDetail = this
    currentDetail.parent.group.to({
      x: currentDetail.parent.tweenX + delta.x,
      y: currentDetail.parent.tweenY + delta.y,
      scaleX: currentDetail.parent.agrandissement,
      scaleY: currentDetail.parent.agrandissement,
      easing: Konva.Easings.BackEaseOut,
      duration: 0.5
    })
  }
  unzoom () {
    if ('unzoom' in this.parent.myhooks) {
      var result = this.parent.myhooks.unzoom(this)
      if ((typeof result !== 'undefined') && (result === false)) return
    }
    if (this.type == "sprite") this.kineticElement.start()
    if ((this.parent.group.zoomActive === 1) &&
      (this.parent.group.scaleX().toFixed(5) === (this.parent.agrandissement).toFixed(5))) {
      this.parent.iaScene.zoomActive = 0
      this.parent.group.zoomActive = 0
      this.parent.group.scaleX(1)
      this.parent.group.scaleY(1)
      this.parent.group.x(this.originalX)
      this.parent.group.y(this.originalY)
      this.reset_state_all(this.parent.xiaDetail)
      this.parent.layer.draw()
      this.parent.backgroundCache_layer.to({ opacity: 0 })
      this.parent.iaScene.cursorState = 'default'
      this.parent.iaScene.element = null
      document.body.style.cursor = 'default'
      this.parent.parent.reorderItems()
    }
  }

  reset_state_all (arrayDetails) {
    for (let i in arrayDetails) {
      var xiaDetail = arrayDetails[i]
      var kineticElement = arrayDetails[i].kineticElement
      var objectType = kineticElement.getClassName()
      if (objectType === 'Image') {
        if (xiaDetail.persistent === 'on') {
          kineticElement.stroke('rgba(0, 0, 0, 0)')
          kineticElement.strokeWidth(0)
          kineticElement.setImage(kineticElement.backgroundImage)
        } else {
          kineticElement.setImage(null)
        }
      } else if (objectType === 'Sprite') {
        if (xiaDetail.persistent === 'off') {
          kineticElement.animation('hidden')
        }
        kineticElement.start()
      } else {
        kineticElement.fillPriority('color')
        kineticElement.fill('rgba(0,0,0,0)')
        kineticElement.setStroke('rgba(0, 0, 0, 0)')
        kineticElement.setStrokeWidth(0)
      }
    }
  }

  focus () {
    if ('focus' in this.parent.myhooks) {
      var result = this.parent.myhooks.focus(this)
      if ((typeof result !== 'undefined') && (result === false)) return
    }
    // first, reset state of previous selected elements
    if (this.parent.iaScene.element) {
      this.reset_state_all(this.parent.iaScene.element.xiaDetail)
      if ('layer' in this.parent.iaScene.element) this.parent.iaScene.element.layer.draw()
    }
    if (this.zoomable) {
      document.body.style.cursor = 'zoom-in'
      this.parent.iaScene.cursorState = 'url("img/ZoomIn.cur"),auto'
    } else {
      this.parent.iaScene.cursorState = 'url("img/ZoomFocus.cur"),auto'
    }

    // Next, paint all elements of current IaObject to show FOCUS state
    var cacheBackground = true
    for (let i in this.parent.xiaDetail) {
      var xiaDetail = this.parent.xiaDetail[i]
      var kineticElement = xiaDetail.kineticElement
      var objectType = kineticElement.getClassName()
      if (objectType === 'Sprite') {
        kineticElement.animation('idle')
        kineticElement.frameIndex(0)
      } else if (objectType === 'Image') {
        if (xiaDetail.persistent === 'on') cacheBackground = false
        kineticElement.setImage(kineticElement.backgroundImage)
      } else {
        kineticElement.fillPriority('pattern')
        kineticElement.fillPatternScaleX(kineticElement.backgroundImageOwnScaleX)
        kineticElement.fillPatternScaleY(kineticElement.backgroundImageOwnScaleY)
        kineticElement.fillPatternImage(kineticElement.backgroundImage)
        kineticElement.stroke(xiaDetail.stroke)
        kineticElement.strokeWidth(xiaDetail.strokeWidth)
      }
    }
    if (cacheBackground) {
      this.parent.backgroundCache_layer.moveToTop()
      this.parent.backgroundCache_layer.to({ opacity: 1 })
    }
    this.parent.layer.moveToTop()
    this.parent.layer.draw()
    this.parent.iaScene.element = this.parent
  }

  touchstart (evt) {
    if ((this.parent.iaScene.element) && (this.parent.iaScene.element.group !== this.parent.group)) {
      return
    }
    // promise catched in main.js Xia.prototype.addUndoEvents
    // We just want to chain stage events just after shape events
    this.parent.event = new Promise(function (resolve) {
      var zoomed = (this.parent.iaScene.cursorState.includes('ZoomOut.cur'))
      var focused_zoomable = (this.zoomable === true)

      if (this.options.includes('direct-link')) {
        location.href = this.title
      } else {
        this.parent.iaScene.noPropagation = true
        if (zoomed) {
          this.unzoom()
        } else if (focused_zoomable) {
          this.parent.iaScene.element = this.parent
          // emulate mouseover on mobile devices
          // to get all stuffs done during mouse over event
          //if (evt.type === 'touchstart') this.mouseover()
          this.mouseover()
          this.zoom()
          this.parent.parent.focusedObj = this.parent.index
        } else {
          if (this.parent.iaScene.zoomActive === 0) {
            this.focus()
            this.parent.parent.focusedObj = this.parent.index
          }
        }
      }
      resolve(0)
    }.bind(this))
  }
  mouseleave () {
    if ('mouseleave' in this.parent.myhooks) {
      var result = this.parent.myhooks.mouseleave(this)
      if ((typeof result !== 'undefined') && (result === false)) return
    }
    var zoomed = (this.parent.iaScene.cursorState.includes('ZoomOut.cur'))
    var focused_zoomable = (this.parent.iaScene.cursorState.includes('ZoomIn.cur'))
    var focused_unzoomable = (this.parent.iaScene.cursorState.includes('ZoomFocus.cur'))

    if (zoomed || focused_zoomable || focused_unzoomable) return

    document.body.style.cursor = 'default'
    this.parent.iaScene.cursorState = 'default'
    var mouseXY = this.parent.layer.getStage().getPointerPosition()
    if (typeof mouseXY === 'undefined') {
      mouseXY = { x: 0, y: 0 }
    }
    if ((this.parent.layer.getStage().getIntersection(mouseXY) !== this)) {
      this.parent.backgroundCache_layer.to({ opacity: 0 })
      for (let i in this.parent.xiaDetail) {
        var xiaDetail = this.parent.xiaDetail[i]
        var kineticElement = this.parent.xiaDetail[i].kineticElement
        var objectType = kineticElement.getClassName()
        if (objectType === 'Image') {
          if (xiaDetail.persistent === 'off') {
            kineticElement.setImage(null)
          } else {
            kineticElement.setImage(kineticElement.backgroundImage)
          }
        } else if (objectType === 'Sprite') {
          if (xiaDetail.persistent === 'off') kineticElement.animation('hidden')
        } else if (objectType === 'Path') {
          if (xiaDetail.persistent === 'off') {
            kineticElement.fillPriority('color')
            kineticElement.fill('rgba(0, 0, 0, 0)')
            kineticElement.stroke('rgba(0, 0, 0, 0)')
            kineticElement.strokeWidth(0)
          } else {
            kineticElement.fillPriority('color')
            kineticElement.fill(this.parent.iaScene.cacheColor)
            kineticElement.stroke('rgba(0, 0, 0, 0)')
            kineticElement.strokeWidth(0)
          }
        }
      }
      this.parent.layer.draw()
    }
  }

  addEventsManagement () {
    if (this.options.includes('disable-click')) return
    this.kineticElement.on('mouseover', this.mouseover.bind(this))
    this.kineticElement.on('click touchstart', this.touchstart.bind(this))
    this.kineticElement.on('mouseleave', this.mouseleave.bind(this))
  }
}

if (typeof module !== 'undefined' && module.exports != null) {
  exports.XiaDetail = XiaDetail
}
