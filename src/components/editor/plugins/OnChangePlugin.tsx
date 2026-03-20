"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"

// 监听编辑器内容变化的插件
interface OnChangePluginProps {
  onChange: (content: string) => void
}

export function OnChangePlugin({ onChange }: OnChangePluginProps): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 注册更新监听器
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        // 获取纯文本内容
        const root = editor.getRootElement()
        if (root) {
          onChange(root.innerText || "")
        }
      })
    })
  }, [editor, onChange])

  return null
}
