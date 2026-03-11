import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export function PlantConfig() {
  const [species, setSpecies] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getPlantConfig();
        if (data) {
          setSpecies(data.species || '');
          setName(data.name || '');
        }
      } catch (err) {
        console.error('Failed to load plant config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await api.updatePlantConfig({ species, name });
      setFeedback('success');
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to save plant config:', err);
      setFeedback('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col gap-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
        <div className="h-10 bg-gray-100 rounded animate-pulse w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 relative">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Plant Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plant-name">Plant Name (Optional)</Label>
          <Input 
            id="plant-name" 
            placeholder="e.g. My Favorite Fern" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plant-species">Plant Species</Label>
          <Input 
            id="plant-species" 
            placeholder="e.g. Monstera Deliciosa" 
            value={species} 
            onChange={(e) => setSpecies(e.target.value)} 
            data-testid="species-input"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          data-testid="save-species"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
        
        <div className="h-6 relative flex items-center">
          <AnimatePresence>
            {feedback === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-medium text-emerald-600"
              >
                Saved!
              </motion.div>
            )}
            {feedback === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-medium text-red-600"
              >
                Failed to save. Please try again.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
