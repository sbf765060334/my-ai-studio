import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  DecoratorNode,
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  type EditorConfig,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical"
import * as HoverCard from "@radix-ui/react-hover-card"
import { useEffect, useState, type JSX } from "react"

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
  const [editor] = useLexicalComposerContext()

  // 通过 Lexical editor 监听选区变化，检测光标是否在当前节点上
  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()

        if ($isNodeSelection(selection)) {
          // NodeSelection: 检查当前节点是否被选中
          setIsCursorNearby(selection.has(nodeKey))
          return
        }

        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor
          const focus = selection.focus

          // 检查 anchor 或 focus 是否指向当前节点
          if (anchor.key === nodeKey || focus.key === nodeKey) {
            setIsCursorNearby(true)
            return
          }
        }

        setIsCursorNearby(false)
      })
    })

    return () => removeListener()
  }, [editor, nodeKey])

  // 计算最终样式：鼠标悬浮或光标在附近都显示高亮
  const isActive = isHovered || isCursorNearby

  return (
    <HoverCard.Root openDelay={400} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <span
          data-image-node-key={nodeKey}
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
          <img
            src={src}
            alt={name}
            className="w-4 h-4 object-cover rounded-full shrink-0"
          />
          <span
            className={`
            text-[13px] whitespace-nowrap leading-none
            ${isActive ? "text-blue-700" : "text-gray-700"}
          `}
          >
            {truncateText(name, 10)}
          </span>
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          sideOffset={8}
          className="z-50 rounded-lg bg-white p-2 shadow-lg border border-gray-200
            data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <img
            src={src}
            alt={name}
            className="max-w-[240px] max-h-[240px] object-contain rounded"
          />
          <div className="text-xs text-gray-500 mt-1 text-center truncate max-w-[240px]">
            {name}
          </div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
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
