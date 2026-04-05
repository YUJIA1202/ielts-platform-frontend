const words = [
  { text: 'IELTS Writing 7', size: 28, top: '6%', left: '3%', rotate: -12, delay: 0, duration: 3.2 },
  { text: '雅思 7.5', size: 36, top: '4%', left: '38%', rotate: 8, delay: 0.5, duration: 2.8 },
  { text: 'IELTS 8', size: 24, top: '3%', left: '70%', rotate: -6, delay: 1.0, duration: 3.5 },
  { text: 'IELTS Writing 7.5', size: 22, top: '18%', left: '62%', rotate: 14, delay: 0.3, duration: 2.6 },
  { text: '雅思 8', size: 40, top: '22%', left: '18%', rotate: -10, delay: 0.8, duration: 3.8 },
  { text: 'Band 7.5', size: 30, top: '35%', left: '78%', rotate: 5, delay: 1.2, duration: 2.9 },
  { text: 'IELTS Writing 8', size: 26, top: '42%', left: '5%', rotate: -15, delay: 0.2, duration: 3.1 },
  { text: '雅思 6.5', size: 34, top: '55%', left: '45%', rotate: 11, delay: 0.7, duration: 3.4 },
  { text: 'IELTS 7.5', size: 28, top: '60%', left: '72%', rotate: -7, delay: 1.5, duration: 2.7 },
  { text: 'IELTS Writing 6.5', size: 22, top: '68%', left: '12%', rotate: 9, delay: 0.4, duration: 3.6 },
  { text: 'Band 8', size: 38, top: '74%', left: '58%', rotate: -13, delay: 0.9, duration: 3.0 },
  { text: '雅思 7', size: 32, top: '80%', left: '28%', rotate: 6, delay: 1.3, duration: 2.5 },
  { text: 'IELTS 6.5', size: 26, top: '86%', left: '70%', rotate: -9, delay: 0.6, duration: 3.3 },
  { text: 'IELTS Writing 8.5', size: 24, top: '90%', left: '4%', rotate: 12, delay: 1.1, duration: 2.8 },
  { text: 'Band 9', size: 42, top: '48%', left: '32%', rotate: -5, delay: 0.1, duration: 3.7 },
]

export default function BgWords() {
  return (
    <div className="bg-canvas">
      {words.map((w, i) => (
        <div
          key={i}
          className="bg-word"
          style={{
            fontSize: `${w.size}px`,
            top: w.top,
            left: w.left,
            ['--rotate' as string]: `${w.rotate}deg`,
            animation: `float-up-down ${w.duration}s ease-in-out ${w.delay}s infinite`,
          }}
        >
          {w.text}
        </div>
      ))}
    </div>
  )
}