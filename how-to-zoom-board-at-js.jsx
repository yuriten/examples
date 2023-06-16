// check the online example: Todo
import React, { useState, useEffect, useRef } from "react"
import { useKeyPressEvent } from "react-use"

let containerSize = { w: 700, h: 600 }
const s = num => String(num).slice(0, 4)

const DevConsole = ({ offset, scale, origin }) => {
  return (
    <div className="absolute bottom-2 left-2 text-xs flex flex-col items-start z-10 text-white bg-gray-700">
      <div>scale: {s(scale)}</div>
      <div>
        offset: {s(offset.x)} {s(offset.y)}
      </div>
      <div>
        origin: {s(origin.x)} {s(origin.y)}
      </div>
    </div>
  )
}

const ZoomMvp = () => {
  let wallRef = useRef(null) // workflow 画布本身
  let canvasRef = useRef(null) // 容器背景
  let [cursor, setCursor] = useState("auto") // auto, grab, grabbing
  let [offset, setOffset] = useState({ x: 0, y: 0 }) // 缩放原点位置，渲染视图
  let [scale, setScale] = useState(1) // 缩放倍率，渲染视图
  let [origin, setOrigin] = useState({ x: 0, y: 0 }) // 缩放原点
  let offsetMark = useRef({ x: 0, y: 0 }) // 偏移量
  let offsetPointMark = useRef({ x: 0, y: 0 }) // 偏移点标记
  let scaleMark = useRef(1) // 缩放倍率标记，参与计算
  let originMark = useRef({ x: 0, y: 0 }) // 缩放原点，参与计算

  useKeyPressEvent(
    " ",
    () => setCursor("grab"),
    () => {
      setCursor("auto")
      offsetPointMark.current = null
    }
  )

  const getCoordinateWithClient = (clientX, clientY) => {
    if (canvasRef.current) {
      let rect = canvasRef.current.getBoundingClientRect()
      let offset = offsetMark.current
      let origin = originMark.current
      let scale = scaleMark.current
      let mousePoint = {
        x: clientX - rect.x - offset.x,
        y: clientY - rect.y - offset.y,
      }
      let coordinateInCanvas = {
        x: (mousePoint.x - origin.x) / scale,
        y: (mousePoint.y - origin.y) / scale,
      }
      return coordinateInCanvas
    }
    return { x: 0, y: 0 }
  }

  const handleScale = deltaY => {
    let min = 0.3
    let max = 5
    let dy = -deltaY
    scaleMark.current += dy * 0.015
    if (scaleMark.current > max) {
      scaleMark.current = max
    } else if (scaleMark.current < min) {
      scaleMark.current = min
    }
    setScale(scaleMark.current)
  }

  const handleOffset = e => {
    let moveX = e.deltaX * 0.15
    let moveY = e.deltaY * 0.15
    let next = {
      x: offsetMark.current.x - moveX,
      y: offsetMark.current.y - moveY,
    }
    offsetMark.current = next
  }

  const updateOrigin = e => {
    let coord = getCoordinateWithClient(e.clientX, e.clientY)
    originMark.current = {
      x: originMark.current.x + coord.x,
      y: originMark.current.y + coord.y,
    }
    offsetMark.current = {
      x: offsetMark.current.x - (1 - scaleMark.current) * coord.x,
      y: offsetMark.current.y - (1 - scaleMark.current) * coord.y,
    }
    setOrigin(originMark.current)
    setOffset(offsetMark.current)
  }

  useEffect(() => {
    let stop = event => {
      // console.log("wall stop", wc)
      // event.stopPropagation();
      event.preventDefault()
      return false
    }
    let SpaceStop = event => {
      if (event.key === " ") {
        stop(event)
      }
    }
    let wc = wallRef.current
    wc?.addEventListener("wheel", stop, { passive: false })
    document.addEventListener("keydown", SpaceStop, { passive: false })
    return () => {
      wc?.removeEventListener?.("wheel", stop)
      document.removeEventListener("keydown", SpaceStop)
    }
  }, [])

  return (
    <div
      className="relative overscroll-x-contain flex-center border-4 rounded border-gray-500"
      ref={wallRef}
    >
      <div
        className="relative overflow-hidden touch-pan-y border-2 bg-base-100 rounded-lg z-10"
        ref={canvasRef}
        style={{
          cursor: cursor,
          width: containerSize.w,
          height: containerSize.h,
        }}
        onWheel={e => {
          if (e.ctrlKey) {
            updateOrigin(e)
            handleScale(e.deltaY)
          } else {
            handleOffset(e)
            updateOrigin(e)
          }
        }}
        onPointerDown={e => {
          if (cursor === "grab") {
            setCursor("grabbing")
            offsetPointMark.current = { x: e.clientX, y: e.clientY }
          }
        }}
        onPointerMove={e => {
          let { clientX, clientY } = e
          if (cursor === "grabbing") {
            let moveX = clientX - offsetPointMark.current.x
            let moveY = clientY - offsetPointMark.current.y
            let next = {
              x: offsetMark.current.x + moveX,
              y: offsetMark.current.y + moveY,
            }
            setOffset(next)
          }
        }}
        onPointerUp={() => {
          offsetMark.current = { x: offset.x, y: offset.y }
          if (cursor === "grabbing") {
            setCursor("grab")
          }
        }}
      >
        <DevConsole offset={offset} scale={scale} origin={origin} />
        <div
          className="render-layout"
          style={{
            position: "relative",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: `${origin.x}px ${origin.y}px`,
          }}
        >
          <div
            className="absolute w-[10000px] h-[10000px] left-[-5000px] top-[-5000px] -z-10"
            style={{
              backgroundSize: `20px 20px`,
              backgroundImage: `radial-gradient(circle at 10px 10px, rgb(218, 224, 228) 1px, transparent 0px)`,
            }}
          />
          <div className="bg-gray-400 h-48 w-48 rounded absolute flex-center top-[20px] left-[20px]">
            Block
          </div>
          <div className="bg-purple-500 h-48 w-48 rounded absolute flex-center top-[300px] left-[300px]">
            Node
          </div>
          <div
            className="absolute w-4 h-4 z-10 rounded-full bg-pink-500 pointer-events-none"
            style={{
              transform: `translate(-8px, -8px)`,
              left: origin.x,
              top: origin.y,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export { ZoomMvp }
