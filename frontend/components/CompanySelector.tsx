'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  _count?: {
    jobs: number;
  };
}

interface CompanySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanySelector({ isOpen, onClose }: CompanySelectorProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies');
      if (response.success) {
        const companiesData = response.data?.companies || response.data?.data?.companies || [];
        setCompanies(companiesData);

        // If no companies, automatically redirect to create company page
        if (companiesData.length === 0) {
          router.push('/company/create');
          onClose();
        }
        // If exactly one company, automatically navigate to it
        else if (companiesData.length === 1) {
          router.push(`/company/${companiesData[0].id}`);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (companyId: string) => {
    router.push(`/company/${companyId}`);
    onClose();
  };

  const handleCreateCompany = () => {
    router.push('/company/create');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Company</DialogTitle>
          <DialogDescription>
            Choose a company to manage and post jobs
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20 animate-pulse" />
              <p className="text-sm">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm mb-4">No companies yet</p>
              <Button onClick={handleCreateCompany}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Company
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company.id)}
                  className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {company.logo ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">{company.name}</h4>
                      <p className="text-xs text-gray-500">
                        {company._count?.jobs || 0} job{company._count?.jobs !== 1 ? 's' : ''} posted
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCreateCompany}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Company
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
