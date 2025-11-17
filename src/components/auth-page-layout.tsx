
'use client';

import { Wand2 } from 'lucide-react';
import { ReactNode } from 'react';

type AuthPageLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  pageDescription: string;
};

export default function AuthPageLayout({
  children,
  pageTitle,
  pageDescription,
}: AuthPageLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-accent/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="w-full max-w-md z-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                  <Wand2 className="h-10 w-10 text-primary" />
                  <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                    Journal Reframer
                  </h1>
              </div>
              <h2 className="font-headline text-2xl font-semibold text-foreground">
                {pageTitle}
              </h2>
              <p className="text-muted-foreground mt-2">
                {pageDescription}
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border rounded-lg shadow-lg p-6">
                 {children}
            </div>
        </div>
    </main>
  );
}
