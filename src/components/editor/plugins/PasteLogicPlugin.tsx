"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $getNodeByKey,
  PASTE_COMMAND,
  type CommandListenerPriority,
} from "lexical"
import { useEffect } from "react"
import { $createImageTagNode, $isImageTagNode } from "../ImageTagNode"

// 处理粘贴图片的插件
interface PasteLogicPluginProps {
  onImageUpload: (file: File) => Promise<{ url: string; name: string } | null>
  onImageInserted?: (url: string, name: string) => void
}

export function PasteLogicPlugin({
  onImageUpload,
  onImageInserted,
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

        // 一次性插入所有 loading 节点，收集 nodeKey 后再逐个上传
        editor.update(() => {
          const selection = $getSelection()
          if (!selection) return

          for (const file of imageFiles) {
            const imageNode = $createImageTagNode("", file.name)
            selection.insertNodes([imageNode])
            const capturedKey = imageNode.getKey()

            // 后台上传
            onImageUpload(file)
              .then((result) => {
                editor.update(() => {
                  const node = $getNodeByKey(capturedKey)
                  if (!node || !$isImageTagNode(node)) return

                  if (result) {
                    node.setSrc(result.url)
                    onImageInserted?.(result.url, result.name)
                  } else {
                    node.remove()
                  }
                })
              })
              .catch((error) => {
                console.error("粘贴图片处理失败:", error)
                editor.update(() => {
                  const node = $getNodeByKey(capturedKey)
                  if (node && $isImageTagNode(node)) {
                    node.remove()
                  }
                })
              })
          }
        })

        // 返回 true 表示命令已处理
        return true
      },
      1 as CommandListenerPriority // COMMAND_PRIORITY_LOW
    )

    return () => {
      removeListener()
    }
  }, [editor, onImageUpload, onImageInserted])

  return null
}
