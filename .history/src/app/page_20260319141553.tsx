"use client";
import React, { useState } from 'react';
import { Upload, Input, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const { Dragger } = Upload;
const { TextArea } = Input;

export default function AIStudio() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]); // 存储生成的图片URL

  // 模拟生成图片的逻辑
  const handleGenerate = () => {
    if (!prompt) return message.warning('请输入提示词');
    message.loading('AI 正在努力绘画中...');
    // 模拟调用 API 返回一张图
    setTimeout(() => {
      setImages([...images, `https://picsum.photos/400/300?random=${Math.random()}`]);
      message.success('生成成功！');
    }, 2000);
  };

  return (
    <main className="flex h-screen w-full bg-gray-50">
      {/* 左侧：操作区 (30% 宽度) */}
      <section className="w-[350px] border-r bg-white p-6 flex flex-col gap-6 shadow-sm">
        <h2 className="text-xl font-bold border-b pb-4">AI 控制台</h2>
        
        <div>
          <p className="mb-2 font-medium">1. 上传参考图</p>
          <Dragger 
            multiple={false} 
            action="/api/upload" // 这里对接你的 Next.js API 或直接 OSS
            className="bg-gray-50"
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽图片到此处</p>
          </Dragger>
        </div>

        <div>
          <p className="mb-2 font-medium">2. 输入提示词</p>
          <TextArea 
            rows={6} 
            placeholder="描述你想要的画面..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <Button type="primary" size="large" onClick={handleGenerate} className="w-full h-12">
          立即生成图片
        </Button>
      </section>

      {/* 右侧：画布展示区 (自适应剩余宽度) */}
      <section className="flex-1 relative overflow-hidden bg-[#e5e7eb]">
        <div className="absolute top-4 left-4 z-10 bg-white/80 px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
          💡 提示：按住鼠标左键拖动，滚轮放大缩小
        </div>
        
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* 右上角控制按钮 */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button onClick={() => zoomIn()}>+</Button>
                <Button onClick={() => zoomOut()}>-</Button>
                <Button onClick={() => resetTransform()}>重置</Button>
              </div>

              <TransformComponent wrapperClass="!w-full !h-full">
                <div className="flex flex-wrap gap-8 p-20 min-w-[2000px] min-h-[2000px]">
                  {images.map((url, index) => (
                    <div 
                      key={index} 
                      className="bg-white p-2 shadow-2xl rounded-lg cursor-move hover:ring-2 ring-blue-500 transition-all"
                    >
                      <img src={url} alt="Generated" className="max-w-[300px] rounded" />
                      <p className="text-[10px] text-gray-400 mt-2">ID: #{index + 1}</p>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <div className="text-gray-400 mt-40 ml-40 text-lg italic">
                      生成的图片将在这里自由排布...
                    </div>
                  )}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </section>
    </main>
  );
}