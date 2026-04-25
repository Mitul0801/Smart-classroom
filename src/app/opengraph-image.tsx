import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'radial-gradient(circle at top left, rgba(129,140,248,0.45), transparent 35%), radial-gradient(circle at bottom right, rgba(168,85,247,0.4), transparent 30%), #050816',
          color: 'white',
          padding: '56px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            SC
          </div>
          <div style={{ display: 'flex', fontSize: 34, opacity: 0.9 }}>SmartClass AI</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            AI-powered classrooms for teachers and students
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 30, opacity: 0.8, maxWidth: 850 }}>
            Summaries, quizzes, assignments, analytics, shared notes, and live learning signals in one platform.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
