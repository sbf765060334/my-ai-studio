"use client"

import { uploadImage } from "@/lib/upload"
import { ZivisionEditor } from "@/components/editor"
import {
  $createImageTagNode,
  $isImageTagNode,
  ImageTagNode,
} from "@/components/editor/ImageTagNode"
import { message } from "antd"
import { $getSelection, $getNodeByKey } from "lexical"
import { type LexicalEditor } from "lexical"
import { ArrowUp, Paperclip } from "lucide-react"
import { useRef, useState } from "react"

// 模拟历史项目数据类型
interface RecentProject {
  id: string
  title: string
  updatedAt: string
  thumbnail?: string
}

export default function Home() {
  const [inputValue, setInputValue] = useState("")
  const [imageCount, setImageCount] = useState(0)
  const editorRef = useRef<LexicalEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 模拟历史项目数据 - 设为空数组表示没有历史记录
  const [recentProjects] = useState<RecentProject[]>([])

  // 编辑器准备就绪回调
  const handleEditorReady = (editor: LexicalEditor) => {
    editorRef.current = editor
    // 监听 ImageTagNode 的增删变动，实时更新计数
    editor.registerMutationListener(ImageTagNode, (mutations) => {
      let delta = 0
      for (const [, mutation] of mutations) {
        if (mutation === "created") delta += 1
        else if (mutation === "destroyed") delta -= 1
      }
      if (delta !== 0) {
        setImageCount((prev) => Math.max(0, prev + delta))
      }
    })
  }

  // 编辑器内容变化回调
  const handleEditorChange = (content: string) => {
    setInputValue(content)
  }

  // 图片上传回调（用于粘贴插件）
  const handleImageUpload = async (
    file: File
  ): Promise<{ url: string; name: string } | null> => {
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      message.warning(`${file.name} 不是图片文件`)
      return null
    }

    try {
      // 上传到 OSS
      const url = await uploadImage(file)
      return { url, name: file.name }
    } catch (error) {
      console.error("上传失败:", error)
      message.error("上传失败，请重试")
      return null
    }
  }

  // 点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择 - 先插入 loading 节点，后台上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const editor = editorRef.current
    if (!editor) return

    const imageFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        message.warning(`${file.name} 不是图片文件`)
        return false
      }
      return true
    })

    if (imageFiles.length === 0) return

    // 一次性插入所有 loading 节点，在回调内拿到 nodeKey 后发起上传
    editor.update(() => {
      const selection = $getSelection()
      if (!selection) return

      for (const file of imageFiles) {
        const imageNode = $createImageTagNode("", file.name)
        selection.insertNodes([imageNode])
        const capturedKey = imageNode.getKey()

        uploadImage(file)
          .then((url) => {
            editor.update(() => {
              const node = $getNodeByKey(capturedKey)
              if (node && $isImageTagNode(node)) {
                node.setSrc(url)
              }
            })
          })
          .catch((error) => {
            console.error("上传失败:", error)
            message.error(`${file.name} 上传失败`)

            editor.update(() => {
              const node = $getNodeByKey(capturedKey)
              if (node && $isImageTagNode(node)) {
                node.remove()
              }
            })
          })
      }
    })

    // 清空 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header - Logo */}
      <header className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Zivision</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 pt-32">
        {/* Title Section */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">Z</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Zivision 让设计更简单
          </h1>
        </div>

        <p className="text-gray-400 mb-8">懂你的设计代理，帮你搞定一切</p>

        {/* Input Box */}
        <div className="w-full max-w-2xl mb-6">
          <div className="min-h-[120px] w-full rounded-2xl p-3 flex flex-col justify-between gap-2 text-base bg-[#F7F7F7] border border-[#E3E3E3] focus-within:border-gray-400 transition-colors">
            {/* Lexical Editor Area */}
            <div className="relative flex-1 w-full">
              <ZivisionEditor
                placeholder="让 Zivision 打造引人注目的社交媒体视觉"
                onEditorReady={handleEditorReady}
                onChange={handleEditorChange}
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Bottom Toolbar */}
            <div className="flex w-full items-end justify-between text-sm">
              {/* Left - Attachment Button */}
              <div className="flex h-8 items-center gap-[2px]">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleUploadClick}
                  className="flex items-center justify-center w-8 h-8 rounded-full border-[0.5px] border-[#C4C4C4] bg-transparent text-[#363636] hover:bg-[#0C0C0D0A] active:bg-[#0C0C0D14] cursor-pointer transition-[border-color,background-color] duration-100 ease-in-out"
                  title="上传图片"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                {/* 图片计数徽章 */}
                {imageCount > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    {imageCount} 张图片
                  </span>
                )}
              </div>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <button
                  className="h-8 min-w-8 rounded-full bg-[#2F3640] text-white flex items-center justify-center hover:bg-[#4A535F] active:bg-[#191E26] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  title="发送"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects - Only show if there are projects */}
        {recentProjects.length > 0 && (
          <div className="w-full max-w-4xl px-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              最近项目
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="aspect-4/3 bg-gray-100 flex items-center justify-center">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-300 text-4xl">📄</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      更新于 {project.updatedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
