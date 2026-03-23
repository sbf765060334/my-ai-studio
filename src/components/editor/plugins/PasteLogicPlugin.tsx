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

        // 为每个图片立即插入 loading 节点，然后后台上传
        for (const file of imageFiles) {
          let nodeKey: string | null = null

          // 立即插入 loading 节点
          editor.update(() => {
            const selection = $getSelection()
            if (selection) {
              const imageNode = $createImageTagNode("", file.name)
              selection.insertNodes([imageNode])
              nodeKey = imageNode.getKey()
            }
          })

          if (!nodeKey) continue

          // 后台上传
          const capturedKey = nodeKey
          onImageUpload(file)
            .then((result) => {
              editor.update(() => {
                const node = $getNodeByKey(capturedKey)
                if (!node || !$isImageTagNode(node)) return // 节点已删除，忽略

                if (result) {
                  node.setSrc(result.url)
                } else {
                  // 上传返回 null（验证失败等），删除 loading 节点
                  node.remove()
                }
              })
            })
            .catch((error) => {
              console.error("粘贴图片处理失败:", error)
              // 上传失败，删除 loading 节点
              editor.update(() => {
                const node = $getNodeByKey(capturedKey)
                if (node && $isImageTagNode(node)) {
                  node.remove()
                }
              })
            })
        }

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
