import React, { useState, useEffect } from 'react';
import { Dna, Network, BrainCircuit, Activity, Search, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConceptGene {
  id: string;
  concept_name: string;
  requires: string[];
  leads_to: string[];
  abstractness: number;
  calculation_load: number;
  visualization_need: number;
  memory_difficulty: number;
  misconceptions: string[];
  real_world_uses: string[];
  mastery_level: number;
  decay_rate: number;
}

export default function Genome() {
  const [genome, setGenome] = useState<ConceptGene[]>([]);
  const [selectedGene, setSelectedGene] = useState<ConceptGene | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchGenome = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/dna', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGenome(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchGenome();
  }, []);

  const handleDeleteGene = async (id: string) => {
    if (!confirm('Are you sure you want to delete this concept from your Knowledge DNA?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/dna/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGenome(prev => prev.filter(g => g.id !== id));
        if (selectedGene?.id === id) {
          setSelectedGene(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredGenome = genome.filter(g => g.concept_name.toLowerCase().includes(search.toLowerCase()));

  const GeneBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center space-x-3">
            <Dna className="w-8 h-8 text-primary" />
            <span>Knowledge Genome</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Your biological model of understanding.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search concepts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-xl outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden pb-4 lg:pb-0">
        {/* Genome Grid */}
        <div className="flex-1 border rounded-2xl bg-card shadow-sm p-4 md:p-6 overflow-y-auto min-h-0">
          {genome.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Network className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Your genome is empty.</p>
              <p className="text-sm mt-1">Compile notes in the Notes workspace to extract Knowledge DNA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGenome.map((gene) => (
                <button
                  key={gene.id}
                  onClick={() => setSelectedGene(gene)}
                  className={cn(
                    "text-left p-5 border rounded-xl transition-all duration-300 hover:shadow-md hover:border-primary/50 group relative overflow-hidden",
                    selectedGene?.id === gene.id ? "border-primary bg-primary/5 shadow-sm" : "bg-muted/10"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="w-24 h-24" />
                  </div>
                  <h3 className="font-bold text-lg mb-4 relative z-10">{gene.concept_name}</h3>
                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Mastery</span>
                      <span className={cn("font-medium", gene.mastery_level > 0.7 ? "text-emerald-500" : "text-amber-500")}>
                        {(gene.mastery_level * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Dependencies</span>
                      <span className="font-medium text-foreground">{gene.requires?.length || 0}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gene Inspector */}
        <div className="w-full lg:w-[450px] border rounded-2xl bg-card shadow-sm flex flex-col shrink-0 h-[40vh] lg:h-auto min-h-0 overflow-hidden">
          <div className="p-4 border-b bg-muted/10 font-semibold flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Gene Inspector</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedGene ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center px-8">
                Select a concept from your genome to inspect its DNA sequence.
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGene.concept_name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Source DNA compiled successfully.</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteGene(selectedGene.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete Concept"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Cognitive Profile</h3>
                  <GeneBar label="Abstractness" value={selectedGene.abstractness} colorClass="bg-purple-500" />
                  <GeneBar label="Calculation Load" value={selectedGene.calculation_load} colorClass="bg-blue-500" />
                  <GeneBar label="Spatial Visualization" value={selectedGene.visualization_need} colorClass="bg-emerald-500" />
                  <GeneBar label="Memory Difficulty" value={selectedGene.memory_difficulty} colorClass="bg-rose-500" />
                </div>

                {selectedGene.misconceptions && selectedGene.misconceptions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Known Mutations (Misconceptions)</h3>
                    <ul className="list-disc list-inside text-sm space-y-2 text-destructive/80">
                      {selectedGene.misconceptions.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedGene.requires && selectedGene.requires.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Prerequisite Genes</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedGene.requires.map((r, i) => (
                        <span key={i} className="px-2 py-1 bg-muted rounded-md text-xs font-medium">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedGene.real_world_uses && selectedGene.real_world_uses.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Phenotype (Real World Uses)</h3>
                    <ul className="list-disc list-inside text-sm space-y-2">
                      {selectedGene.real_world_uses.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
