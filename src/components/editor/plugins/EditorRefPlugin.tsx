"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { type LexicalEditor } from "lexical"
import { useEffect } from "react"

// 将编辑器实例传回父组件的插件
interface EditorRefPluginProps {
  onEditorReady: (editor: LexicalEditor) => void
}

export function EditorRefPlugin({ onEditorReady }: EditorRefPluginProps): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 将编辑器实例保存到全局，供图片标签组件使用
    ;(window as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor =
      editor

    // 通知父组件编辑器已准备好
    onEditorReady(editor)
  }, [editor, onEditorReady])

  return null
}
