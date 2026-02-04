
'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { LogOut, LayoutDashboard, ClipboardList, ChevronDown, FileUp, FileText, FileSpreadsheet, History, User as UserIcon, ArrowUpToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


interface User {
  name: string;
  upc: string; // Keep upc as it's needed for filtering
  avatar?: string;
}

// Wrapper component to access sidebar context
function NavContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const { setOpenMobile } = useSidebar(); // Access the context here
  const isMobile = useIsMobile();


  React.useEffect(() => {
    const updateUser = () => {
        try {
          const storedUser = localStorage.getItem('loggedInUser');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
        }
    };
    
    updateUser();

    // Listen for storage changes to update avatar across tabs
    window.addEventListener('storage', updateUser);
    return () => {
        window.removeEventListener('storage', updateUser);
    };
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) {
      setOpenMobile(false); // Close mobile sidebar on navigation
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    handleNavigate('/login');
  };
  
  const isBroadcastActive = pathname.startsWith('/pdf-broadcast') || pathname.startsWith('/xlsx-broadcast');

  return (
    <>
        <SidebarHeader>
           <button
              onClick={() => handleNavigate('/dashboard')}
              className="flex items-center gap-2 text-primary"
            >
            <Image src="/logo.ico" alt="App Logo" width={40} height={40} />
            <span className="font-headline text-lg">NAVIGA</span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate('/dashboard')}
                isActive={pathname.startsWith('/dashboard')}
                tooltip="Dashboard"
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate('/tasks')}
                isActive={pathname.startsWith('/tasks')}
                tooltip="Lacak Tugas"
              >
                <ClipboardList />
                <span>Lacak Tugas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Jatuh Tempo Broadcast Dropdown */}
             <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <button
                      className={cn(
                        'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 h-8',
                         isBroadcastActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      )}
                    >
                      <FileUp />
                      <span>Broadcast</span>
                      <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200" />
                    </button>
                  </DropdownMenuTrigger>
                   <DropdownMenuContent 
                        className="w-56" 
                        align="start" 
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={isMobile ? 4 : 10}
                    >
                    <DropdownMenuLabel>Pilih Jenis Broadcast</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('/pdf-broadcast')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Gadaian Broadcast</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate('/xlsx-broadcast')}>
                       <FileSpreadsheet className="mr-2 h-4 w-4" />
                      <span>Angsuran Broadcast</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleNavigate('/history')}
                isActive={pathname.startsWith('/history')}
                tooltip="Riwayat"
              >
                <History />
                <span>Riwayat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                   <p className="text-xs text-muted-foreground">
                    {user?.upc === 'all' ? 'Super Admin' : user?.upc}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => handleNavigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
    </>
  );
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <NavContent />
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-40 h-16 items-center gap-4 border-b bg-background px-4 md:px-6 flex justify-between">
            <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden" />
                 <div className="hidden md:flex items-center gap-2 text-lg font-semibold text-primary">
                    <Image src="/logo.ico" alt="App Logo" width={40} height={40} />
                    <span className="font-headline">NAVIGA</span>
                 </div>
            </div>
            <div className="flex items-center">
              <Image 
                src="/PegadaianLogo.png"
                alt="Logo Pegadaian"
                width={120}
                height={40}
                priority
              />
            </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
