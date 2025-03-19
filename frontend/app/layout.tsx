import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { Roboto, Roboto_Serif, Roboto_Mono } from 'next/font/google';
import { theme } from './styles/theme';

// Font setup
const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'], 
  variable: '--font-roboto' 
});

const robotoSerif = Roboto_Serif({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'], 
  variable: '--font-roboto-serif' 
});

const robotoMono = Roboto_Mono({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'], 
  variable: '--font-roboto-mono' 
});

export const metadata: Metadata = {
  title: 'UK Income Tax Threshold Freeze Analysis | PolicyEngine',
  description: 'Analyze how extending the freeze on income tax thresholds could affect your household finances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoSerif.variable} ${robotoMono.variable}`}>
      <head>
        <link rel="icon" href="/images/policyengine-logo.png" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}