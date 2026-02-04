
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Customer } from '@/types';
import {
  MapPin,
  Phone,
  Clock,
  Building,
  Map,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpcProfileData {
  name: string;
  address: string;
  phone: string;
  operatingHours: string;
  description: string;
  mapUrl: string;
  streetViewUrl: string;
  staff: {
    penaksir: { name: string; nip: string; avatar: string };
    kasir: { name: string; nip: string; avatar: string };
  };
}

const upcProfiles: Record<Customer['upc'] | 'all', UpcProfileData> = {
  'Pegadaian Wanea': {
    name: 'UPC Wanea',
    address: 'Jl. Sam Ratulangi No.54, Tanjung Batu, Kec. Wanea, Kota Manado, Sulawesi Utara',
    phone: '081142582666',
    operatingHours: 'Senin - Jumat: 08:00 - 15.30 dan Sabtu: 08:00 - 12:30',
    description:
      'Melayani area Wanea dan sekitarnya dengan fokus pada gadai emas dan pinjaman modal usaha.',
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.520849202575!2d124.8398473152103!3d1.4746654989688465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3287745d8d80f833%3A0xe54d898516b18861!2sPegadaian%20UPC%20Wanea!5e0!3m2!1sen!2sid!4v1622013992789!5m2!1sen!2sid',
    streetViewUrl:
      'https://www.google.com/maps/embed?pb=!4v1756820019859!6m8!1m7!1sURTplg6edk2jkLO08BLxXg!2m2!1d1.471982700633795!2d124.8378581836489!3f62.93597041625598!4f5.839056400493703!5f0.7820865974627469',
    staff: {
      penaksir: {
        name: 'Christa Jashinta Paat',
        nip: 'P85395',
        avatar: 'https://placehold.co/100x100/EEDD82/000000?text=CP',
      },
      kasir: {
        name: 'Miranda Melina Irene Turangan',
        nip: 'ERA00362',
        avatar: 'https://placehold.co/100x100/D8BFD8/000000?text=MT',
      },
    },
  },
  'Pegadaian Ranotana': {
    name: 'UPC Ranotana',
    address: 'Jl. Sam Ratulangi No.400, Ranotana, Kec. Sario, Kota Manado, Sulawesi Utara',
    phone: '081142584666',
    operatingHours: 'Senin - Jumat: 08.00 - 15.30 dan Sabtu 08.00 - 12.30',
    description:
      'Melayani area Ranotana dan sekitarnya dengan fokus pada gadai emas dan pinjaman modal usaha.',
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.54228945415!2d124.83561267600445!3d1.4608375983758362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x328774e1d3e1d3e1%3A0x6d3c63a6e62b66e!2sPegadaian%20UPC%20Ranotana!5e0!3m2!1sen!2sid!4v1719890457613!5m2!1sen!2sid',
    streetViewUrl:
      'https://www.google.com/maps/embed?pb=!4v1757025554312!6m8!1m7!1s5mCy8QOf5heM7-wbaR-aZw!2m2!1d1.46083288707316!2d124.8378025946448!3f290.59495153922313!4f-0.5931369050220923!5f0.7820865974627469',
    staff: {
      penaksir: {
        name: 'Fandy Phispal',
        nip: 'P86446',
        avatar: 'https://placehold.co/100x100/A0E6E6/000000?text=FP',
      },
      kasir: {
        name: 'Novi Mohede',
        nip: 'ERA00363',
        avatar: 'https://placehold.co/100x100/FFC0CB/000000?text=NM',
      },
    },
  },
  'N/A': {
    // Fallback for customers without a clear UPC
    name: 'Kantor Cabang',
    address: 'N/A',
    phone: 'N/A',
    operatingHours: 'N/A',
    description: 'Informasi cabang tidak tersedia.',
    mapUrl: '',
    streetViewUrl: '',
    staff: {
      penaksir: { name: 'N/A', nip: 'N/A', avatar: '' },
      kasir: { name: 'N/A', nip: 'N/A', avatar: '' },
    },
  },
  all: {
    // For Super Admin
    name: 'Kantor Pusat Pegadaian',
    address: 'Jl. Kramat Raya No.162, Jakarta Pusat',
    phone: '(021) 123-4567',
    operatingHours: 'Senin - Jumat: 08:00 - 17:00',
    description:
      'Dashboard Super Admin. Mengawasi seluruh operasional Unit Pelayanan Cabang.',
    mapUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.529126294488!2d106.845553315228!3d-6.19543199551694!2m3!1f0!2f0!3f0!3m2!1i1024!2i780!4f13.1!3m3!1m2!1s0x2e69f441b53e7c81%3A0x1d6a6c2a13f2a71!2sPT%20Pegadaian%20(Persero)%20Kantor%20Pusat!5e0!3m2!1sen!2sid!4v1622014120894!5m2!1sen!2sid',
    streetViewUrl:
      'https://www.google.com/maps/embed?pb=!1m0!4v1719217141382!6m8!1m7!1sCAoSLEFGMVFpcE5pTXZET21YNnFLdGdMQS1EM1pUcU5sYVdZb2dZWFItb2YxcmNP!2m2!1d-6.1953589!2d106.8455844!3f314.94!4f-2.22!5f0.7820865974627469',
    staff: {
      penaksir: { name: 'System', nip: 'N/A', avatar: '' },
      kasir: { name: 'System', nip: 'N/A', avatar: '' },
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [userUpc, setUserUpc] = React.useState<keyof typeof upcProfiles>('all');
  const [mapView, setMapView] = React.useState<'map' | 'street'>('map');

  // Auth and data loading effect
  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const storedUser = localStorage.getItem('loggedInUser');
      const upc = storedUser ? JSON.parse(storedUser).upc : 'all';
      setUserUpc(upc === 'all' ? 'all' : upc);
    } catch (error) {
      console.error('Failed to process data from localStorage', error);
    }
  }, [router]);

  const profileData = upcProfiles[userUpc] || upcProfiles['N/A'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight font-headline">
            Profil Unit Pelayanan Cabang (UPC)
          </h1>
        </div>

        <div className="grid gap-6">
          {/* UPC Profile Card */}
          <Card className="transition-shadow duration-200 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Building className="h-6 w-6 text-primary" />
                Profil {profileData.name}
              </CardTitle>
              <CardDescription>{profileData.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Informasi Cabang</h4>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <span>{profileData.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{profileData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{profileData.operatingHours}</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-2 right-2 z-10 bg-background/70 p-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={mapView === 'map' ? 'secondary' : 'ghost'}
                    onClick={() => setMapView('map')}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={mapView === 'street' ? 'secondary' : 'ghost'}
                    onClick={() => setMapView('street')}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden border aspect-video">
                  {profileData.mapUrl ? (
                    <iframe
                      key={mapView}
                      src={
                        mapView === 'map'
                          ? profileData.mapUrl
                          : profileData.streetViewUrl
                      }
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      Peta tidak tersedia
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {userUpc !== 'all' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Staff Cards */}
            <Card className="transition-shadow duration-200 hover:shadow-xl">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profileData.staff.penaksir.avatar} />
                  <AvatarFallback>
                    {profileData.staff.penaksir.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base md:text-lg">Penaksir</CardTitle>
                  <p className="text-sm md:text-base font-semibold">
                    {profileData.staff.penaksir.name}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    NIP: {profileData.staff.penaksir.nip}
                  </p>
                </div>
              </CardHeader>
            </Card>
            <Card className="transition-shadow duration-200 hover:shadow-xl">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profileData.staff.kasir.avatar} />
                  <AvatarFallback>
                    {profileData.staff.kasir.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base md:text-lg">Kasir</CardTitle>
                  <p className="text-sm md:text-base font-semibold">
                    {profileData.staff.kasir.name}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    NIP: {profileData.staff.kasir.nip}
                  </p>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
