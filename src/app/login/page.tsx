
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Image from 'next/image';
import { useAuth, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        // 2. Fetch user profile from Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        
        let userDoc;
        try {
            userDoc = await getDoc(userDocRef);
        } catch (firestoreError: any) {
             // This is where we catch the permission error for getDoc
            if (firestoreError.code === 'permission-denied') {
                const contextualError = new FirestorePermissionError({
                    operation: 'get',
                    path: userDocRef.path,
                });
                errorEmitter.emit('permission-error', contextualError);
                // We re-throw the contextual error to stop execution and let the global handler manage it
                throw contextualError;
            }
             // For other errors, we throw them as is
             throw firestoreError;
        }


        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userToStore = {
            name: userData.name || 'User',
            upc: userData.upc || 'N/A',
            avatar: userData.avatar || '',
          };

          // 3. Store non-sensitive data in localStorage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('loggedInUser', JSON.stringify(userToStore));
          
          toast({
              title: 'Login Successful',
              description: `Welcome back, ${userToStore.name}!`,
          });
          router.push('/dashboard');

        } else {
           throw new Error("User profile not found in database.");
        }
      }
    } catch (error: any) {
        // This will catch both Auth errors and our custom FirestorePermissionError
        if (error instanceof FirestorePermissionError) {
            // The global listener will handle this, but we should stop loading.
            setIsLoading(false);
            return; // Exit the function
        }

        let errorMessage = 'An error occurred during login.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             errorMessage = 'Email atau kata sandi salah. Silakan coba lagi.';
        } else if (error.message.includes("profile not found")) {
            errorMessage = 'Gagal memuat profil pengguna. Pastikan data profil ada di Firestore.';
        }
        
        toast({
            title: 'Login Failed',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        // This will run unless we returned early
        if (isLoading) {
            setIsLoading(false);
        }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl animate-in fade-in-0 slide-in-from-bottom-10 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Image src="/logo.ico" alt="App Logo" width={56} height={56} />
          </div>
          <CardTitle className="text-2xl font-headline">NAVIGA Admin</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="user@pegadaian.co.id" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    {...field} 
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log in
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </main>
  );
}
