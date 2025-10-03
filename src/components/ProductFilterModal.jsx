'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Field organization for better UX
const FILTER_SECTIONS = {
  basic: {
    title: 'Basic Specifications',
    fields: ['Size', 'Power (W)', 'Voltage', 'CCT', 'CRI/RA', 'Lumen', 'Efficacy (lm/W)']
  },
  technical: {
    title: 'Technical Details',
    fields: ['Dimming Type', 'Material Finish', 'Mounting', 'Certifications']
  },
  features: {
    title: 'Additional Features',
    fields: ['Plug-in Sensor', 'Emergency Backup', 'Junction Cover', 'Remote Control', 'Installation Kits', 'Adjustment Dial']
  }
};

const keyDescriptions = {
  'Size': 'Size',
  'Power (W)': 'Power (W)',
  'Voltage': 'Voltage',
  'CCT': 'CCT',
  'CRI/RA': 'CRI/RA',
  'Lumen': 'Lumen',
  'Efficacy (lm/W)': 'Efficacy (lm/W)',
  'Dimming Type': 'Dimming Type',
  'Material Finish': 'Material Finish',
  'Mounting': 'Mounting',
  'Certifications': 'Certifications',
  'Plug-in Sensor': 'Plug-in Sensor',
  'Emergency Backup': 'Emergency Backup',
  'Junction Cover': 'Junction Cover',
  'Remote Control': 'Remote Control',
  'Installation Kits': 'Installation Kits',
  'Adjustment Dial': 'Adjustment Dial'
};

const ProductFilterModal = ({
  isOpen,
  onClose,
  filters = {},
  onApplyFilters,
  availableOptions = {},
  type = 'indoor',
  productType = ''
}) => {
  const [selectedFilters, setSelectedFilters] = useState(filters);

  useEffect(() => {
    setSelectedFilters(filters);
  }, [filters]);

  const handleFilterChange = (fieldKey, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [fieldKey]: value === 'all' ? null : value
    }));
  };

  const handleApplyFilters = () => {
    // Remove null values before applying
    const cleanFilters = Object.fromEntries(
      Object.entries(selectedFilters).filter(([_, value]) => value !== null && value !== '')
    );
    onApplyFilters(cleanFilters);
    onClose();
  };

  const handleResetAll = () => {
    setSelectedFilters({});
    onApplyFilters({});
    onClose();
  };

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).filter(value => value !== null && value !== '').length;
  };

  const getThemeGradient = () => {
    return type === 'indoor' 
      ? 'from-blue-500/20 via-purple-500/20 to-blue-600/20'
      : 'from-green-500/20 via-teal-500/20 to-green-600/20';
  };

  const getThemeAccent = () => {
    return type === 'indoor' ? 'text-blue-600' : 'text-green-600';
  };

  const renderFilterSection = (sectionKey, section) => {
    const availableFields = section.fields.filter(field => 
      availableOptions[field] && availableOptions[field].length > 0
    );

    if (availableFields.length === 0) return null;

    return (
      <AccordionItem key={sectionKey} value={sectionKey}>
        <AccordionTrigger className="text-left font-semibold">
          {section.title}
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {availableFields.filter(field => selectedFilters[field]).length} active
            </Badge>
          )}
        </AccordionTrigger>
        <AccordionContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {availableFields.map(fieldKey => (
              <div key={fieldKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {keyDescriptions[fieldKey] || fieldKey}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {availableOptions[fieldKey]?.length || 0} options
                  </Badge>
                </div>
                <Select
                  value={selectedFilters[fieldKey] || 'all'}
                  onValueChange={(value) => handleFilterChange(fieldKey, value)}
                >
                  <SelectTrigger className={`h-11 transition-all hover:border-primary/50 ${
                    selectedFilters[fieldKey] ? 'border-primary/50 bg-primary/5 shadow-md' : ''
                  }`}>
                    <SelectValue placeholder="All" />
                    {selectedFilters[fieldKey] && (
                      <CheckCircle2 className="h-4 w-4 text-primary ml-2" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {availableOptions[fieldKey]?.map((option, index) => (
                      <SelectItem key={`${fieldKey}-${index}-${option}`} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  const ModalContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${getThemeGradient()} border-b border-primary/20`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${getThemeAccent()}`}>
              Filter {productType}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select your preferred specifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <Badge variant="default" className="bg-primary">
                {getActiveFilterCount()} filters active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <Accordion type="multiple" defaultValue={['basic']} className="w-full space-y-4">
          {Object.entries(FILTER_SECTIONS).map(([key, section]) =>
            renderFilterSection(key, section)
          )}
        </Accordion>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 border-t border-primary/20 bg-gradient-to-r from-background/50 to-muted/50">
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleResetAll}
            className="flex-1 transition-all hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
          >
            Reset All
          </Button>
          <Button
            onClick={handleApplyFilters}
            className={`flex-1 bg-gradient-to-r ${
              type === 'indoor' 
                ? 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
            } text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]`}
          >
            Apply {getActiveFilterCount() > 0 ? `${getActiveFilterCount()} ` : ''}Filters
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] sm:w-[90vw] max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden border-0">
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};

export default ProductFilterModal;
