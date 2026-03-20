import {
  DecoratorNode,
  $getSelection,
  $isRangeSelection,
  type EditorConfig,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical"
import { useEffect, useState, useRef, type JSX } from "react"

// 序列化数据结构
export type SerializedImageTagNode = Spread<
  {
    src: string
    name: string
    type: "image-tag"
    version: 1
  },
  SerializedLexicalNode
>

// 截断文本函数：最多10个字，多的用...表示
function truncateText(text: string, maxLength: number = 10): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + "..."
}

// 图片标签节点类
export class ImageTagNode extends DecoratorNode<JSX.Element> {
  __src: string
  __name: string

  static getType(): string {
    return "image-tag"
  }

  static clone(node: ImageTagNode): ImageTagNode {
    return new ImageTagNode(node.__src, node.__name, node.__key)
  }

  constructor(src: string, name: string, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__name = name
  }

  // 创建 DOM 元素（仅用于内部表示，不渲染可见内容）
  createDOM(): HTMLElement {
    const span = document.createElement("span")
    span.contentEditable = "false"
    span.style.display = "inline"
    return span
  }

  // 更新 DOM（无需特殊处理）
  updateDOM(): false {
    return false
  }

  // 装饰器方法 - 返回 React 组件
  decorate(_editor: unknown, _config: EditorConfig): JSX.Element {
    return (
      <ImageTagComponent
        nodeKey={this.__key}
        src={this.__src}
        name={this.__name}
      />
    )
  }

  // 导出 JSON（序列化）
  exportJSON(): SerializedImageTagNode {
    return {
      type: "image-tag",
      version: 1,
      src: this.__src,
      name: this.__name,
    }
  }

  // 导入 JSON（反序列化）
  static importJSON(serializedNode: SerializedImageTagNode): ImageTagNode {
    return new ImageTagNode(serializedNode.src, serializedNode.name)
  }

  // 获取图片源
  getSrc(): string {
    return this.__src
  }

  // 获取图片名称
  getName(): string {
    return this.__name
  }
}

// 图片标签 React 组件
function ImageTagComponent({
  nodeKey,
  src,
  name,
}: {
  nodeKey: NodeKey
  src: string
  name: string
}): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const [isCursorNearby, setIsCursorNearby] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  // 监听选区变化，检测光标是否在 ImageTagNode "附近"
  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection()
      const element = elementRef.current

      if (!selection || !element) {
        setIsCursorNearby(false)
        return
      }

      // 检查原生选区是否与元素相交或包含元素
      let nearby = false

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)

        // 方法1：检查选区是否与元素相交
        if (range.intersectsNode(element)) {
          nearby = true
        }

        // 方法2：检查光标是否在元素前/后紧邻位置
        // 获取选区的起始和结束位置的 DOM 节点
        const startContainer = range.startContainer
        const endContainer = range.endContainer

        // 检查元素是否在选区的起始或结束位置
        if (
          element.contains(startContainer) ||
          element.contains(endContainer)
        ) {
          nearby = true
        }

        // 方法3：检查选区的父元素是否是当前元素
        const parentStart = startContainer.parentElement
        const parentEnd = endContainer.parentElement
        if (parentStart === element || parentEnd === element) {
          nearby = true
        }
      }

      setIsCursorNearby(nearby)
    }

    // 监听选区变化
    document.addEventListener("selectionchange", checkSelection)
    // 初始检查
    checkSelection()

    return () => {
      document.removeEventListener("selectionchange", checkSelection)
    }
  }, [])

  // 同时监听 Lexical 的选区变化（用于键盘导航）
  useEffect(() => {
    const editor = (
      window as unknown as {
        __lexicalEditor?: {
          registerUpdateListener: (
            callback: (arg: {
              editorState: { read: (fn: () => void) => void }
            }) => void
          ) => () => void
        }
      }
    ).__lexicalEditor

    if (!editor) return

    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) {
          // 不要在这里设置 false，让 DOM 检查来处理
          return
        }

        const anchor = selection.anchor
        const focus = selection.focus

        // 检查光标是否 "紧邻" ImageTagNode
        // 在 Lexical 中，DecoratorNode 的光标位置是 offset 0（前）或 1（后）
        let nearby = false

        // 如果 anchor 或 focus 指向当前节点
        if (anchor.key === nodeKey || focus.key === nodeKey) {
          nearby = true
        }

        // 如果选区是折叠的（单个光标）且在节点上
        if (selection.isCollapsed()) {
          if (anchor.key === nodeKey) {
            nearby = true
          }
        }

        // 注意：这里我们不使用 setIsCursorNearby，
        // 而是依赖上面的 DOM 检查，因为 DOM 检查更准确
        if (nearby) {
          setIsCursorNearby(true)
        }
      })
    })

    return () => removeListener()
  }, [nodeKey])

  // 计算最终样式：鼠标悬浮或光标在附近都显示高亮
  const isActive = isHovered || isCursorNearby

  return (
    <span
      ref={elementRef}
      data-image-node-key={nodeKey}
      // 样式：固定高度、垂直居中、与文字水平对齐，hover 或光标在附近时显示高亮效果
      className={`
        inline-flex items-center gap-1 px-1.5 h-[20px] mx-0.5 
        rounded-full border align-text-bottom select-none
        transition-all duration-150 ease-in-out
        ${
          isActive
            ? "bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-200"
            : "bg-gray-50 border-gray-300 hover:bg-gray-100"
        }
      `}
      contentEditable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 图片缩略图 - 圆形头像，垂直居中 */}
      <img
        src={src}
        alt={name}
        className="w-4 h-4 object-cover rounded-full shrink-0"
      />
      {/* 文件名 - 最多10个字，垂直居中 */}
      <span
        className={`
        text-[13px] whitespace-nowrap leading-none
        ${isActive ? "text-blue-700" : "text-gray-700"}
      `}
      >
        {truncateText(name, 10)}
      </span>
    </span>
  )
}

// 工厂函数：创建图片标签节点
export function $createImageTagNode(src: string, name: string): ImageTagNode {
  return new ImageTagNode(src, name)
}

// 检查节点是否是图片标签节点
export function $isImageTagNode(node: unknown): node is ImageTagNode {
  return node instanceof ImageTagNode
}
