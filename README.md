# 雅思写作平台 — 前端

Next.js 14 + TypeScript 搭建的雅思写作学习平台。

## 技术栈

- Next.js 14 / TypeScript
- Tailwind CSS 响应式布局
- App Router + SSR

## 主要功能

**用户端**
- 真题库浏览与关键词搜索
- 范文阅读与 PDF 下载（基础订阅，含水印）
- 教学视频观看（高级订阅）
- 套餐购买与订单管理
- 作文提交与批改查看
- 个人学习记录与反思笔记

**管理员端**
- 题目、范文、视频的增删改查
- 用户管理与权限调整
- 意见反馈与批改任务处理
- 资料与视频上传

## 本地运行

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 确保后端服务已在 `http://localhost:4000` 运行

## 相关仓库

后端：[ielts-platform-backend](https://github.com/YUJIA1202/ielts-platform-backend)