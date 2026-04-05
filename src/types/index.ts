export interface Question {
  id: number
  task: 'TASK1' | 'TASK2'
  subtype: string | null
  topic: string | null
  content: string
  outline: string | null
  imageUrl: string | null
  source: string | null
  year: number | null
  month: number | null
  createdAt: string
}


export interface Essay {
  id: number
  questionId: number
  content?: string
  pdfUrl: string | null
  annotatedPdfUrl: string | null
  score: number | null
  createdAt: string
}

export interface Submission {
  id: number
  userId: number
  questionId: number | null
  customPrompt: string | null
  content: string | null
  status: 'PENDING' | 'REVIEWED'
  score: number | null
  feedbackUrl: string | null
  createdAt: string
  question?: Question
}

export interface Video {
  id: number
  title: string
  description: string | null
  vodFileId: string
  task: 'TASK1' | 'TASK2' | null
  subtype: string | null
  duration: number | null
  createdAt: string
}