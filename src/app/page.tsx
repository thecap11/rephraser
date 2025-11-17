
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateDocument } from '@/app/actions';
import JournalForm from '@/components/journal-form';
import DownloadSection from '@/components/download-section';
import { LogOut, Wand2, Loader2, ShieldAlert, Clock } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useFirestore } from "@/firebase";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import AdminPanel from '@/components/admin-panel';

type GeneratedFileData = {
  filename: string;
  content: string;
};

// In a real application, this would be determined by custom claims or a database role.
const ADMIN_EMAIL = 'admin@aurora.com';

type UserProfile = {
  email: string;
  status: 'pending' | 'active' | 'banned';
  createdAt: any;
}

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<GeneratedFileData | null>(
    null
  );
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return doc(firestore, "users", user.uid);
  }, [user?.uid, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleFormSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to generate a document.',
      });
      router.push('/login');
      return;
    }

    setIsGenerating(true);
    setGeneratedFile(null);

    const result = await generateDocument(data);

    setIsGenerating(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error,
      });
    } else if (result.filename && result.content) {
      setGeneratedFile({
        filename: result.filename,
        content: result.content,
      });
      toast({
        title: 'Success!',
        description: 'Your rephrased journal is ready for download.',
      });
    }
  };

  const handleReset = () => {
    setGeneratedFile(null);
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const renderContent = () => {
    if (isUserLoading || (user && isProfileLoading)) {
      return (
         <div className="flex flex-col items-center justify-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your workspace...</p>
          </div>
      );
    }

    if (!user) {
       // Should be handled by useEffect, but as a fallback
       return null;
    }

    if (isAdmin) {
      return <AdminPanel />;
    }

    if (userProfile) {
       switch (userProfile.status) {
        case 'active':
          return generatedFile ? (
            <DownloadSection
              filename={generatedFile.filename}
              content={generatedFile.content}
              onReset={handleReset}
            />
          ) : (
            <JournalForm
              onSubmit={handleFormSubmit}
              isLoading={isGenerating}
            />
          );
        case 'pending':
          return (
            <div className="text-center p-8 bg-card border rounded-lg shadow-sm">
                <Clock className="mx-auto h-12 w-12 text-primary mb-4"/>
                <h2 className="text-2xl font-bold font-headline mb-2">Account Pending Approval</h2>
                <p className="text-muted-foreground">
                    Your account is currently awaiting administrator approval. Please check back later.
                </p>
            </div>
          )
        case 'banned':
             return (
                <div className="text-center p-8 bg-card border border-destructive/50 rounded-lg shadow-sm">
                    <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4"/>
                    <h2 className="text-2xl font-bold font-headline mb-2">Access Restricted</h2>
                    <p className="text-muted-foreground">
                        Your account has been suspended. Please contact support for more information.
                    </p>
                </div>
            )
        default:
          return <p>Unknown account status.</p>;
      }
    }
     return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying account...</p>
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8 relative">
          {user && (
             <div className="absolute top-0 right-0">
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          )}
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-3">
            <Wand2 className="h-10 w-10" />
            Journal Reframer
          </h1>
           {user && !isAdmin && (
             <p className="text-muted-foreground mt-2 text-lg">
                Effortlessly rephrase and personalize your reflective journals.
             </p>
            )}
        </header>

        {renderContent()}

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} xorvexra xod3. All Rights Reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
