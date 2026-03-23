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
    onEditorReady(editor)
  }, [editor, onEditorReady])

  return null
}
