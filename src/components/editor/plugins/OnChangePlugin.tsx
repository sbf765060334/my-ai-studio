"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, $isElementNode } from "lexical"
import { useEffect } from "react"
import { $isImageTagNode } from "../ImageTagNode"

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
        // 通过 Lexical 节点模型获取文本内容
        const root = $getRoot()
        const parts: string[] = []

        for (const paragraph of root.getChildren()) {
          const paragraphParts: string[] = []
          if ($isElementNode(paragraph)) {
            for (const child of paragraph.getChildren()) {
              if ($isImageTagNode(child)) {
                paragraphParts.push(`[image:${child.getName()}]`)
              } else {
                paragraphParts.push(child.getTextContent())
              }
            }
          } else {
            paragraphParts.push(paragraph.getTextContent())
          }
          parts.push(paragraphParts.join(""))
        }

        onChange(parts.join("\n"))
      })
    })
  }, [editor, onChange])

  return null
}
