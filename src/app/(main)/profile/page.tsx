
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Building, LogOut, Save, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface UserProfile {
  name: string;
  upc: string;
  avatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    // Ensure this runs only on the client
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.avatar) {
        setAvatarPreview(parsedUser.avatar);
      }
    } else {
      // If no user data, redirect to login
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    router.push('/login');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Ukuran File Terlalu Besar",
          description: "Ukuran foto profil tidak boleh melebihi 2MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveChanges = () => {
    if (!user || !avatarPreview) return;

    const updatedUser = { ...user, avatar: avatarPreview };
    
    try {
        localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        // This is a bit of a hack to trigger the storage event for the layout
        window.dispatchEvent(new Event('storage'));
        toast({
            title: "Profil Diperbarui",
            description: "Foto profil Anda telah berhasil disimpan.",
        });
        setSelectedFile(null); // Reset file selection
    } catch(error) {
        console.error("Error saving to localStorage", error);
        toast({
            title: "Gagal Menyimpan",
            description: "Tidak dapat menyimpan foto profil. Local storage mungkin penuh.",
            variant: "destructive",
        });
    }
  };

  const handleRemovePhoto = () => {
    if (!user) return;
    // Create a new object without the avatar property
    const { avatar, ...userWithoutAvatar } = user;

    try {
        localStorage.setItem('loggedInUser', JSON.stringify(userWithoutAvatar));
        setUser(userWithoutAvatar);
        setAvatarPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        window.dispatchEvent(new Event('storage'));
        toast({
            title: "Foto Profil Dihapus",
            description: "Foto profil Anda telah berhasil dihapus.",
        });
    } catch (error) {
        console.error("Error removing photo from localStorage", error);
        toast({
            title: "Gagal Menghapus Foto",
            description: "Tidak dapat menghapus foto profil.",
            variant: "destructive",
        });
    }
  };

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8 bg-muted/20">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
             <div className="relative group">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={avatarPreview || `https://placehold.co/100x100`} alt={user.name} />
                    <AvatarFallback className="text-3xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-4 right-0 flex items-center gap-2">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                size="icon" 
                                className="rounded-full h-8 w-8"
                                title="Ubah foto profil"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                Ubah Foto
                            </DropdownMenuItem>
                            {avatarPreview && (
                                <DropdownMenuItem onClick={handleRemovePhoto} className="text-destructive focus:text-destructive">
                                    Hapus Foto
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                </div>
                <Input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleFileChange}
                />
             </div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>Detail Akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-background rounded-lg border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                    <p className="font-medium">{user.name}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 p-3 bg-background rounded-lg border">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-sm text-muted-foreground">Unit/Cabang</p>
                    <p className="font-medium">{user.upc === 'all' ? 'Semua Cabang (Super Admin)' : user.upc}</p>
                </div>
            </div>

            {selectedFile && (
                 <Button onClick={handleSaveChanges} className="w-full mt-2">
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                </Button>
            )}

             <Button onClick={handleLogout} variant="destructive" className="w-full mt-6">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
