'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Building2, Plus, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCompanies } from '@/hooks/use-companies';

interface CompanySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySelector = ({ isOpen, onClose }: CompanySelectorProps) => {
  const router = useRouter();
  const { companies, isLoading: loading } = useCompanies();

  // Auto-redirect logic when companies load
  useEffect(() => {
    if (isOpen && !loading) {
      if (companies.length === 0) {
        router.push('/company/create');
        onClose();
      } else if (companies.length === 1) {
        router.push(`/company/${companies[0].id}`);
        onClose();
      }
    }
  }, [isOpen, loading, companies, router, onClose]);

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
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-indigo-600" />
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
};

export default CompanySelector;
