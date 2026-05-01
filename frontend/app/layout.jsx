import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'ContentAI — Tạo nội dung viral bằng AI',
  description: 'Tạo title, script, caption, hashtag viral cho YouTube, TikTok, Facebook chỉ trong vài giây.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
