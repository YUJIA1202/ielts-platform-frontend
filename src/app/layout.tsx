import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '雅思写作 | IELTS Writing Pro',
  description: '专业雅思写作备考平台',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}