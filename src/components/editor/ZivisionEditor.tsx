"use client"

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { type LexicalEditor } from "lexical"
import React from "react"
import { ImageTagNode } from "./ImageTagNode"
import { EditorRefPlugin } from "./plugins/EditorRefPlugin"
import { OnChangePlugin } from "./plugins/OnChangePlugin"
import { PasteLogicPlugin } from "./plugins/PasteLogicPlugin"

// 编辑器配置
const createInitialConfig = () => ({
  namespace: "ZivisionEditor",
  theme: {
    root: "relative w-full min-h-[56px] max-h-[200px] cursor-text px-1 py-[2px] bg-transparent outline-none text-sm leading-[25px] text-[#363636] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent",
    paragraph: "m-0 p-0",
    placeholder:
      "absolute top-0 left-0 text-sm text-[#999] pointer-events-none select-none px-1 py-[2px]",
  },
  onError: (error: Error) => {
    console.error("Lexical Editor Error:", error)
  },
  nodes: [ImageTagNode], // 注册自定义节点
})

// 编辑器 Props
interface ZivisionEditorProps {
  placeholder?: string
  onEditorReady: (editor: LexicalEditor) => void
  onChange: (content: string) => void
  onImageUpload: (file: File) => Promise<{ url: string; name: string } | null>
}

// ZivisionEditor 主组件
export function ZivisionEditor({
  placeholder = "让 Zivision 打造引人注目的社交媒体视觉",
  onEditorReady,
  onChange,
  onImageUpload,
}: ZivisionEditorProps) {
  return (
    <LexicalComposer initialConfig={createInitialConfig()}>
      <div className="relative w-full min-h-[56px] max-h-[200px]">
        {/* 富文本插件 */}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="relative w-full min-h-[56px] max-h-[200px] cursor-text px-1 py-[2px] bg-transparent outline-none text-sm leading-[25px] text-[#363636] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
              style={{
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            />
          }
          placeholder={
            <div className="absolute top-0 left-0 text-sm text-[#999] pointer-events-none select-none px-1 py-[2px]">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* 历史记录插件（撤销/重做） */}
        <HistoryPlugin />

        {/* 自动聚焦插件 */}
        <AutoFocusPlugin />

        {/* 编辑器引用插件 - 将 editor 实例传回父组件 */}
        <EditorRefPlugin onEditorReady={onEditorReady} />

        {/* 内容变化监听插件 */}
        <OnChangePlugin onChange={onChange} />

        {/* 粘贴图片处理插件 */}
        <PasteLogicPlugin onImageUpload={onImageUpload} />
      </div>
    </LexicalComposer>
  )
}

// 错误边界组件
class LexicalErrorBoundary extends React.Component<
  {
    children: React.ReactElement
    onError: (error: Error) => void
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactElement
    onError: (error: Error) => void
  }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error)
    console.error("Lexical Error:", error, errorInfo)
  }

  render(): React.ReactElement {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
          编辑器加载失败: {this.state.error?.message || "未知错误"}
        </div>
      ) as React.ReactElement
    }
    return this.props.children
  }
}
