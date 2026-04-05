import './globals.css';

export const metadata = {
  title: 'Shorewatch | Coral Care',
  description: 'Social intelligence for Coral Care',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
