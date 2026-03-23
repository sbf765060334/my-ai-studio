"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  PASTE_COMMAND,
  type CommandListenerPriority,
} from "lexical"
import { useEffect } from "react"
import { $createImageTagNode } from "../ImageTagNode"

// 处理粘贴图片的插件
interface PasteLogicPluginProps {
  onImageUpload: (file: File) => Promise<{ url: string; name: string } | null>
}

export function PasteLogicPlugin({
  onImageUpload,
}: PasteLogicPluginProps): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 注册粘贴命令监听器
    const removeListener = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        // 检查剪贴板中是否有文件
        const files = event.clipboardData?.files
        if (!files || files.length === 0) {
          // 没有文件，让默认处理继续
          return false
        }

        // 过滤出图片文件
        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith("image/")
        )

        if (imageFiles.length === 0) {
          // 没有图片，让默认处理继续
          return false
        }

        // 阻止默认粘贴行为
        event.preventDefault()

        // 按顺序上传所有图片，然后一次性插入
        const processImages = async () => {
          const nodes: { url: string; name: string }[] = []
          for (const file of imageFiles) {
            try {
              const result = await onImageUpload(file)
              if (result) {
                nodes.push({ url: result.url, name: result.name })
              }
            } catch (error) {
              console.error("粘贴图片处理失败:", error)
            }
          }
          if (nodes.length > 0) {
            editor.update(() => {
              const selection = $getSelection()
              if (selection) {
                const imageNodes = nodes.map((n) =>
                  $createImageTagNode(n.url, n.name)
                )
                selection.insertNodes(imageNodes)
              }
            })
          }
        }
        processImages().catch(console.error)

        // 返回 true 表示命令已处理
        return true
      },
      1 as CommandListenerPriority // COMMAND_PRIORITY_LOW
    )

    return () => {
      removeListener()
    }
  }, [editor, onImageUpload])

  return null
}
