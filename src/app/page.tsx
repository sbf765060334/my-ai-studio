"use client"

import { useState, useRef, useEffect } from "react"
import { uploadImage } from "@/lib/upload"
import Image from "next/image"

// 上传的图片类型
interface UploadedImage {
  url: string
  name: string
}

// 模拟历史项目数据类型
interface RecentProject {
  id: string
  title: string
  updatedAt: string
  thumbnail?: string
}

export default function Home() {
  const [inputValue, setInputValue] = useState("")
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
    }
  }, [inputValue])

  // 模拟历史项目数据 - 设为空数组表示没有历史记录
  const [recentProjects] = useState<RecentProject[]>([])

  // 点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        // 验证文件类型
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} 不是图片文件`)
          continue
        }

        // 上传到 OSS
        const url = await uploadImage(file)
        setUploadedImages((prev) => [...prev, { url, name: file.name }])
      }
    } catch (error) {
      console.error("上传失败:", error)
      alert("上传失败，请重试")
    } finally {
      setIsUploading(false)
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 删除已上传的图片
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
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
          <div className="min-h-[120px] w-full rounded-2xl p-3 flex flex-col justify-between gap-2 text-base bg-[#F7F7F7] border border-[#E3E3E3]">
            {/* Text Input Area */}
            <div className="relative flex-1 w-full text-sm leading-[25px] text-[#363636]">
              <textarea
                ref={textareaRef}
                placeholder="让 Zivision 打造引人注目的社交媒体视觉"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="relative z-1 w-full cursor-text px-1 bg-transparent outline-none resize-none text-sm leading-[25px] text-[#363636] placeholder-[#999]"
                style={{
                  minHeight: "56px",
                  maxHeight: "240px",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
                rows={1}
              />
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={image.url}
                      alt={image.name}
                      className="w-16 h-16 object-cover rounded-lg border border-[#E3E3E3]"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Toolbar */}
            <div className="z-1 flex w-full items-end justify-between text-sm">
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
                  disabled={isUploading}
                  className="flex items-center justify-center w-8 h-8 rounded-full border-[0.5px] border-[#C4C4C4] bg-transparent text-[#363636] hover:bg-[#0C0C0D0A] active:bg-[#0C0C0D14] cursor-pointer transition-[border-color,background-color] duration-100 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  title="上传图片"
                >
                  {isUploading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M16 1.1A4.9 4.9 0 0 1 20.9 6a4.9 4.9 0 0 1-1.429 3.457h.001l-8.414 8.587-.007.006a2.9 2.9 0 0 1-3.887.193l-.213-.192a2.9 2.9 0 0 1-.007-4.095l8.414-8.586a.9.9 0 0 1 1.286 1.26L8.23 15.216l-.007.006a1.1 1.1 0 0 0 1.556 1.555l8.407-8.579.007-.007a3.1 3.1 0 0 0 .105-4.271l-.105-.112a3.1 3.1 0 0 0-4.384 0L5.4 12.387l-.007.006a5.1 5.1 0 0 0 7.214 7.213l7.749-7.934a.9.9 0 0 1 1.288 1.256l-7.753 7.938q-.005.007-.012.014a6.9 6.9 0 0 1-9.758-9.76l8.408-8.578.007-.007A4.9 4.9 0 0 1 16 1.1"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <button
                  className="h-8 min-w-8 rounded-full bg-[#2F3640] text-white flex items-center justify-center hover:bg-[#4A535F] active:bg-[#191E26] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  title="发送"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M11.293 3.293a1 1 0 0 1 1.414 0l8 8a1 1 0 0 1-1.414 1.414L13 6.414V20a1 1 0 1 1-2 0V6.414l-6.293 6.293a1 1 0 0 1-1.414-1.414z"
                    />
                  </svg>
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
                      <Image
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
